/**
 * 既存の featured* カラムのデータを ContentBlock テーブルへ移行する
 * 実行: npx ts-node --esm prisma/migrate-content-blocks.ts
 */
import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

async function main() {
  const profiles = await db.creatorProfile.findMany({
    where: {
      OR: [
        { featuredVideoUrl: { not: null } },
        { featuredImageUrl: { not: null } },
        { featuredTextTitle: { not: null } },
        { featuredTextCaption: { not: null } },
        { featuredMusicUrl: { not: null } },
        { featuredSpotifyUrl: { not: null } },
        { featuredCalendarUrl: { not: null } },
        { showFastestCard: true },
        { showRandomCard: true },
        { showMostCard: true },
        { showStreakCard: true },
      ],
    },
    include: {
      contentBlocks: true,
    },
  });

  console.log(`対象プロフィール: ${profiles.length}件`);

  for (const profile of profiles) {
    if (profile.contentBlocks.length > 0) {
      console.log(`スキップ（既にブロックあり）: ${profile.slug}`);
      continue;
    }

    const blocks: Array<{
      creatorId: string;
      type: string;
      order: number;
      title?: string | null;
      caption?: string | null;
      url?: string | null;
      imageUrl?: string | null;
      link?: string | null;
    }> = [];

    let order = 0;

    if (profile.featuredVideoUrl) {
      blocks.push({
        creatorId: profile.id,
        type: "youtube",
        order: order++,
        url: profile.featuredVideoUrl,
        title: profile.featuredVideoTitle,
        caption: profile.featuredVideoCaption,
      });
    }

    if (profile.featuredImageUrl) {
      blocks.push({
        creatorId: profile.id,
        type: "image",
        order: order++,
        imageUrl: profile.featuredImageUrl,
        title: profile.featuredImageTitle,
        caption: profile.featuredImageCaption,
        link: profile.featuredImageLink,
      });
    }

    if (profile.featuredTextTitle || profile.featuredTextCaption) {
      blocks.push({
        creatorId: profile.id,
        type: "text",
        order: order++,
        title: profile.featuredTextTitle,
        caption: profile.featuredTextCaption,
      });
    }

    if (profile.featuredMusicUrl) {
      blocks.push({
        creatorId: profile.id,
        type: "applemusic",
        order: order++,
        url: profile.featuredMusicUrl,
        title: profile.featuredMusicTitle,
        caption: profile.featuredMusicCaption,
      });
    }

    if (profile.featuredSpotifyUrl) {
      blocks.push({
        creatorId: profile.id,
        type: "spotify",
        order: order++,
        url: profile.featuredSpotifyUrl,
        title: profile.featuredSpotifyTitle,
        caption: profile.featuredSpotifyCaption,
      });
    }

    if (profile.featuredCalendarUrl) {
      blocks.push({
        creatorId: profile.id,
        type: "timetree",
        order: order++,
        url: profile.featuredCalendarUrl,
        title: profile.featuredCalendarTitle,
        caption: profile.featuredCalendarCaption,
      });
    }

    const hasRanking =
      profile.showFastestCard ||
      profile.showRandomCard ||
      profile.showMostCard ||
      profile.showStreakCard;

    if (hasRanking && blocks.length < 5) {
      blocks.push({
        creatorId: profile.id,
        type: "ranking",
        order: order++,
      });
    }

    if (blocks.length === 0) continue;

    await db.contentBlock.createMany({ data: blocks });
    console.log(`移行完了: ${profile.slug} — ${blocks.length}ブロック`);
  }

  console.log("移行完了");
}

main()
  .catch(console.error)
  .finally(async () => { await db.$disconnect(); });
