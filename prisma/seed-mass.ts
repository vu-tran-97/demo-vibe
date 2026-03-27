import { PrismaClient } from "@prisma/client";
import * as admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

// ── Firebase Admin SDK init ──
function initFirebase() {
  if (admin.apps.length > 0) return;
  const paths = [
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    join(process.cwd(), "..", "firebase-service-account.json"),
    join(process.cwd(), "firebase-service-account.json"),
  ].filter(Boolean) as string[];

  for (const p of paths) {
    if (existsSync(p)) {
      const sa = JSON.parse(readFileSync(p, "utf-8"));
      admin.initializeApp({ credential: admin.credential.cert(sa) });
      return;
    }
  }
  console.warn("Firebase service account not found, using placeholder UIDs");
}

async function ensureFirebaseUser(email: string, password: string, displayName: string): Promise<string> {
  if (admin.apps.length === 0) return `firebase-placeholder-${email}`;
  try {
    const existing = await admin.auth().getUserByEmail(email);
    return existing.uid;
  } catch (err: unknown) {
    const fbErr = err as { code?: string };
    if (fbErr.code === "auth/user-not-found") {
      const created = await admin.auth().createUser({ email, password, displayName });
      console.info(`  Firebase user created: ${email}`);
      return created.uid;
    }
    throw err;
  }
}

// ── Product data generators ──
const CATEGORIES = ["CERAMICS", "TEXTILES", "ART", "JEWELRY", "HOME", "FOOD"] as const;
const VARIANTS = [
  "Premium", "Deluxe", "Classic", "Limited Edition", "Mini",
  "Signature", "Artisan", "Handmade", "Organic", "Vintage",
  "Exclusive", "Royal", "Elegant", "Modern", "Rustic",
  "Luxury", "Essential", "Natural", "Traditional", "Contemporary",
];
const COLORS = [
  "Ivory", "Charcoal", "Forest Green", "Dusty Rose", "Navy",
  "Terracotta", "Sand", "Ocean Blue", "Slate", "Cream",
  "Midnight", "Sage", "Blush", "Copper", "Pearl",
  "Onyx", "Moss", "Coral", "Indigo", "Amber",
];
const ITEMS: Record<string, string[]> = {
  CERAMICS: ["Vase", "Mug Set", "Dinner Plate", "Planter Pot", "Tea Set", "Bowl", "Candle Holder", "Serving Bowl", "Soap Dish", "Tumbler"],
  TEXTILES: ["Table Runner", "Silk Scarf", "Throw Blanket", "Tote Bag", "Napkin Set", "Beanie", "Cushion", "Wall Hanging", "Apron", "Baby Blanket"],
  ART: ["Botanical Print", "Landscape", "Line Art", "Watercolor Set", "Wave Print", "Poster", "Portrait", "Typography Print", "Photography", "Illustration"],
  JEWELRY: ["Hoop Earrings", "Chain Necklace", "Pearl Earrings", "Bracelet", "Signet Ring", "Pendant", "Anklet", "Leather Cuff", "Studs", "Ring Set"],
  HOME: ["Incense Holder", "Soy Candle", "Serving Board", "Basket", "Photo Frame", "Coaster Set", "Terrarium", "Tissue Cover", "Marble Tray", "Diffuser"],
  FOOD: ["Honey Jar", "Oolong Tea", "Chocolate Truffles", "Granola", "Hot Sauce", "Dried Fruit", "Olive Oil", "Coffee Beans", "Matcha Powder", "Sea Salt"],
};
const IMAGES: Record<string, string[]> = {
  CERAMICS: [
    "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&h=600&fit=crop",
  ],
  TEXTILES: [
    "https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1580301762395-21ce6d5d4bc4?w=600&h=600&fit=crop",
  ],
  ART: [
    "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&h=600&fit=crop",
  ],
  JEWELRY: [
    "https://images.unsplash.com/photo-1515562141589-67f0d569b6c6?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=600&h=600&fit=crop",
  ],
  HOME: [
    "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&h=600&fit=crop",
  ],
  FOOD: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1490818387583-1baba5e638af?w=600&h=600&fit=crop",
    "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=600&h=600&fit=crop",
  ],
};

const SELLER_NAMES = [
  "Seoul Craft Studio", "Hanok Living", "Jeju Art Gallery", "Busan Market",
  "Gyeongju Pottery", "Incheon Textiles", "Daegu Design", "Gwangju Gallery",
  "Suwon Artisan", "Ulsan Creative", "Sejong Workshop", "Cheonan Craft",
  "Jeonju Heritage", "Gimhae Studio", "Pohang Makers", "Andong Traditional",
  "Mokpo Ocean", "Yeosu Marine", "Tongyeong Art", "Gangneung Nature",
  "Sokcho Fresh", "Pyeongchang Mountain", "Gongju Royal", "Iksan Golden",
  "Namwon Garden",
];

function generateProductBatch(sellerId: number, startIdx: number, count: number) {
  const products = [];
  for (let i = 0; i < count; i++) {
    const idx = startIdx + i;
    const cat = CATEGORIES[idx % 6];
    const item = ITEMS[cat][idx % 10];
    const variant = VARIANTS[idx % 20];
    const color = COLORS[(idx * 7) % 20];
    const img = IMAGES[cat][idx % 3];
    const basePrice = 10 + (idx % 500);
    const hasSale = idx % 5 === 0;

    products.push({
      sellerId,
      prdNm: `${variant} ${item} — ${color} #${idx + 1}`,
      prdDc: `High quality ${item.toLowerCase()} in ${color.toLowerCase()}. ${variant} collection. Item #${idx + 1}.`,
      prdPrc: basePrice,
      prdSalePrc: hasSale ? Math.round(basePrice * 0.8) : null,
      prdCtgrCd: cat,
      prdImgUrl: img,
      prdImgUrls: [img],
      stckQty: 5 + (idx % 50),
      soldCnt: idx % 200,
      viewCnt: 100 + (idx % 5000),
      avgRtng: Math.round((3.5 + (idx % 15) / 10) * 10) / 10,
      rvwCnt: idx % 100,
      srchTags: [item.toLowerCase(), color.toLowerCase(), variant.toLowerCase(), cat.toLowerCase()],
      rgtrId: "SYSTEM",
      mdfrId: "SYSTEM",
    });
  }
  return products;
}

async function main() {
  initFirebase();

  // ── 1. Ensure admin ──
  console.info("=== Step 1: Admin user ===");
  const adminUid = await ensureFirebaseUser("admin@astratech.vn", "Admin@123", "Super Admin");
  let adminUser = await prisma.user.findFirst({ where: { userEmail: "admin@astratech.vn" } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        userEmail: "admin@astratech.vn", firebaseUid: adminUid,
        userNm: "Super Admin", userNcnm: "superadmin",
        useRoleCd: "SUPER_ADMIN", userSttsCd: "ACTV",
        rgtrId: "SYSTEM", mdfrId: "SYSTEM",
      },
    });
    console.info("  Admin created");
  } else {
    if (adminUser.firebaseUid !== adminUid) {
      await prisma.user.update({ where: { id: adminUser.id }, data: { firebaseUid: adminUid } });
    }
    if (adminUser.useRoleCd !== "SUPER_ADMIN") {
      await prisma.user.update({ where: { id: adminUser.id }, data: { useRoleCd: "SUPER_ADMIN" } });
    }
    console.info("  Admin exists");
  }

  // ── 2. Create 25 sellers ──
  console.info("\n=== Step 2: Creating 25 sellers ===");
  const sellerIds: number[] = [];
  for (let i = 1; i <= 25; i++) {
    const email = `seller${i}@yopmail.com`;
    const name = SELLER_NAMES[i - 1] || `Seller Shop ${i}`;
    const nickname = name.toLowerCase().replace(/\s+/g, "_");

    const fbUid = await ensureFirebaseUser(email, "Seller@123", name);
    let seller = await prisma.user.findFirst({ where: { userEmail: email } });
    if (!seller) {
      seller = await prisma.user.create({
        data: {
          userEmail: email, firebaseUid: fbUid,
          userNm: name, userNcnm: nickname,
          useRoleCd: "SELLER", userSttsCd: "ACTV",
          rgtrId: "SYSTEM", mdfrId: "SYSTEM",
        },
      });
      console.info(`  Created seller${i}: ${name}`);
    } else {
      if (seller.firebaseUid !== fbUid) {
        await prisma.user.update({ where: { id: seller.id }, data: { firebaseUid: fbUid } });
      }
      console.info(`  Exists seller${i}: ${name}`);
    }
    sellerIds.push(seller.id);
  }

  // ── 3. Create 25 buyers ──
  console.info("\n=== Step 3: Creating 25 buyers ===");
  for (let i = 1; i <= 25; i++) {
    const email = `buyer${i}@yopmail.com`;
    const name = `Buyer ${i}`;
    const nickname = `buyer_${i}`;

    const fbUid = await ensureFirebaseUser(email, "Buyer@123", name);
    let buyer = await prisma.user.findFirst({ where: { userEmail: email } });
    if (!buyer) {
      buyer = await prisma.user.create({
        data: {
          userEmail: email, firebaseUid: fbUid,
          userNm: name, userNcnm: nickname,
          useRoleCd: "BUYER", userSttsCd: "ACTV",
          rgtrId: "SYSTEM", mdfrId: "SYSTEM",
        },
      });
      console.info(`  Created buyer${i}`);
    } else {
      if (buyer.firebaseUid !== fbUid) {
        await prisma.user.update({ where: { id: buyer.id }, data: { firebaseUid: fbUid } });
      }
      console.info(`  Exists buyer${i}`);
    }
  }

  // ── 4. Seed 50,000 products per seller (batch insert) ──
  console.info("\n=== Step 4: Seeding products (50k per seller) ===");
  const PRODUCTS_PER_SELLER = 2_000;
  const BATCH_SIZE = 1000;

  for (let s = 0; s < sellerIds.length; s++) {
    const sellerId = sellerIds[s];
    const sellerEmail = `seller${s + 1}@yopmail.com`;

    // Check existing product count for this seller
    const existing = await prisma.product.count({ where: { sellerId } });
    if (existing >= PRODUCTS_PER_SELLER) {
      console.info(`  ${sellerEmail}: already has ${existing} products, skipping`);
      continue;
    }

    const toCreate = PRODUCTS_PER_SELLER - existing;
    console.info(`  ${sellerEmail}: need ${toCreate} more products (has ${existing})`);

    let created = 0;
    for (let batch = 0; batch < Math.ceil(toCreate / BATCH_SIZE); batch++) {
      const batchCount = Math.min(BATCH_SIZE, toCreate - created);
      const products = generateProductBatch(sellerId, existing + created, batchCount);
      await prisma.product.createMany({ data: products });
      created += batchCount;
      if (created % 10000 === 0 || created === toCreate) {
        console.info(`    ${sellerEmail}: ${created}/${toCreate} products`);
      }
    }
  }

  // ── 5. Verify ──
  console.info("\n=== Verification ===");
  const userCount = await prisma.user.count();
  const sellerCount = await prisma.user.count({ where: { useRoleCd: "SELLER" } });
  const buyerCount = await prisma.user.count({ where: { useRoleCd: "BUYER" } });
  const adminCount = await prisma.user.count({ where: { useRoleCd: "SUPER_ADMIN" } });
  const productCount = await prisma.product.count();

  console.info(`  Users: ${userCount} total (${adminCount} admin, ${sellerCount} sellers, ${buyerCount} buyers)`);
  console.info(`  Products: ${productCount} total`);

  // Per-seller breakdown
  const sellerProducts = await prisma.product.groupBy({ by: ["sellerId"], _count: true });
  for (const sp of sellerProducts) {
    const u = await prisma.user.findUnique({ where: { id: sp.sellerId }, select: { userEmail: true } });
    console.info(`    ${u?.userEmail}: ${sp._count} products`);
  }

  console.info("\nDone!");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
