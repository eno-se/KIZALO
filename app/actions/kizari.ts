"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";
import { revalidatePath } from "next/cache";

export async function kizaru(creatorId: string, slug: string) {
  const session = await auth();
  if (!session) return { error: "ログインしてください" };

  const today = getJstDateString();
  const userId = session.user.id;

  const existing = await db.kizari.findUnique({
    where: { fanId_creatorId_date: { fanId: userId, creatorId, date: today } },
  });
  if (existing) return { error: "今日はすでにキザり済みです" };

  const follow = await db.fanFollow.findUnique({
    where: { fanId_creatorId: { fanId: userId, creatorId } },
  });

  const followCount = await db.fanFollow.count({ where: { fanId: userId } });
  if (!follow && followCount >= 3) {
    return { error: "無料プランでは最大3人まで推し登録できます" };
  }

  let newStreak = 1;
  if (follow?.lastKizariAt) {
    const yesterday = new Date();
    yesterday.setTime(yesterday.getTime() + 9 * 60 * 60 * 1000 - 24 * 60 * 60 * 1000);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    if (follow.lastKizariAt.toISOString().slice(0, 10) === yesterdayStr) {
      newStreak = (follow.streakDays ?? 0) + 1;
    }
  }

  await db.$transaction([
    db.kizari.create({ data: { fanId: userId, creatorId, date: today } }),
    db.fanFollow.upsert({
      where: { fanId_creatorId: { fanId: userId, creatorId } },
      create: { fanId: userId, creatorId, streakDays: 1, totalKizari: 1, lastKizariAt: new Date() },
      update: { streakDays: newStreak, totalKizari: { increment: 1 }, lastKizariAt: new Date() },
    }),
  ]);

  revalidatePath(`/${slug}`);
  revalidatePath("/me");
  return { success: true };
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
