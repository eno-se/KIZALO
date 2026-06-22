import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const NAMES = [
  "さくら", "ゆい", "はるか", "みさき", "あいか", "りな", "ことね", "まお", "なつき", "えみ",
  "ひより", "ののか", "あずさ", "ちか", "れな", "いちか", "ほのか", "みく", "すずね", "あやか",
  "そら", "たいよう", "れん", "はると", "りく", "ゆうと", "かいと", "しょうた", "ともや", "けんと",
  "なおき", "ゆうき", "まさき", "りょうた", "こうせい", "だいすけ", "たくみ", "しんや", "あつし", "まなと",
  "ひなた", "つむぎ", "きらら", "しおり", "ゆめ", "このは", "さやか", "まりな", "りおな", "のあ",
  "あさひ", "いつき", "かなた", "こころ", "しずく", "たまき", "なぎ", "はな", "みお", "ゆら",
  "あおい", "いろは", "うみ", "えな", "おとは", "かほ", "きわ", "くるみ", "こはく", "さな",
  "じゅん", "すみれ", "せな", "そよか", "たお", "ちひろ", "てつや", "とわ", "なつめ", "にこ",
  "ぬい", "ねね", "のぞみ", "はるき", "ひかる", "ふうか", "へいわ", "ほたる", "まなか", "みらい",
  "むつき", "めい", "もか", "やまと", "ゆきな", "よしき", "らん", "りあ", "るい", "れいか",
];

function getJstDateString() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

async function main() {
  const creator = await db.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) { console.error("❌ miku が見つかりません"); process.exit(1); }

  const today = getJstDateString();
  console.log(`対象日: ${today}`);

  for (let i = 0; i < 100; i++) {
    const name = NAMES[i];
    const email = `bulk-fan-${i}-${Date.now()}@kizalo.test`;

    const fan = await db.user.create({ data: { email, name, displayName: name } });

    // 時間を分散（0〜100分前）
    const kizariTime = new Date(Date.now() - (100 - i) * 60 * 1000);

    // 連続日数をランダムに（0〜30日）
    const streak = Math.floor(Math.random() * 31);
    const maxStreak = streak + Math.floor(Math.random() * 5);

    await db.kizari.create({
      data: { fanId: fan.id, creatorId: creator.id, date: today, createdAt: kizariTime },
    });

    await db.fanFollow.create({
      data: {
        fanId: fan.id,
        creatorId: creator.id,
        streakDays: streak,
        maxStreakDays: maxStreak,
        totalKizari: streak + 1,
        lastKizariAt: kizariTime,
      },
    });

    if ((i + 1) % 10 === 0) console.log(`✅ ${i + 1}/100 件完了`);
  }

  console.log(`\n✅ 100人分のテストデータを追加しました（日付: ${today}）`);
}

main().catch(console.error).finally(() => db.$disconnect());
