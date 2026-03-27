# Sprint 9 Prompt Map

## Sprint Goal
Migrate database from MongoDB to PostgreSQL and replace custom JWT authentication with Firebase Authentication for managed auth, social login, and token handling.

## Feature 1: MongoDB → PostgreSQL + Firebase Auth Migration

### 1.1 Design Prompt
(Already completed — see docs/blueprints/014-db-migration-firebase/blueprint.md)

### 1.2 Implementation Prompt (Phase 1: Database)
- Docker: Replace MongoDB with PostgreSQL
- Prisma: Convert provider + all 21 models (ObjectId → Int)
- Seed script: Update for PostgreSQL
- Run prisma migrate dev

### 1.3 Implementation Prompt (Phase 2: Firebase Auth)
- Install firebase-admin + firebase
- Create FirebaseService, FirebaseAuthGuard
- Update AuthService + AuthController
- Remove JWT/passport/bcrypt
- Update frontend auth

### 1.4 Implementation Prompt (Phase 3: Service Updates)
- Update all services for Int IDs
- Fix all imports and references
- Run tests
