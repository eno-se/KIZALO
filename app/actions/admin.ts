"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";

export async function adminSuspendUser(userId: string, suspend: boolean) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { isSuspended: suspend } });
  revalidatePath("/admin/users");
}

export async function adminDeleteUser(userId: string) {
  await requireAdmin();
  await db.user.delete({ where: { id: userId } });
  revalidatePath("/admin/users");
}

export async function adminUpdateDisplayName(userId: string, displayName: string) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { displayName } });
  revalidatePath("/admin/users");
}

export async function adminSetCreatorVisibility(creatorId: string, isPublic: boolean) {
  await requireAdmin();
  const creator = await db.creatorProfile.findUnique({ where: { id: creatorId }, select: { slug: true } });
  await db.creatorProfile.update({ where: { id: creatorId }, data: { isPublic } });
  revalidatePath("/admin/creators");
  if (creator) revalidatePath(`/${creator.slug}`);
}

export async function adminUpdateSlug(creatorId: string, newSlug: string) {
  await requireAdmin();
  const existing = await db.creatorProfile.findUnique({ where: { slug: newSlug } });
  if (existing && existing.id !== creatorId) return { error: "このIDはすでに使われています" };
  await db.creatorProfile.update({ where: { id: creatorId }, data: { slug: newSlug } });
  revalidatePath("/admin/creators");
  return { success: true };
}

export async function adminClearCreatorBio(creatorId: string) {
  await requireAdmin();
  await db.creatorProfile.update({ where: { id: creatorId }, data: { bio: "" } });
  revalidatePath("/admin/creators");
}

export async function adminClearCreatorIcon(creatorId: string) {
  await requireAdmin();
  await db.creatorProfile.update({ where: { id: creatorId }, data: { iconUrl: null } });
  revalidatePath("/admin/creators");
}

export async function adminDeleteCreator(creatorId: string) {
  await requireAdmin();
  await db.creatorProfile.delete({ where: { id: creatorId } });
  revalidatePath("/admin/creators");
}

export async function adminDeleteKizari(kizariId: string) {
  await requireAdmin();
  await db.kizari.delete({ where: { id: kizariId } });
  revalidatePath("/admin/kizaris");
}

export async function adminBanUser(userId: string, ban: boolean) {
  await requireAdmin();
  await db.user.update({ where: { id: userId }, data: { isBanned: ban } });
  revalidatePath("/admin/reports");
}

export async function adminDeleteReport(reportId: string) {
  await requireAdmin();
  await db.report.delete({ where: { id: reportId } });
  revalidatePath("/admin/reports");
}
