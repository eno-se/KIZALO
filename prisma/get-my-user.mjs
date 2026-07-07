import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const u = await client.user.findFirst({
  where: { email: "ueno.fox8@gmail.com" },
  select: { id: true, email: true },
});
console.log(JSON.stringify(u));
await client.$disconnect();
