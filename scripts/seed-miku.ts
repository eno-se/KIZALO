import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(__dirname, "../.env.local") });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

async function main() {
  // mikuのCreatorProfileを取得
  const creator = await prisma.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) {
    console.error("miku のプロフィールが見つかりません");
    process.exit(1);
  }
  console.log(`Creator found: ${creator.displayName} (${creator.id})`);

  // 既存のテストファンを削除してリセット
  const existingFans = await prisma.user.findMany({
    where: { email: { startsWith: "testfan" } },
    select: { id: true },
  });
  if (existingFans.length > 0) {
    console.log(`Cleaning up ${existingFans.length} existing test fans...`);
    await prisma.kizari.deleteMany({ where: { fanId: { in: existingFans.map((f) => f.id) } } });
    await prisma.fanFollow.deleteMany({ where: { fanId: { in: existingFans.map((f) => f.id) } } });
    await prisma.user.deleteMany({ where: { id: { in: existingFans.map((f) => f.id) } } });
  }

  // 100人のテストファンを作成
  const FAN_COUNT = 100;
  console.log(`Creating ${FAN_COUNT} test fans...`);
  const fans = await Promise.all(
    Array.from({ length: FAN_COUNT }, (_, i) =>
      prisma.user.create({
        data: {
          id: `testfan_${String(i).padStart(3, "0")}`,
          email: `testfan${i}@test.kizalo.test`,
          displayName: `テストファン${i}`,
        },
      })
    )
  );

  // JST基準で今日
  const jstNow = Date.now() + 9 * 60 * 60 * 1000;
  const todayJst = new Date(jstNow).toISOString().slice(0, 10);

  // 730日分 (約2年) のデータを生成
  const DAYS = 730;
  const kizarisToCreate: {
    fanId: string;
    creatorId: string;
    date: string;
    createdAt: Date;
  }[] = [];

  const rand = rng(42);

  for (let d = 0; d < DAYS; d++) {
    const dayOffset = DAYS - 1 - d; // 古い順
    const dateMs = jstNow - dayOffset * 24 * 60 * 60 * 1000;
    const dateStr = new Date(dateMs).toISOString().slice(0, 10);
    const dayOfWeek = new Date(dateMs).getUTCDay(); // 0=日

    // ベース人数: 季節・トレンドパターン
    const progress = d / DAYS; // 0→1 で時間経過
    const trend = 5 + progress * 25; // 緩やかな成長トレンド

    // 季節波 (半年周期)
    const seasonal = 10 * Math.sin((d / 180) * Math.PI);

    // 週末ブースト
    const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 8 : 0;

    // イベントスパイク (ランダムに数回)
    const spikeSeeds = [60, 150, 280, 400, 520, 650];
    const spike = spikeSeeds.some((s) => Math.abs(d - s) < 5)
      ? 30 * Math.exp(-Math.pow(d - spikeSeeds.find((s) => Math.abs(d - s) < 5)!, 2) / 8)
      : 0;

    const baseFans = Math.round(trend + seasonal + weekendBoost + spike + (rand() - 0.5) * 6);
    const activeFans = Math.max(1, Math.min(FAN_COUNT, baseFans));

    // 今日だけ時間別に分散
    const isToday = dateStr === todayJst;

    // activeFans人をランダムに選択
    const shuffled = fans.slice().sort(() => rand() - 0.5);
    const selectedFans = shuffled.slice(0, activeFans);

    for (const fan of selectedFans) {
      let hour: number;
      if (isToday) {
        // 今日: 夕方〜夜にピーク（18-22時台に集中）
        const r = rand();
        if (r < 0.05) hour = Math.floor(rand() * 6); // 0-5時: 5%
        else if (r < 0.12) hour = 6 + Math.floor(rand() * 3); // 6-8時: 7%
        else if (r < 0.25) hour = 9 + Math.floor(rand() * 3); // 9-11時: 13%
        else if (r < 0.40) hour = 12 + Math.floor(rand() * 3); // 12-14時: 15%
        else if (r < 0.52) hour = 15 + Math.floor(rand() * 3); // 15-17時: 12%
        else if (r < 0.82) hour = 18 + Math.floor(rand() * 5); // 18-22時: 30%
        else hour = 23; // 23時: 18%
      } else {
        // 過去: 昼〜夜が多め
        const r = rand();
        if (r < 0.08) hour = Math.floor(rand() * 6);
        else if (r < 0.20) hour = 6 + Math.floor(rand() * 6);
        else if (r < 0.50) hour = 12 + Math.floor(rand() * 6);
        else hour = 18 + Math.floor(rand() * 6);
      }

      const minute = Math.floor(rand() * 60);
      const second = Math.floor(rand() * 60);

      // JSTのhour→UTCに変換して createdAt を設定
      const createdAt = new Date(dateMs);
      createdAt.setUTCHours(hour - 9 < 0 ? hour + 15 : hour - 9, minute, second, 0);
      // 日付がずれないように date をもとに正確に計算
      const baseDate = new Date(dateStr + "T00:00:00+09:00");
      const finalCreatedAt = new Date(
        baseDate.getTime() + hour * 60 * 60 * 1000 + minute * 60 * 1000 + second * 1000
      );

      kizarisToCreate.push({
        fanId: fan.id,
        creatorId: creator.id,
        date: dateStr,
        createdAt: finalCreatedAt,
      });
    }
  }

  console.log(`Inserting ${kizarisToCreate.length} kizari records...`);

  // 1000件ずつバッチ挿入
  const BATCH = 1000;
  for (let i = 0; i < kizarisToCreate.length; i += BATCH) {
    const batch = kizarisToCreate.slice(i, i + BATCH);
    await prisma.kizari.createMany({ data: batch, skipDuplicates: true });
    process.stdout.write(`\r  ${Math.min(i + BATCH, kizarisToCreate.length)} / ${kizarisToCreate.length}`);
  }
  console.log("\n✓ Kizari inserted");

  // FanFollowを更新（各ファンの最終日・連続日数等）
  console.log("Updating FanFollow records...");
  const rand2 = rng(99);
  await Promise.all(
    fans.map(async (fan, i) => {
      const streak = Math.floor(rand2() * 30) + 1;
      const total = Math.floor(rand2() * 200) + 10;
      await prisma.fanFollow.upsert({
        where: { fanId_creatorId: { fanId: fan.id, creatorId: creator.id } },
        create: {
          fanId: fan.id,
          creatorId: creator.id,
          streakDays: streak,
          maxStreakDays: streak + Math.floor(rand2() * 50),
          totalKizari: total,
          lastKizariAt: new Date(jstNow - Math.floor(rand2() * 3) * 24 * 60 * 60 * 1000),
        },
        update: {
          streakDays: streak,
          maxStreakDays: streak + Math.floor(rand2() * 50),
          totalKizari: total,
          lastKizariAt: new Date(jstNow - Math.floor(rand2() * 3) * 24 * 60 * 60 * 1000),
        },
      });
    })
  );
  console.log("✓ FanFollow updated");
  console.log("\nSeed complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
