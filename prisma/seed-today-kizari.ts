import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const FANS = ["あかり", "そうた", "みずき", "はな", "けいすけ", "ゆりか", "だいき", "のぞみ", "りょう", "ちひろ"];

function getJstDateString() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function main() {
  const creator = await db.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) { console.error("❌ miku が見つかりません"); process.exit(1); }

  const today = getJstDateString();
  console.log(`対象日: ${today}`);

  for (let i = 0; i < FANS.length; i++) {
    const name = FANS[i];
    const email = `today-fan-${i}-${Date.now()}@kizalo.test`;

    const fan = await db.user.create({ data: { email, name, displayName: name } });

    const kizariTime = new Date(Date.now() - (FANS.length - i) * 60 * 1000);

    await db.kizari.create({
      data: { fanId: fan.id, creatorId: creator.id, date: today, createdAt: kizariTime },
    });

    await db.fanFollow.create({
      data: { fanId: fan.id, creatorId: creator.id, streakDays: 1, maxStreakDays: 1, totalKizari: 1, lastKizariAt: kizariTime },
    });

    console.log(`✅ ${name}`);
  }

  console.log(`\n${today} に ${FANS.length} 人分の刻りデータを追加しました。`);
}

main().catch(console.error).finally(() => db.$disconnect());
