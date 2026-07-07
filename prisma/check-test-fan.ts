import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const testUser = await db.user.findUnique({ where: { email: "test-fan@dev.local" } });
  if (!testUser) { console.log("テストユーザーなし"); return; }
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
  console.log("今日のkizari:", kizaris.length, "件");
}

main().catch(console.error).finally(() => pool.end());
