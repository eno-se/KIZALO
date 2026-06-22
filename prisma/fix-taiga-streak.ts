import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const user = await db.user.findUnique({ where: { email: "ueno.fox8@gmail.com" } });
  if (!user) { console.error("❌ taigaが見つかりません"); process.exit(1); }

  const creator = await db.creatorProfile.findUnique({ where: { slug: "miku" } });
  if (!creator) { console.error("❌ mikuが見つかりません"); process.exit(1); }

  const result = await db.fanFollow.updateMany({
    where: { fanId: user.id, creatorId: creator.id },
    data: { streakDays: 5, maxStreakDays: 5 },
  });

  if (result.count === 0) {
    // FanFollowがなければ作成
    await db.fanFollow.create({
      data: { fanId: user.id, creatorId: creator.id, streakDays: 5, maxStreakDays: 5, totalKizari: 5, lastKizariAt: new Date() },
    });
    console.log("✅ FanFollowを新規作成（streak: 5, maxStreak: 5）");
  } else {
    console.log("✅ 更新しました（streak: 5, maxStreak: 5）→ 記録更新中状態");
  }
}

main().catch(console.error).finally(() => db.$disconnect());
