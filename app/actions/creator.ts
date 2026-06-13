"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function createCreatorProfile(slug: string, displayName: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(slug)) {
    return { error: "IDは英数字・アンダースコア・ハイフン（3〜30文字）で入力してください" };
  }

  const existing = await db.creatorProfile.findUnique({ where: { slug } });
  if (existing) return { error: "このIDはすでに使われています" };

  await db.creatorProfile.create({
    data: { userId: session.user.id, slug, displayName },
  });

  revalidatePath("/dashboard");
  return { success: true, slug };
}

export async function updateCreatorProfile(data: {
  displayName: string;
  bio: string;
}) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: { displayName: data.displayName, bio: data.bio },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/${profile.slug}`);
}

export async function upsertSocialLink(platform: string, url: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) throw new Error("Profile not found");

  const existing = await db.socialLink.findFirst({
    where: { creatorId: profile.id, platform },
  });

  if (existing) {
    await db.socialLink.update({ where: { id: existing.id }, data: { url } });
  } else {
    const count = await db.socialLink.count({ where: { creatorId: profile.id } });
    await db.socialLink.create({ data: { creatorId: profile.id, platform, url, order: count } });
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${profile.slug}`);
}

export async function deleteSocialLink(id: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) throw new Error("Profile not found");

  await db.socialLink.deleteMany({ where: { id, creatorId: profile.id } });

  revalidatePath("/dashboard");
}

export async function blockFan(fanId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) throw new Error("Profile not found");

  await db.blockedFan.upsert({
    where: { creatorId_fanId: { creatorId: profile.id, fanId } },
    create: { creatorId: profile.id, fanId },
    update: {},
  });

  revalidatePath(`/${profile.slug}`);
}

export async function unblockFan(fanId: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const profile = await db.creatorProfile.findUnique({ where: { userId: session.user.id } });
  if (!profile) throw new Error("Profile not found");

  await db.blockedFan.deleteMany({ where: { creatorId: profile.id, fanId } });

  revalidatePath(`/${profile.slug}`);
  revalidatePath("/dashboard");
}
