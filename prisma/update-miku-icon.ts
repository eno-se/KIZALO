import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  await db.creatorProfile.update({
    where: { slug: "miku" },
    data: { iconUrl: "/test-miku.jpg" },
  });
  console.log("✅ miku のトプ画を更新しました");
}

main().catch(console.error).finally(() => db.$disconnect());
