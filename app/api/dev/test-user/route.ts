import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/dev/test-user?creatorSlug=xxx&streak=3
// テストファンユーザーを作成し、指定クリエイターに対して streak 日前から連続刻り状態を準備する
export async function GET(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const creatorSlug = searchParams.get("creatorSlug");
  const streak = Math.max(1, parseInt(searchParams.get("streak") ?? "3"));

  // テストファンユーザーを作成 or 取得
  const testUser = await db.user.upsert({
    where: { email: "test-fan@dev.local" },
    create: {
      email: "test-fan@dev.local",
      name: "テストファン",
      displayName: "テストファン",
    },
    update: {},
  });

  // CreatorProfile がなければ作成（ページ閲覧のために必要）
  const existingProfile = await db.creatorProfile.findUnique({ where: { userId: testUser.id } });
  if (!existingProfile) {
    try {
      await db.creatorProfile.create({
        data: { userId: testUser.id, slug: "test-fan-dev", displayName: "テストファン" },
      });
    } catch {
      // slug 重複時は無視
    }
  }

  // クリエイター指定がある場合、streak セットアップ
  if (creatorSlug) {
    const creator = await db.creatorProfile.findUnique({ where: { slug: creatorSlug } });
    if (!creator) {
      return NextResponse.json({ error: `Creator "${creatorSlug}" not found` }, { status: 404 });
    }

    // JST 昨日の日時（streak の連続が続いている状態にする）
    const jstNow = Date.now() + 9 * 60 * 60 * 1000;
    const yesterday = new Date(jstNow - 24 * 60 * 60 * 1000);
    const today = new Date(jstNow).toISOString().slice(0, 10);

    // 今日分の kizari を削除（再テスト可能にする）
    await db.kizari.deleteMany({
      where: { fanId: testUser.id, creatorId: creator.id, date: today },
    });

    // FanFollow を streak 状態でセットアップ
    await db.fanFollow.upsert({
      where: { fanId_creatorId: { fanId: testUser.id, creatorId: creator.id } },
      create: {
        fanId: testUser.id,
        creatorId: creator.id,
        streakDays: streak,
        maxStreakDays: streak,
        totalKizari: streak,
        lastKizariAt: yesterday,
      },
      update: {
        streakDays: streak,
        maxStreakDays: streak,
        totalKizari: streak,
        lastKizariAt: yesterday,
      },
    });

    return NextResponse.json({
      userId: testUser.id,
      message: `テストファン準備完了: ${creator.displayName} に対して ${streak}日連続の状態`,
      next: `POST /api/dev-login { "userId": "${testUser.id}" } でログイン`,
    });
  }

  return NextResponse.json({
    userId: testUser.id,
    message: "テストファン作成済み（streak なし）",
    next: `POST /api/dev-login { "userId": "${testUser.id}" } でログイン`,
  });
}
