# Database Migration Strategy

> MongoDB + Prisma ORM migration procedures for the demo-vibe project.
> Reference: `docs/database/database-design.md` (SSoT), `prisma/schema.prisma`

---

## 1. Schema Evolution Strategy

### Development: `prisma db push`

In development, use `prisma db push` to synchronize the Prisma schema with MongoDB without generating migration files. This is the standard approach for MongoDB with Prisma since Prisma Migrate does not support MongoDB.

```bash
# Apply schema changes to the local MongoDB instance
npx prisma db push

# Regenerate the Prisma Client after schema changes
npx prisma generate
```

**Workflow:**

1. Update `docs/database/database-design.md` (SSoT) with the new schema definition.
2. Update `prisma/schema.prisma` to match the SSoT.
3. Run `npx prisma db push` to apply changes to your local MongoDB.
4. Run `npx prisma generate` to update the client.
5. Update `docker/mongo-init.js` if new collections were added.

### Production: Migration Scripts

Since Prisma does not generate SQL-style migrations for MongoDB, production schema changes are handled through **manual migration scripts** stored in `docs/database/migration/`. Each script is a standalone JavaScript file executed via `mongosh`.

**Script naming convention:**
```
V{NNN}__{description}.js
```
Examples:
- `V001__initial_schema.js`
- `V002__add_password_reset_fields.js`
- `V003__add_order_payment_method.js`

### Backward Compatibility

MongoDB is schema-flexible, so most changes are naturally backward-compatible. Follow these rules:

| Change Type | Backward Compatible? | Notes |
|-------------|---------------------|-------|
| Add optional field | Yes | Existing documents simply lack the field |
| Add required field with default | Yes | Backfill existing documents first |
| Remove field | Yes (read), No (write) | Stop writing first, then remove from schema, then clean up |
| Rename field | No | Requires a two-phase migration (see Section 2) |
| Change field type | No | Requires data transformation script |
| Add index | Yes | Build in background |
| Remove index | Yes | Drop directly |

**Rule: Never make breaking changes in a single deployment.** Use multi-phase rollouts when a change is not backward-compatible.

---

## 2. Migration Procedures

### 2.1 Adding New Fields

**With default value (safe for existing documents):**

```javascript
// V004__add_user_phone_field.js
// Add USE_TELNO field to TB_COMM_USER with empty string default

db = db.getSiblingDB("demo-vibe");

db.TB_COMM_USER.updateMany(
  { USE_TELNO: { $exists: false } },
  { $set: { USE_TELNO: "" } }
);

print("Migration V004 complete: USE_TELNO added to TB_COMM_USER");
```

**Prisma schema update:**
```prisma
model User {
  // ... existing fields
  useTelno  String  @default("") @map("USE_TELNO")
}
```

**Checklist:**
- [ ] Update `database-design.md` (SSoT)
- [ ] Update `prisma/schema.prisma`
- [ ] Write migration script with `updateMany` to backfill
- [ ] Run `npx prisma db push` in development
- [ ] Test with existing data

### 2.2 Renaming Fields

Renaming requires a **three-phase approach** to avoid downtime:

**Phase 1 -- Add new field, copy data:**
```javascript
// V005__rename_user_ncnm_phase1.js
// Copy USE_NCNM to USE_NICK_NM

db = db.getSiblingDB("demo-vibe");

db.TB_COMM_USER.find({ USE_NCNM: { $exists: true } }).forEach(function(doc) {
  db.TB_COMM_USER.updateOne(
    { _id: doc._id },
    { $set: { USE_NICK_NM: doc.USE_NCNM } }
  );
});

print("Migration V005 Phase 1 complete: data copied to USE_NICK_NM");
```

**Phase 2 -- Update application code** to read/write the new field name. Deploy this change. Ensure both old and new fields are kept in sync during the transition window.

**Phase 3 -- Remove old field:**
```javascript
// V006__rename_user_ncnm_phase3.js
// Remove old USE_NCNM field

db = db.getSiblingDB("demo-vibe");

db.TB_COMM_USER.updateMany(
  { USE_NCNM: { $exists: true } },
  { $unset: { USE_NCNM: "" } }
);

print("Migration V006 Phase 3 complete: USE_NCNM removed");
```

### 2.3 Removing Fields

**Step 1:** Remove the field from the Prisma schema and application code. Deploy.

**Step 2:** Clean up existing documents:
```javascript
// V007__remove_deprecated_field.js

db = db.getSiblingDB("demo-vibe");

db.TB_COMM_USER.updateMany(
  { DEPRECATED_FIELD: { $exists: true } },
  { $unset: { DEPRECATED_FIELD: "" } }
);

print("Migration V007 complete: DEPRECATED_FIELD removed from TB_COMM_USER");
```

**Important:** Always remove the field from application code first, deploy, then run the cleanup script. This prevents the application from trying to read a field that no longer exists.

### 2.4 Adding / Removing Indexes

**Adding an index:**
```javascript
// V008__add_product_seller_index.js

db = db.getSiblingDB("demo-vibe");

// Build index in background to avoid blocking operations
db.TB_PROD_PRD.createIndex(
  { SLLR_ID: 1, RGST_DT: -1 },
  { background: true, name: "idx_seller_products" }
);

print("Migration V008 complete: seller product index created");
```

**Removing an index:**
```javascript
// V009__drop_unused_index.js

db = db.getSiblingDB("demo-vibe");

db.TB_PROD_PRD.dropIndex("idx_old_unused_index");

print("Migration V009 complete: unused index dropped");
```

**Adding a TTL index:**
```javascript
// V010__add_ttl_login_log.js

db = db.getSiblingDB("demo-vibe");

db.TL_COMM_LGN_LOG.createIndex(
  { LGN_DT: 1 },
  { expireAfterSeconds: 7776000, name: "ttl_login_log_90d" }  // 90 days
);

print("Migration V010 complete: TTL index on LGN_DT (90 days)");
```

**Adding a text index:**
```javascript
// V011__add_text_index_products.js

db = db.getSiblingDB("demo-vibe");

db.TB_PROD_PRD.createIndex(
  { PRD_NM: "text", PRD_DC: "text", SRCH_TAGS: "text" },
  { name: "idx_product_text_search" }
);

print("Migration V011 complete: text search index on products");
```

### 2.5 Data Transformation Scripts

For complex data transformations (type changes, data restructuring):

```javascript
// V012__convert_price_to_int.js
// Convert PRD_PRC from float to integer (cents)

db = db.getSiblingDB("demo-vibe");

var bulk = db.TB_PROD_PRD.initializeUnorderedBulkOp();
var count = 0;

db.TB_PROD_PRD.find({}).forEach(function(doc) {
  bulk.find({ _id: doc._id }).updateOne({
    $set: {
      PRD_PRC: Math.round(doc.PRD_PRC * 100),
      PRD_SALE_PRC: doc.PRD_SALE_PRC ? Math.round(doc.PRD_SALE_PRC * 100) : null
    }
  });
  count++;
  if (count % 1000 === 0) {
    bulk.execute();
    bulk = db.TB_PROD_PRD.initializeUnorderedBulkOp();
    print("Processed " + count + " documents...");
  }
});

if (count % 1000 !== 0) {
  bulk.execute();
}

print("Migration V012 complete: prices converted to cents (" + count + " documents)");
```

**Best practices for data transformations:**
- Use `initializeUnorderedBulkOp()` for batch processing (1000 docs per batch).
- Always test on a staging copy of production data first.
- Log progress for long-running scripts.
- Include a verification step at the end.

---

## 3. Backup & Recovery

### 3.1 `mongodump` / `mongorestore` Procedures

**Full database backup:**
```bash
# Backup the entire demo-vibe database
mongodump \
  --uri="mongodb://username:password@host:27017" \
  --db=demo-vibe \
  --out=/backups/$(date +%Y%m%d_%H%M%S) \
  --gzip

# Backup a specific collection
mongodump \
  --uri="mongodb://username:password@host:27017" \
  --db=demo-vibe \
  --collection=TB_COMM_USER \
  --out=/backups/$(date +%Y%m%d_%H%M%S) \
  --gzip
```

**Restore from backup:**
```bash
# Restore the entire database
mongorestore \
  --uri="mongodb://username:password@host:27017" \
  --db=demo-vibe \
  --gzip \
  /backups/20260318_120000/demo-vibe

# Restore a specific collection
mongorestore \
  --uri="mongodb://username:password@host:27017" \
  --db=demo-vibe \
  --collection=TB_COMM_USER \
  --gzip \
  /backups/20260318_120000/demo-vibe/TB_COMM_USER.bson.gz
```

### 3.2 Pre-Migration Backup Checklist

Before every production migration, complete the following:

- [ ] **Backup taken** -- Full `mongodump` of the `demo-vibe` database
- [ ] **Backup verified** -- Restore the backup to a test instance and verify data integrity
- [ ] **Backup stored offsite** -- Upload to S3 / GCS / external storage
- [ ] **Migration script tested** -- Executed successfully on staging with production-like data
- [ ] **Rollback script prepared** -- Reverse migration script written and tested
- [ ] **Stakeholders notified** -- Team is aware of the migration window
- [ ] **Application health confirmed** -- No ongoing incidents before starting

### 3.3 Rollback Procedures

**Scenario 1: Migration script failed mid-execution**
1. Assess how many documents were affected.
2. Run the rollback script if available.
3. If rollback script is not viable, restore from the pre-migration backup.

**Scenario 2: Migration succeeded but application errors detected**
1. Revert the application deployment to the previous version.
2. Run the rollback script to undo data changes.
3. If rollback is not possible, restore from backup.

**Rollback script template:**
```javascript
// V005__rename_user_ncnm_ROLLBACK.js

db = db.getSiblingDB("demo-vibe");

// Reverse the data change
db.TB_COMM_USER.updateMany(
  { USE_NICK_NM: { $exists: true } },
  [
    { $set: { USE_NCNM: "$USE_NICK_NM" } },
    { $unset: "USE_NICK_NM" }
  ]
);

print("Rollback V005 complete: reverted USE_NICK_NM back to USE_NCNM");
```

---

## 4. Environment-Specific Procedures

### 4.1 Development (Local Docker)

**Full reset (destroy and recreate):**
```bash
# Stop and remove containers + volumes
docker compose down -v

# Rebuild and start fresh
docker compose up -d

# Wait for MongoDB to be ready, then push schema
sleep 3
npx prisma db push

# Seed initial data
npx prisma db seed
```

**Quick schema sync (no data loss):**
```bash
npx prisma db push
npx prisma generate
```

**Seed data reset only:**
```bash
# Connect to MongoDB and drop seed data, then re-seed
mongosh "mongodb://localhost:27017/demo-vibe" --eval "db.TC_COMM_CD_GRP.drop(); db.TC_COMM_CD.drop();"
npx prisma db seed
```

### 4.2 Staging

Staging should mirror production data volume and schema. Migrations are validated here before production.

**Procedure:**
1. Restore a recent production backup to staging.
   ```bash
   mongorestore --uri="$STAGING_MONGO_URI" --db=demo-vibe --gzip /backups/latest/demo-vibe
   ```
2. Run the migration script.
   ```bash
   mongosh "$STAGING_MONGO_URI/demo-vibe" V005__rename_user_ncnm_phase1.js
   ```
3. Push the Prisma schema.
   ```bash
   DATABASE_URL="$STAGING_MONGO_URI/demo-vibe" npx prisma db push
   ```
4. Deploy the new application version to staging.
5. Run validation checks:
   - [ ] API health check passes
   - [ ] Key user flows work (login, create post, place order)
   - [ ] No errors in application logs
   - [ ] Data integrity spot checks (document counts, field presence)
6. Run automated E2E tests against staging.

### 4.3 Production

**Standard migration (< 5 minutes, no downtime):**
1. Complete the pre-migration backup checklist (Section 3.2).
2. Run the migration script during low-traffic hours.
   ```bash
   mongosh "$PROD_MONGO_URI/demo-vibe" V005__rename_user_ncnm_phase1.js
   ```
3. Push the Prisma schema (if deploying new code simultaneously).
4. Deploy the new application version.
5. Monitor application logs and error rates for 30 minutes.

**Large migration (> 5 minutes or breaking changes):**

Use a **maintenance window** approach:
1. Announce maintenance window to users (at least 24 hours in advance).
2. Enable maintenance mode (return 503 to API requests).
3. Take a full backup.
4. Run migration script.
5. Push Prisma schema.
6. Deploy new application version.
7. Run smoke tests.
8. Disable maintenance mode.
9. Monitor for 1 hour.

**Blue-green deployment (zero-downtime for large changes):**
1. Spin up a "green" environment with the new application version.
2. Point green to a replica set secondary (read-only validation).
3. Run migration on the primary.
4. Switch traffic from "blue" to "green" via load balancer.
5. Keep "blue" running for 1 hour as a fallback.
6. Decommission "blue" after confirming stability.

---

## 5. Seed Data Management

### 5.1 Seed Data Location

Seed data is managed in two places:
- **`docker/mongo-init.js`** -- Creates collections on initial Docker startup.
- **`prisma/seed.ts`** (or `seed.js`) -- Inserts initial records (code groups, codes, test users) via Prisma Client.

### 5.2 Updating Seed Data

When adding new code groups or codes to `database-design.md`, update the seed script accordingly:

```typescript
// prisma/seed.ts (example)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Upsert code groups
  await prisma.commonCodeGroup.upsert({
    where: { cdGrpId: "USER_STTS" },
    update: {},
    create: {
      cdGrpId: "USER_STTS",
      cdGrpNm: "User Status",
      cdGrpDc: "User account status codes",
      useYn: "Y",
    },
  });

  // Upsert codes
  await prisma.commonCode.upsert({
    where: { cdGrpId_cdVal: { cdGrpId: "USER_STTS", cdVal: "ACTV" } },
    update: {},
    create: {
      cdGrpId: "USER_STTS",
      cdVal: "ACTV",
      cdNm: "Active",
      sortSn: 1,
      useYn: "Y",
    },
  });

  // ... additional seed data
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seed:**
```bash
npx prisma db seed
```

### 5.3 Test Data vs Production Data

| Aspect | Test / Development | Production |
|--------|-------------------|------------|
| Code tables (TC_) | Full set from `database-design.md` | Same full set |
| Users | Predefined test users (admin, seller, buyer) | None (users register themselves) |
| Products | Sample products for testing | None |
| Orders | Sample orders for testing | None |
| Chat messages | None | None |
| Passwords | Simple passwords (e.g., `Test1234!`) | N/A |

**Never seed test users or sample data into production.** Production seed scripts should only include code tables (`TC_COMM_CD_GRP`, `TC_COMM_CD`) and system configuration.

### 5.4 Adding New Collections to Docker Init

When adding a new collection, update `docker/mongo-init.js`:

```javascript
// Add new collection
db.createCollection("TB_NEW_COLLECTION");
```

This ensures the collection exists when Docker starts fresh, even before `prisma db push` runs.

---

## 6. Version History

### Migration Log Format

Each migration is recorded in the table below. Update this table whenever a migration is executed in production.

| Version | Date | Description | Author | Reversible | Status |
|---------|------|-------------|--------|------------|--------|
| V001 | 2026-03-01 | Initial schema: Auth, Board, Chat, Product, Order modules (20 collections) | - | No (initial) | Applied |
| V002 | 2026-03-10 | Add password reset fields (PSWD_RST_TKN, PSWD_RST_EXPR_DT) to TB_COMM_USER | - | Yes | Applied |
| V003 | 2026-03-15 | Add PAY_MTHD_CD to TB_COMM_ORDR, ITEM_STTS_CD and TRCKG_NO to TB_COMM_ORDR_ITEM | - | Yes | Applied |
| V004 | 2026-03-15 | Add PAY_STTS field to TB_COMM_ORDR_ITEM | - | Yes | Applied |
| V005 | 2026-03-16 | Add TB_COMM_BOARD_BANNER collection | - | Yes | Applied |

### Current Schema Version

**Version: V005** (as of 2026-03-18)

**Collections: 21**
- TB: 9 (User, SocialAccount, RefreshToken, BoardPost, BoardComment, BoardAttachment, BoardBanner, ChatRoom, ChatMessage, ChatMessageAttachment, Product, Order, OrderItem)
- TC: 2 (CommonCodeGroup, CommonCode)
- TL: 2 (LoginLog, UserActivity)
- TH: 1 (OrderStatusHistory)
- TR: 3 (BoardLike, ChatRoomMember)

### Migration Script Template

Use this template when creating new migration scripts:

```javascript
// V{NNN}__{description}.js
// Description: {What this migration does}
// Author: {Name}
// Date: {YYYY-MM-DD}
// Reversible: {Yes/No}
// Rollback: V{NNN}__{description}_ROLLBACK.js

db = db.getSiblingDB("demo-vibe");

// --- Pre-check ---
var beforeCount = db.COLLECTION_NAME.countDocuments({ /* filter */ });
print("Pre-check: " + beforeCount + " documents to migrate");

// --- Migration ---
db.COLLECTION_NAME.updateMany(
  { /* filter */ },
  { /* update */ }
);

// --- Verification ---
var afterCount = db.COLLECTION_NAME.countDocuments({ /* verification filter */ });
print("Verification: " + afterCount + " documents updated");
print("Migration V{NNN} complete: {description}");
```
