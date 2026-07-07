// page.tsx と同じ db インスタンスを模した確認スクリプト
import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const creator = await client.creatorProfile.findUnique({
  where: { slug: "yuna" },
  include: {
    user: { select: { isBanned: true, isSuspended: true } },
    socialLinks: { orderBy: { order: "asc" } },
  },
});

const shouldBeNotFound = !creator || !creator.isPublic || creator.user.isBanned || creator.user.isSuspended;
console.log(`shouldBeNotFound: ${shouldBeNotFound}`);
console.log(`creator.user:`, creator?.user);
await client.$disconnect();
