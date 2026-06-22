import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.creatorProfile.update({
    where: { slug: "miku" },
    data: {
      bio: "歌と配信が好き🎤 毎日22時からライブ配信中！\nファンのみなさんいつもありがとう💕\n[グッズ購入はこちら](https://shop.example.com)",
    },
  });
  console.log("✅ miku の bio を更新しました");
}

main().catch(console.error).finally(() => db.$disconnect());
