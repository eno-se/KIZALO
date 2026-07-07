import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const user = await db.user.upsert({
    where: { email: "fresh-user3@kizalo.test" },
    update: {},
    create: {
      email: "fresh-user3@kizalo.test",
      name: "テストユーザー3",
      // displayName なし・creatorProfile なし・kizari なし
    },
  });
  console.log(`userId: ${user.id}`);
}

main().finally(() => db.$disconnect());
