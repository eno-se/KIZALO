import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getJstDateString } from "@/lib/jst";
import KizaruButton from "./KizaruButton";
import Image from "next/image";

const PLATFORM_LABELS: Record<string, string> = {
  x: "X (Twitter)", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  twitch: "Twitch", showroom: "SHOWROOM", seventeen: "17LIVE", pococha: "Pococha",
  note: "note", threads: "Threads", booth: "BOOTH", litlink: "lit.link", website: "公式サイト",
};

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    include: {
      socialLinks: { orderBy: { order: "asc" } },
      blockedFans: true,
      fans: {
        include: { fan: true },
        orderBy: { streakDays: "desc" },
      },
      kizaris: {
        where: { date: getJstDateString() },
        include: { fan: true },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!creator || !creator.isPublic) notFound();

  const blockedFanIds = new Set(creator.blockedFans.map((b) => b.fanId));
  const visibleKizaris = creator.kizaris.filter((k) => !blockedFanIds.has(k.fanId));

  const today = getJstDateString();
  let alreadyKizared = false;
  let followInfo = null;
  const isOwner = session?.user.id === creator.userId;

  if (session) {
    const todayRecord = await db.kizari.findUnique({
      where: { fanId_creatorId_date: { fanId: session.user.id, creatorId: creator.id, date: today } },
    });
    alreadyKizared = !!todayRecord;
    followInfo = await db.fanFollow.findUnique({
      where: { fanId_creatorId: { fanId: session.user.id, creatorId: creator.id } },
    });
  }

  const totalKizariCount = await db.kizari.count({ where: { creatorId: creator.id } });
  const fanCount = await db.fanFollow.count({ where: { creatorId: creator.id } });

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* プロフィールカード */}
      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          {creator.iconUrl ? (
            <Image
              src={creator.iconUrl}
              alt={creator.displayName}
              width={64}
              height={64}
              className="rounded-full object-cover w-16 h-16"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center text-2xl text-violet-400 font-bold">
              {creator.displayName[0]}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-slate-800">{creator.displayName}</h1>
            <p className="text-sm text-slate-400">@{creator.slug}</p>
          </div>
          {isOwner && (
            <a
              href="/dashboard"
              className="ml-auto text-xs glass-btn-secondary px-3 py-1.5 rounded-lg"
            >
              管理
            </a>
          )}
        </div>
        {creator.bio && (
          <p className="text-sm text-slate-600 whitespace-pre-wrap mb-4">{creator.bio}</p>
        )}

        {/* SNSリンク */}
        {creator.socialLinks.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {creator.socialLinks.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs glass-btn-secondary px-3 py-1.5 rounded-lg"
              >
                {PLATFORM_LABELS[link.platform] ?? link.platform}
              </a>
            ))}
          </div>
        )}

        {/* 統計 */}
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-lg font-bold text-violet-600">{totalKizariCount}</div>
            <div className="text-xs text-slate-400">総キザり数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-violet-600">{fanCount}</div>
            <div className="text-xs text-slate-400">ファン数</div>
          </div>
          {followInfo && (
            <div>
              <div className="text-lg font-bold text-violet-600">{followInfo.streakDays}日</div>
              <div className="text-xs text-slate-400">連続キザり</div>
            </div>
          )}
        </div>
      </div>

      {/* キザるボタン */}
      {!isOwner && (
        <KizaruButton
          creatorId={creator.id}
          slug={slug}
          alreadyKizared={alreadyKizared}
          isLoggedIn={!!session}
          streakDays={followInfo?.streakDays ?? 0}
        />
      )}

      {/* 今日キザったファン */}
      <div className="glass-card rounded-2xl p-5 mt-4">
        <h2 className="text-sm font-semibold text-slate-600 mb-3">
          今日名前を刻んだファン
          <span className="ml-2 text-violet-500 font-bold">{visibleKizaris.length}</span>
        </h2>
        {visibleKizaris.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">
            まだ誰もキザっていません。最初の1人になろう！
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {visibleKizaris.map((k) => (
              <span key={k.id} className="name-chip text-xs px-3 py-1.5 rounded-full text-slate-700">
                {k.fan.displayName ?? k.fan.name ?? "名無し"}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
