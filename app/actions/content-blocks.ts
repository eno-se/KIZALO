"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { requireActiveUser } from "@/lib/require-active-user";

const ALLOWED_TYPES = ["youtube", "image", "text", "spotify", "applemusic", "timetree", "ranking"] as const;
type BlockType = (typeof ALLOWED_TYPES)[number];

async function getProfile(userId: string) {
  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function addContentBlock(type: BlockType) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  if (!ALLOWED_TYPES.includes(type)) return { error: "Invalid type" };

  const profile = await getProfile(r.userId);

  const count = await db.contentBlock.count({ where: { creatorId: profile.id } });
  if (count >= 5) return { error: "コンテンツは最大5個まで追加できます" };

  const block = await db.contentBlock.create({
    data: { creatorId: profile.id, type, order: count },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
  return { success: true, id: block.id };
}

export async function updateContentBlock(
  id: string,
  data: {
    title?: string | null;
    caption?: string | null;
    url?: string | null;
    imageUrl?: string | null;
    link?: string | null;
  }
) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };
  if (data.link) {
    try {
      const u = new URL(data.link);
      if (u.protocol !== "http:" && u.protocol !== "https:") return { error: "リンクURLはhttp/httpsで入力してください" };
    } catch { return { error: "リンクURLが不正です" }; }
  }

  const profile = await getProfile(r.userId);
  const block = await db.contentBlock.findFirst({ where: { id, creatorId: profile.id } });
  if (!block) return { error: "ブロックが見つかりません" };

  if (
    data.imageUrl !== undefined &&
    data.imageUrl !== block.imageUrl &&
    block.imageUrl?.startsWith(R2_PUBLIC_URL)
  ) {
    const oldKey = block.imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try { await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey })); } catch {}
  }

  await db.contentBlock.update({
    where: { id },
    data: {
      ...(data.title !== undefined && { title: data.title || null }),
      ...(data.caption !== undefined && { caption: data.caption || null }),
      ...(data.url !== undefined && { url: data.url || null }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl || null }),
      ...(data.link !== undefined && { link: data.link || null }),
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function deleteContentBlock(id: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };

  const profile = await getProfile(r.userId);
  const block = await db.contentBlock.findFirst({ where: { id, creatorId: profile.id } });
  if (!block) return { error: "ブロックが見つかりません" };

  if (block.imageUrl?.startsWith(R2_PUBLIC_URL)) {
    const key = block.imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try { await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })); } catch {}
  }

  await db.contentBlock.delete({ where: { id } });

  const remaining = await db.contentBlock.findMany({
    where: { creatorId: profile.id },
    orderBy: { order: "asc" },
  });
  await db.$transaction(
    remaining.map((b, i) => db.contentBlock.update({ where: { id: b.id }, data: { order: i } }))
  );

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function reorderContentBlocks(orderedIds: string[]) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };

  const profile = await getProfile(r.userId);

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.contentBlock.updateMany({ where: { id, creatorId: profile.id }, data: { order: index } })
    )
  );

  revalidatePath(`/${profile.slug}`);
  revalidatePath("/edit");
}
