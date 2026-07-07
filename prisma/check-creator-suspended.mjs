import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const creator = await client.creatorProfile.findUnique({
  where: { slug: "yuna" },
  include: { user: { select: { isBanned: true, isSuspended: true } } },
});

console.log(JSON.stringify({ id: creator?.id, slug: creator?.slug, isPublic: creator?.isPublic, user: creator?.user }, null, 2));
await client.$disconnect();
