import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  // 既存のクリエイターを確認
  const creators = await db.creatorProfile.findMany({
    select: { id: true, slug: true, displayName: true },
    take: 10,
  });
  console.log("=== 既存クリエイター ===");
  creators.forEach((c) => console.log(`  ${c.slug} / ${c.displayName} (${c.id})`));

  if (creators.length === 0) {
    console.log("クリエイターが見つかりません");
    return;
  }

  const targetCreator = creators[0];
  console.log(`\n対象クリエイター: ${targetCreator.slug}`);

  // テストファンユーザーを作成 or 取得
  const testUser = await db.user.upsert({
    where: { email: "test-fan@dev.local" },
    create: {
      email: "test-fan@dev.local",
      name: "テストファン",
      displayName: "テストファン",
    },
    update: { displayName: "テストファン" },
  });
  console.log(`\nテストユーザー ID: ${testUser.id}`);

  // CreatorProfile がなければ作成
  await db.creatorProfile.upsert({
    where: { userId: testUser.id },
    create: {
      userId: testUser.id,
      slug: "test-fan-dev",
      displayName: "テストファン",
    },
    update: {},
  }).catch(() => console.log("CreatorProfile は既存"));

  // JST 昨日
  const jstNow = Date.now() + 9 * 60 * 60 * 1000;
  const yesterday = new Date(jstNow - 24 * 60 * 60 * 1000);
  const today = new Date(jstNow).toISOString().slice(0, 10);
  const STREAK = 3;

  // 今日の kizari を削除（再テスト用）
  await db.kizari.deleteMany({
    where: { fanId: testUser.id, creatorId: targetCreator.id, date: today },
  });

  // FanFollow: streak=3, lastKizariAt=昨日 → 刻ると4日連続になる
  await db.fanFollow.upsert({
    where: { fanId_creatorId: { fanId: testUser.id, creatorId: targetCreator.id } },
    create: {
      fanId: testUser.id,
      creatorId: targetCreator.id,
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

  console.log(`FanFollow セットアップ完了: ${STREAK}日連続状態`);
  console.log(`\n=== ログイン方法 ===`);
  console.log(`POST /api/dev-login  body: { "userId": "${testUser.id}" }`);
  console.log(`その後 /${targetCreator.slug} で刻ると「🔥 4日連続！」が出るはず`);
}

main()
  .catch(console.error)
  .finally(() => pool.end());
