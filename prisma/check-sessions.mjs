import { PrismaClient } from "../app/generated/prisma/client/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const client = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const sessions = await client.session.findMany({
  orderBy: { expires: "desc" },
  take: 5,
  select: { sessionToken: true, userId: true, expires: true },
});
console.log(JSON.stringify(sessions, null, 2));
await client.$disconnect();
