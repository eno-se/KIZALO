import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const FANS = [
  "さくら", "ゆうき", "なな", "まい", "こうた",
  "ゆい", "りく", "あおい", "はると", "みお",
  "けんた", "ひな", "そら", "りん", "たくみ",
  "ももか", "しょうた", "えみ", "かいと", "なつき",
];

function getJstDateString(): string {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function main() {
  const creator = await db.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) {
    console.error("❌ miku が見つかりません");
    process.exit(1);
  }

  const today = getJstDateString();
  const baseTime = new Date();

  for (let i = 0; i < FANS.length; i++) {
    const name = FANS[i];
    const email = `fan-${i + 1}-${Date.now()}@kizalo.test`;

    const fan = await db.user.create({
      data: {
        email,
        name,
        displayName: name,
      },
    });

    // 刻った時刻を1分ずつずらす（最速順が分かるように）
    const kizariTime = new Date(baseTime.getTime() - (FANS.length - i) * 60 * 1000);

    await db.kizari.create({
      data: {
        fanId: fan.id,
        creatorId: creator.id,
        date: today,
        createdAt: kizariTime,
      },
    });

    await db.fanFollow.upsert({
      where: { fanId_creatorId: { fanId: fan.id, creatorId: creator.id } },
      update: {},
      create: {
        fanId: fan.id,
        creatorId: creator.id,
        streakDays: 1,
        lastKizariAt: kizariTime,
      },
    });

    console.log(`✅ ${name} が刻りました（${kizariTime.toISOString()}）`);
  }

  console.log(`\n合計 ${FANS.length} 人の刻りデータを作成しました。`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
