import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const r = await client.user.findFirst({ select: { id: true, email: true, isSuspended: true, isBanned: true } });
console.log(JSON.stringify(r));
await client.$disconnect();
