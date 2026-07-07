import { Pool } from "pg";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, "../.env.local") });

const { PrismaClient } = await import("../app/generated/prisma/client/index.js");
const { PrismaPg } = await import("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter: new PrismaPg(pool) });

const user = await db.user.findUnique({
  where: { email: "ueno.fox8@gmail.com" },
  select: { id: true, email: true, displayName: true, creatorProfile: { select: { slug: true } } },
});
console.log(user);

await pool.end();
