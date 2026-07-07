import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const db = new PrismaClient({ adapter });

const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);

async function main() {
  const creator = await db.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) throw new Error("miku not found");

  console.log(`creator: ${creator.displayName} (${creator.id}), date: ${today}`);

  let created = 0;
  for (let i = 1; i <= 100; i++) {
    const email = `seed-fan-${i}@kizalo.test`;
    const user = await db.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        name: `ファン${String(i).padStart(3, "0")}`,
        displayName: `ファン${String(i).padStart(3, "0")}`,
      },
    });

    try {
      await db.kizari.create({
        data: { fanId: user.id, creatorId: creator.id, date: today },
      });
      created++;
    } catch {
      // @@unique 重複はスキップ
    }

    await db.fanFollow.upsert({
      where: { fanId_creatorId: { fanId: user.id, creatorId: creator.id } },
      update: { totalKizari: { increment: 1 }, lastKizariAt: new Date() },
      create: {
        fanId: user.id,
        creatorId: creator.id,
        totalKizari: 1,
        streakDays: Math.floor(Math.random() * 30) + 1,
        maxStreakDays: Math.floor(Math.random() * 60) + 1,
        lastKizariAt: new Date(),
      },
    });
  }

  console.log(`Done: ${created} kizari records created for ${today}`);
}

main().finally(() => db.$disconnect());
