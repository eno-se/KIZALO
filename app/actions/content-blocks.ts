"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const ALLOWED_TYPES = ["youtube", "image", "text", "spotify", "applemusic", "timetree", "ranking"] as const;
type BlockType = (typeof ALLOWED_TYPES)[number];

async function getProfile(userId: string) {
  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");
  return profile;
}

export async function addContentBlock(type: BlockType) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  if (!ALLOWED_TYPES.includes(type)) return { error: "Invalid type" };

  const profile = await getProfile(session.user.id);

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
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };
  if (data.link) {
    try { new URL(data.link); } catch { return { error: "リンクURLが不正です" }; }
  }

  const profile = await getProfile(session.user.id);
  const block = await db.contentBlock.findFirst({ where: { id, creatorId: profile.id } });
  if (!block) return { error: "ブロックが見つかりません" };

  // 画像ブロックで imageUrl が変わる場合は古い画像をR2から削除
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
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const profile = await getProfile(session.user.id);
  const block = await db.contentBlock.findFirst({ where: { id, creatorId: profile.id } });
  if (!block) return { error: "ブロックが見つかりません" };

  // 画像ブロックのR2削除
  if (block.imageUrl?.startsWith(R2_PUBLIC_URL)) {
    const key = block.imageUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try { await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key })); } catch {}
  }

  await db.contentBlock.delete({ where: { id } });

  // order を詰め直す
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
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  const profile = await getProfile(session.user.id);

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.contentBlock.updateMany({ where: { id, creatorId: profile.id }, data: { order: index } })
    )
  );

  revalidatePath(`/${profile.slug}`);
  revalidatePath("/edit");
}
