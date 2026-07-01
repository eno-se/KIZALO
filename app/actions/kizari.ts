"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function kizaru(creatorId: string, slug: string) {
  const session = await auth();
  if (!session) return { error: "ログインしてください" };

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(`kizaru:${ip}`, 10, 60 * 1000)) {
    return { error: "リクエストが多すぎます。しばらくお待ちください。" };
  }

  const today = getJstDateString();
  const userId = session.user.id;

  const existing = await db.kizari.findUnique({
    where: { fanId_creatorId_date: { fanId: userId, creatorId, date: today } },
  });
  if (existing) return { error: "今日はすでにキザり済みです" };

  const follow = await db.fanFollow.findUnique({
    where: { fanId_creatorId: { fanId: userId, creatorId } },
  });

  let newStreak = 1;
  if (follow?.lastKizariAt) {
    const yesterday = new Date();
    yesterday.setTime(yesterday.getTime() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (follow.lastKizariAt.toISOString().slice(0, 10) === yesterdayStr) {
      newStreak = (follow.streakDays ?? 0) + 1;
    }
  }

  const newMaxStreak = Math.max(newStreak, follow?.maxStreakDays ?? 0);

  try {
    await db.$transaction([
      db.kizari.create({ data: { fanId: userId, creatorId, date: today } }),
      db.fanFollow.upsert({
        where: { fanId_creatorId: { fanId: userId, creatorId } },
        create: { fanId: userId, creatorId, streakDays: 1, maxStreakDays: 1, totalKizari: 1, lastKizariAt: new Date() },
        update: { streakDays: newStreak, maxStreakDays: newMaxStreak, totalKizari: { increment: 1 }, lastKizariAt: new Date() },
      }),
    ]);
  } catch {
    return { error: "今日はすでにキザり済みです" };
  }

  revalidatePath(`/${slug}`);
  revalidatePath("/me");

  const prevMaxStreak = follow?.maxStreakDays ?? 0;
  return {
    success: true,
    newStreak,
    isNewRecord: newStreak >= 2 && newStreak > prevMaxStreak,
  };
}

export async function checkKizariStatus(creatorId: string): Promise<boolean> {
  const session = await auth();
  if (!session) return false;
  const today = getJstDateString();
  const existing = await db.kizari.findUnique({
    where: { fanId_creatorId_date: { fanId: session.user.id, creatorId, date: today } },
  });
  return !!existing;
}
