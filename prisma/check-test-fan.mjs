import { createRequire } from "module";
import { Pool } from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const { PrismaClient } = await import("../app/generated/prisma/client/index.js");
const { PrismaPg } = await import("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const testUser = await db.user.findUnique({ where: { email: "test-fan@dev.local" } });
if (!testUser) { console.log("テストユーザーなし"); process.exit(0); }
console.log("userId:", testUser.id, "/ displayName:", testUser.displayName);

const follows = await db.fanFollow.findMany({
  where: { fanId: testUser.id },
  include: { creator: { select: { slug: true } } },
});
console.log("\nFanFollow:");
follows.forEach(f => {
  console.log(`  slug=${f.creator.slug} streak=${f.streakDays} max=${f.maxStreakDays} lastKizariAt=${f.lastKizariAt?.toISOString()}`);
});

const sessions = await db.session.findMany({
  where: { userId: testUser.id, expires: { gt: new Date() } },
});
console.log("\nアクティブセッション数:", sessions.length);

const jstNow = Date.now() + 9 * 60 * 60 * 1000;
const today = new Date(jstNow).toISOString().slice(0, 10);
const kizaris = await db.kizari.findMany({ where: { fanId: testUser.id, date: today } });
console.log("今日のkizari:", kizaris.length, "件 (today=", today, ")");

await pool.end();
