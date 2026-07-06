"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { getJstDateString } from "@/lib/jst";
import { containsNgWord } from "@/lib/ngwords";
import { requireActiveUser } from "@/lib/require-active-user";

export async function updateSlug(newSlug: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(newSlug)) {
    return { error: "IDは英数字・アンダースコア・ハイフン（3〜30文字）で入力してください" };
  }
  if (containsNgWord(newSlug)) {
    return { error: "このIDは使用できません" };
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) return { error: "プロフィールが見つかりません" };

  // 当日JST内に変更済みかチェック
  if (profile.slugChangedAt) {
    const changedDate = new Date(profile.slugChangedAt.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
    if (changedDate === getJstDateString()) {
      return { error: "IDの変更は1日1回までです。明日以降にお試しください。" };
    }
  }

  if (newSlug === profile.slug) return { success: true };

  const existing = await db.creatorProfile.findUnique({ where: { slug: newSlug } });
  if (existing) return { error: "このIDはすでに使われています" };

  const oldSlug = profile.slug;
  await db.creatorProfile.update({
    where: { id: profile.id },
    data: { slug: newSlug, slugChangedAt: new Date() },
  });

  revalidatePath("/edit");
  revalidatePath(`/${oldSlug}`);
  revalidatePath(`/${newSlug}`);
  return { success: true, newSlug };
}

export async function createCreatorProfile(slug: string, displayName: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const slugRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  if (!slugRegex.test(slug)) {
    return { error: "IDは英数字・アンダースコア・ハイフン（3〜30文字）で入力してください" };
  }
  if (containsNgWord(slug) || containsNgWord(displayName)) {
    return { error: "この内容は使用できません" };
  }

  const existing = await db.creatorProfile.findUnique({ where: { slug } });
  if (existing) return { error: "このIDはすでに使われています" };

  await db.creatorProfile.create({
    data: { userId, slug, displayName },
  });

  revalidatePath("/dashboard");
  return { success: true, slug };
}

export async function updateFeaturedImage(data: {
  imageUrl: string | null;
  title: string | null;
  caption: string | null;
  link: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };
  if (data.link) {
    try { new URL(data.link); } catch { return { error: "リンクURLが不正です" }; }
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  if (
    data.imageUrl !== profile.featuredImageUrl &&
    profile.featuredImageUrl?.startsWith(R2_PUBLIC_URL)
  ) {
    const oldKey = profile.featuredImageUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try { await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey })); } catch {}
  }

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredImageUrl: data.imageUrl || null,
      featuredImageTitle: data.title || null,
      featuredImageCaption: data.caption || null,
      featuredImageLink: data.link || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateFeaturedCalendar(data: {
  url: string | null;
  title: string | null;
  caption: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredCalendarUrl: data.url || null,
      featuredCalendarTitle: data.title || null,
      featuredCalendarCaption: data.caption || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateFeaturedSpotify(data: {
  url: string | null;
  title: string | null;
  caption: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredSpotifyUrl: data.url || null,
      featuredSpotifyTitle: data.title || null,
      featuredSpotifyCaption: data.caption || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateFeaturedMusic(data: {
  url: string | null;
  title: string | null;
  caption: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredMusicUrl: data.url || null,
      featuredMusicTitle: data.title || null,
      featuredMusicCaption: data.caption || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateFeaturedText(data: {
  title: string | null;
  caption: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredTextTitle: data.title || null,
      featuredTextCaption: data.caption || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateFeaturedVideo(data: {
  url: string | null;
  title: string | null;
  caption: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (data.title && data.title.length > 50) return { error: "タイトルは50文字以内で入力してください" };
  if (data.caption && data.caption.length > 2200) return { error: "文章は2200文字以内で入力してください" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      featuredVideoUrl: data.url || null,
      featuredVideoTitle: data.title || null,
      featuredVideoCaption: data.caption || null,
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateProfileIdentity(displayName: string, iconUrl: string | null) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const { validateDisplayName } = await import("@/lib/sns-validation");
  const nameErr = validateDisplayName(displayName);
  if (nameErr) return { error: nameErr };
  if (containsNgWord(displayName)) return { error: "この内容は使用できません" };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  if (iconUrl !== profile.iconUrl && profile.iconUrl?.startsWith(R2_PUBLIC_URL)) {
    const oldKey = profile.iconUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try { await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey })); } catch {}
  }

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: { displayName: displayName.trim(), iconUrl },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateProfileBio(bio: string, bioLink: string, bioLinkLabel: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  if (containsNgWord(bio)) return { error: "この内容は使用できません" };

  if (bioLink) {
    try {
      const parsed = new URL(bioLink);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "URLはhttpまたはhttpsで始めてください" };
      }
    } catch {
      return { error: "有効なURLを入力してください" };
    }
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      bio: bio.replace(/\n{2,}/g, "\n"),
      bioLink: bioLink ?? "",
      bioLinkLabel: bioLinkLabel ?? "",
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateCreatorProfile(data: {
  displayName: string;
  bio: string;
  bioLink?: string;
  bioLinkLabel?: string;
  iconUrl?: string | null;
  featuredVideoUrl?: string | null;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const { validateDisplayName } = await import("@/lib/sns-validation");
  const nameErr = validateDisplayName(data.displayName);
  if (nameErr) return { error: nameErr };

  if (containsNgWord(data.displayName) || containsNgWord(data.bio)) {
    return { error: "この内容は使用できません" };
  }

  if (data.bioLink) {
    try {
      const parsed = new URL(data.bioLink);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        return { error: "URLはhttpまたはhttpsで始めてください" };
      }
    } catch {
      return { error: "有効なURLを入力してください" };
    }
  }

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  if (
    data.iconUrl !== undefined &&
    data.iconUrl !== profile.iconUrl &&
    profile.iconUrl?.startsWith(R2_PUBLIC_URL)
  ) {
    const oldKey = profile.iconUrl.replace(`${R2_PUBLIC_URL}/`, "");
    try {
      await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: oldKey }));
    } catch {}
  }

  await db.creatorProfile.update({
    where: { id: profile.id },
    data: {
      displayName: data.displayName,
      bio: data.bio.replace(/\n{2,}/g, "\n"),
      bioLink: data.bioLink ?? "",
      bioLinkLabel: data.bioLinkLabel ?? "",
      ...(data.iconUrl !== undefined && { iconUrl: data.iconUrl }),
      ...(data.featuredVideoUrl !== undefined && { featuredVideoUrl: data.featuredVideoUrl || null }),
    },
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function upsertSocialLink(platform: string, url: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const { validateSnsUrl } = await import("@/lib/sns-validation");
  const validationError = validateSnsUrl(platform, url);
  if (validationError) return { error: validationError };

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  const existing = await db.socialLink.findFirst({
    where: { creatorId: profile.id, platform },
  });

  let linkId: string;
  if (existing) {
    await db.socialLink.update({ where: { id: existing.id }, data: { url } });
    linkId = existing.id;
  } else {
    const count = await db.socialLink.count({ where: { creatorId: profile.id } });
    if (count >= 4) return { error: "SNSリンクは4つまで登録できます" };
    const created = await db.socialLink.create({ data: { creatorId: profile.id, platform, url, order: count } });
    linkId = created.id;
  }

  revalidatePath("/dashboard");
  revalidatePath(`/${profile.slug}`);
  return { id: linkId };
}

export async function reorderSocialLinks(orderedIds: string[]) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.$transaction(
    orderedIds.map((id, index) =>
      db.socialLink.updateMany({ where: { id, creatorId: profile.id }, data: { order: index } })
    )
  );

  revalidatePath(`/${profile.slug}`);
  revalidatePath("/edit");
}

export async function deleteSocialLink(id: string) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.socialLink.deleteMany({ where: { id, creatorId: profile.id } });

  revalidatePath("/dashboard");
}

export async function updateButtonVisibility(data: { showKizaruButton: boolean }) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");
  await db.creatorProfile.update({ where: { id: profile.id }, data });
  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}

export async function updateCardVisibility(data: {
  showFastestCard: boolean;
  showRandomCard: boolean;
  showMostCard: boolean;
  showStreakCard: boolean;
  cardOrder: string;
}) {
  const r = await requireActiveUser();
  if ("error" in r) return { error: r.error };
  const { userId } = r;

  const profile = await db.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Profile not found");

  await db.creatorProfile.update({
    where: { id: profile.id },
    data,
  });

  revalidatePath("/edit");
  revalidatePath(`/${profile.slug}`);
}
