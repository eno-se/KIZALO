import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

const SLUGS = ["miku", "yuna", "haruto", "sora", "koharu", "riku", "mei", "kenta", "nao", "rina", "takumi"];

async function main() {
  for (const slug of SLUGS) {
    const creator = await db.creatorProfile.findUnique({ where: { slug } });
    if (!creator) {
      console.warn(`⚠️  ${slug} が見つかりません、スキップ`);
      continue;
    }

    await db.socialLink.deleteMany({ where: { creatorId: creator.id } });

    await db.socialLink.createMany({
      data: [
        { creatorId: creator.id, platform: "x",        url: `https://x.com/${slug}_test`,        order: 0 },
        { creatorId: creator.id, platform: "instagram", url: `https://instagram.com/${slug}_test`, order: 1 },
        { creatorId: creator.id, platform: "tiktok",    url: `https://tiktok.com/@${slug}_test`,   order: 2 },
        { creatorId: creator.id, platform: "youtube",   url: `https://youtube.com/@${slug}_test`,  order: 3 },
      ],
    });

    console.log(`✅ ${slug} のSNSリンクを更新`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
