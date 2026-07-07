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
if (!testUser) { console.log("テストユーザーなし"); process.exit(1); }

const creator = await db.creatorProfile.findUnique({ where: { slug: "taiga" } });
if (!creator) { console.log("taiga クリエイターなし"); process.exit(1); }

const jstNow = Date.now() + 9 * 60 * 60 * 1000;
const yesterday = new Date(jstNow - 24 * 60 * 60 * 1000);
const today = new Date(jstNow).toISOString().slice(0, 10);
const STREAK = 3;

// 今日分の kizari を削除
const deleted = await db.kizari.deleteMany({
  where: { fanId: testUser.id, creatorId: creator.id, date: today },
});
console.log("今日のkizari削除:", deleted.count, "件");

// FanFollow を streak=3 にリセット
await db.fanFollow.upsert({
  where: { fanId_creatorId: { fanId: testUser.id, creatorId: creator.id } },
  create: {
    fanId: testUser.id,
    creatorId: creator.id,
    streakDays: STREAK,
    maxStreakDays: STREAK,
    totalKizari: STREAK,
    lastKizariAt: yesterday,
  },
  update: {
    streakDays: STREAK,
    maxStreakDays: STREAK,
    totalKizari: STREAK,
    lastKizariAt: yesterday,
  },
});

console.log(`リセット完了: streak=${STREAK}, lastKizariAt=昨日`);
console.log(`テスト手順:`);
console.log(`  1. POST /api/dev-login  { "userId": "${testUser.id}" }  でログイン`);
console.log(`  2. /taiga を開いて「名前を刻る」ボタンをタップ`);
console.log(`  3. ✨ 4日連続・最高更新！ が表示されるはず`);

await pool.end();
