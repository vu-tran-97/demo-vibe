import * as admin from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Init Firebase Admin
const saPath = join(process.cwd(), "firebase-service-account.json");
if (!existsSync(saPath)) {
  console.error("firebase-service-account.json not found");
  process.exit(1);
}
const sa = JSON.parse(readFileSync(saPath, "utf-8"));
admin.initializeApp({ credential: admin.credential.cert(sa) });

const PASSWORDS: Record<string, string> = {
  SUPER_ADMIN: "Admin@123",
  SELLER: "Seller@123",
  BUYER: "Buyer@123",
};

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, userEmail: true, firebaseUid: true, useRoleCd: true },
    orderBy: { id: "asc" },
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    const password = PASSWORDS[user.useRoleCd] || "User@123";
    try {
      await admin.auth().updateUser(user.firebaseUid, { password });
      updated++;
      if (updated % 10 === 0) console.info(`Updated ${updated}/${users.length}...`);
    } catch (err: unknown) {
      const fbErr = err as { code?: string; message?: string };
      if (fbErr.code === "auth/user-not-found") {
        // Create missing user
        try {
          const created = await admin.auth().createUser({
            email: user.userEmail,
            password,
            displayName: user.userEmail.split("@")[0],
          });
          await prisma.user.update({
            where: { id: user.id },
            data: { firebaseUid: created.uid },
          });
          updated++;
          console.info(`Created & linked: ${user.userEmail}`);
        } catch (createErr) {
          failed++;
          console.error(`Failed to create ${user.userEmail}:`, createErr);
        }
      } else {
        failed++;
        console.error(`Failed ${user.userEmail}: ${fbErr.message}`);
      }
    }
  }

  console.info(`\nDone: ${updated} updated, ${skipped} skipped, ${failed} failed out of ${users.length} total`);
  console.info("\nPasswords:");
  console.info("  SUPER_ADMIN: Admin@123");
  console.info("  SELLER:      Seller@123");
  console.info("  BUYER:       Buyer@123");

  await prisma.$disconnect();
}

main().catch(console.error);
