"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireActiveUser } from "@/lib/require-active-user";

export async function setupUser(displayName: string, slug: string, honeypot: string = "") {
  if (honeypot) return { error: "エラーが発生しました" };
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(slug)) {
    return { error: "IDは英数字・アンダースコア・ハイフン（3〜30文字）で入力してください" };
  }

  const existing = await db.creatorProfile.findUnique({
    where: { slug },
    select: { userId: true },
  });
  if (existing && existing.userId !== userId) {
    return { error: "このIDはすでに使われています" };
  }

  const hasProfile = await db.creatorProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { displayName },
    }),
    ...(hasProfile
      ? []
      : [
          db.creatorProfile.create({
            data: { userId, slug, displayName },
          }),
        ]),
  ]);

  return { success: true, slug };
}

export async function updateDisplayName(displayName: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };

  await db.user.update({
    where: { id: r.userId },
    data: { displayName },
  });

  revalidatePath("/me");
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccount() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
}

export async function submitReport(targetUserId: string, reason: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  if (r.userId === targetUserId) throw new Error("Cannot report yourself");

  const existing = await db.report.findUnique({
    where: { reporterId_targetUserId: { reporterId: r.userId, targetUserId } },
    select: { createdAt: true },
  });

  if (existing) {
    const hoursSince = (Date.now() - existing.createdAt.getTime()) / 3600000;
    if (hoursSince < 24) {
      return { error: "同じユーザーへの通報は24時間後に再度できます" };
    }
  }

  await db.report.upsert({
    where: { reporterId_targetUserId: { reporterId: r.userId, targetUserId } },
    create: { reporterId: r.userId, targetUserId, reason },
    update: { reason, createdAt: new Date() },
  });

  return {};
}
