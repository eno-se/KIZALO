import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const suspended = process.argv[2] === "true";
const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
await client.user.updateMany({ data: { isSuspended: suspended } });
console.log(`isSuspended = ${suspended}`);
await client.$disconnect();
