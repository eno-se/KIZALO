import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const user = await db.user.upsert({
    where: { email: "test-creator@kizalo.test" },
    update: {},
    create: {
      email: "test-creator@kizalo.test",
      name: "テストアイドル Miku",
      displayName: "Miku",
      creatorProfile: {
        create: {
          slug: "miku",
          displayName: "Miku",
          bio: "テスト用の推しアカウントです。気軽にキザってください！",
          socialLinks: {
            create: [
              { platform: "x", url: "https://x.com/test", order: 0 },
              { platform: "youtube", url: "https://youtube.com/test", order: 1 },
            ],
          },
        },
      },
    },
  });

  console.log("✅ テストクリエイター作成:", user.email);
  console.log("   推しページ: http://localhost:3000/miku");
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
