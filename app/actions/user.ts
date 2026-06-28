"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setupUser(displayName: string, slug: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(slug)) {
    return { error: "IDは英数字・アンダースコア・ハイフン（3〜30文字）で入力してください" };
  }

  const existing = await db.creatorProfile.findUnique({
    where: { slug },
    select: { userId: true },
  });
  if (existing && existing.userId !== session.user.id) {
    return { error: "このIDはすでに使われています" };
  }

  const hasProfile = await db.creatorProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  await db.$transaction([
    db.user.update({
      where: { id: session.user.id },
      data: { displayName },
    }),
    ...(hasProfile
      ? []
      : [
          db.creatorProfile.create({
            data: { userId: session.user.id, slug, displayName },
          }),
        ]),
  ]);

  return { success: true, slug };
}

export async function updateDisplayName(displayName: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: session.user.id },
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
