import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const CREATORS = [
  { name: "Yuna",   slug: "yuna",   bio: "歌ってみた毎週投稿中🎤" },
  { name: "Haruto", slug: "haruto", bio: "ゲーム配信とダンス動画🎮" },
  { name: "Sora",   slug: "sora",   bio: "アイドル活動中✨毎日更新" },
  { name: "Koharu", slug: "koharu", bio: "カバーダンス＆Vlog🌸" },
  { name: "Riku",   slug: "riku",   bio: "弾き語り配信してます🎸" },
  { name: "Mei",    slug: "mei",    bio: "コスプレ＆推し活💜" },
  { name: "Kenta",  slug: "kenta",  bio: "バラエティ系YouTuber🔥" },
  { name: "Nao",    slug: "nao",    bio: "イラスト＆歌好き🎨" },
  { name: "Rina",   slug: "rina",   bio: "声優志望、毎日配信💫" },
  { name: "Takumi", slug: "takumi", bio: "ストリーマー＆ダンサー🕺" },
];


async function main() {
  for (const c of CREATORS) {
    const email = `creator-${c.slug}@kizalo.test`;

    await db.user.upsert({
      where: { email },
      update: { displayName: c.name },
      create: {
        email,
        name: c.name,
        displayName: c.name,
        creatorProfile: {
          create: {
            slug: c.slug,
            displayName: c.name,
            bio: c.bio,
          },
        },
      },
    });

    console.log(`✅ ${c.name} → http://localhost:3000/${c.slug}`);
  }

  console.log(`\n合計 ${CREATORS.length} 人のインフルエンサーを作成しました。`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
