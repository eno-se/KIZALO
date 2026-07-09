import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import { getJstDateString } from "@/lib/jst";
import { extractYoutubeVideoId } from "@/lib/youtube";
import KizaruSection from "./KizaruSection";
import KizaruCardWrapper from "./KizaruCardWrapper";
import TrackedLink from "./TrackedLink";
import BioText from "@/app/components/BioText";
import FanNameMarquee from "@/app/components/FanNameMarquee";
import MenuButton from "./MenuButton";
import ReportButton from "./ReportButton";
import Image from "next/image";
import FeaturedImageCard from "./FeaturedImageCard";
import { extractAppleMusicEmbedUrl, getAppleMusicEmbedHeight } from "@/lib/apple-music";
import { extractSpotifyEmbedUrl, getSpotifyEmbedHeight } from "@/lib/spotify";
import { extractTimeTreeEmbedUrl } from "@/lib/timetree";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { displayName: true, bio: true, user: { select: { isBanned: true, isSuspended: true } } },
  });
  if (!creator || creator.user.isBanned || creator.user.isSuspended) return {};
  const title = `${creator.displayName} | KIZALO`;
  const description = creator.bio
    ? creator.bio.slice(0, 80)
    : `${creator.displayName}のKIZALOページ。毎日1回、応援の証を刻もう。`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/${slug}`,
      type: "profile",
      images: [{ url: "/og-base.png", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-base.png"],
    },
  };
}

const PLATFORM_LABEL: Record<string, string> = {
  x: "X", instagram: "Instagram", tiktok: "TikTok", youtube: "YouTube",
  twitch: "Twitch", showroom: "SHOWROOM", "17live": "17LIVE", pococha: "Pococha",
  note: "note", threads: "Threads", booth: "BOOTH", litlink: "lit.link", website: "公式サイト",
};

export default async function CreatorPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  // ログイン済みでCreatorProfileがない場合は/editへ
  if (session?.user) {
    const myProfile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!myProfile) redirect("/edit");
  }

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { isBanned: true, isSuspended: true } },
      socialLinks: { orderBy: { order: "asc" } },
      contentBlocks: { orderBy: { order: "asc" } },
      kizaris: {
        where: { date: getJstDateString() },
        include: { fan: { include: { creatorProfile: { select: { iconUrl: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!creator || !creator.isPublic || creator.user.isBanned || creator.user.isSuspended) notFound();

  const visibleKizaris = creator.kizaris;

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

  const myTotalKizari = session
    ? await db.kizari.count({ where: { fanId: session.user.id, creatorId: creator.id } })
    : 0;

  const myUser = session
    ? await db.user.findUnique({ where: { id: session.user.id }, select: { displayName: true, name: true, creatorProfile: { select: { slug: true, iconUrl: true } } } })
    : null;
  const myName = myUser?.displayName ?? myUser?.name ?? "あなた";

  // 最速刻み（今日最初の6人）
  const fastestKizaris = (await db.kizari.findMany({
    where: { creatorId: creator.id, date: today },
    include: { fan: { include: { creatorProfile: { select: { iconUrl: true } } } } },
    orderBy: { createdAt: "asc" },
    take: 6,
  }));

  // ランダム刻み（visibleKizarisからシャッフルして6人）
  const randomKizaris = [...visibleKizaris]
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  // 最多・継続カード用クエリ
  const mostFans = await db.fanFollow.findMany({
    where: { creatorId: creator.id },
    include: { fan: { include: { creatorProfile: { select: { iconUrl: true } } } } },
    orderBy: { totalKizari: "desc" },
    take: 6,
  });

  const streakFans = await db.fanFollow.findMany({
    where: { creatorId: creator.id, streakDays: { gt: 0 } },
    include: { fan: { include: { creatorProfile: { select: { iconUrl: true } } } } },
    orderBy: { streakDays: "desc" },
    take: 6,
  });



  return (
    <div className="min-h-screen px-4 pt-4 pb-28 max-w-lg mx-auto">
      {/* プロフィール */}
      <div className="px-2 mb-4">
        <MenuButton slug={slug} isOwner={isOwner} />

        {/* トプ画・名前・ID（センター） */}
        <div className="flex flex-col items-center text-center mb-5">
          {/* SNSアイコン横並び */}
          {creator.socialLinks.length > 0 && (
            <div className="flex gap-2 mb-3">
              {creator.socialLinks.map((link) => (
                <TrackedLink
                  key={link.id}
                  href={link.url}
                  creatorId={creator.id}
                  linkId={link.id}
                  label={PLATFORM_LABEL[link.platform] ?? link.platform}
                  platform={link.platform}
                  className="glass-btn-secondary w-10 h-10 rounded-xl flex items-center justify-center"
                >
                  <Image src={`/sns/${link.platform}.png`} alt={link.platform} width={28} height={28} className="object-contain" />
                </TrackedLink>
              ))}
            </div>
          )}

          {/* アバター */}
          <div
            className="rounded-full p-[3px] mb-3"
            style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
          >
            <div className="rounded-full bg-white p-[3px]" style={{ width: 106, height: 106 }}>
              <div className="rounded-full overflow-hidden" style={{ width: 100, height: 100 }}>
                {creator.iconUrl ? (
                  <Image src={creator.iconUrl} alt={creator.displayName} width={100} height={100} className="object-cover" style={{ width: 100, height: 100 }} />
                ) : (
                  <div className="bg-pink-50 flex items-center justify-center text-3xl text-[#F58BCB] font-bold" style={{ width: 100, height: 100 }}>
                    {creator.displayName[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-lg font-bold text-slate-800 mb-1">{creator.displayName}</h1>
          <p className="text-sm text-slate-400 mb-1">@{creator.slug}</p>
          {creator.bio && <BioText text={creator.bio} />}
          {creator.bioLink && (
            <TrackedLink
              href={creator.bioLink}
              creatorId={creator.id}
              linkId="bio"
              label={creator.bioLinkLabel || "リンク"}
              platform="bio"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #B98AF5 0%, #7DB7FF 100%)" }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>
                {creator.bioLinkLabel || creator.bioLink.replace(/^https?:\/\//, "")}
              </span>
            </TrackedLink>
          )}
        </div>
      </div>

      <KizaruSection
        creatorId={creator.id}
        slug={slug}
        alreadyKizared={alreadyKizared}
        isLoggedIn={!!session}
        streakDays={followInfo?.streakDays ?? 0}
        isOwner={isOwner}
        showKizaruButton={creator.showKizaruButton}
      >
        {session && !isOwner && (
        <KizaruCardWrapper>
        <div className="relative rounded-2xl pt-3 pb-4 px-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,139,203,0.75) 0%, rgba(185,138,245,0.80) 50%, rgba(125,183,255,0.72) 100%)", border: "1px solid rgba(255,255,255,0.40)", boxShadow: "0 4px 24px rgba(185,138,245,0.35)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
          <Image src="/logo.png" alt="KIZALO" width={56} height={17} className="absolute top-3 left-4 object-contain" style={{ filter: "brightness(0) invert(1)" }} />
          {/* 右上リボン（カードのoverflow-hiddenでクリップ） */}
          <div
            className="absolute font-bold text-white text-center"
            style={{
              width: 110,
              padding: "6px 0",
              fontSize: "0.55rem",
              letterSpacing: "0.04em",
              background: alreadyKizared
                ? "linear-gradient(135deg, #34d399, #059669)"
                : "rgba(255,255,255,0.35)",
              top: 18,
              right: -26,
              transform: "rotate(45deg)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
              pointerEvents: "none",
            }}
          >
            {alreadyKizared ? "本日、刻み済！" : "未刻み"}
          </div>
          <h2 className="text-xs font-bold text-white text-center mb-4 flex items-center justify-center gap-1.5">
            <span className="sparkle" style={{ background: "white" }} />刻み実績<span className="sparkle" style={{ background: "white" }} />
          </h2>

          {/* ファン情報 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div
              className="rounded-full p-[2px] flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
            >
              <div className="rounded-full bg-white p-[2px]" style={{ width: 56, height: 56 }}>
                <div className="rounded-full overflow-hidden bg-pink-50 flex items-center justify-center" style={{ width: 52, height: 52 }}>
                  {myUser?.creatorProfile?.iconUrl
                    ? <Image src={myUser.creatorProfile.iconUrl} alt={myName} width={52} height={52} className="object-cover" style={{ width: 52, height: 52 }} unoptimized />
                    : <span className="text-lg font-bold text-[#F58BCB]">{myName[0]}</span>}
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-white leading-tight">{myName}</p>
              {(myUser?.creatorProfile?.slug ?? myUser?.displayName) && (
                <p className="text-xs text-white/60">@{myUser.creatorProfile?.slug ?? myUser.displayName}</p>
              )}
            </div>
          </div>

          {/* 統計 */}
          <div className="flex items-center text-center w-full">
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{myTotalKizari}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">総合</div>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{followInfo?.streakDays ?? 0}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">連続</div>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{followInfo?.maxStreakDays ?? 0}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">最高連続</div>
            </div>
          </div>

          {followInfo && followInfo.streakDays > 0 && followInfo.streakDays >= followInfo.maxStreakDays && (
            <p className="text-center font-bold text-white mt-2" style={{ fontSize: "0.65rem" }}>
              🔥 記録更新中！！
            </p>
          )}
          {alreadyKizared && (followInfo?.streakDays ?? 0) >= 1 && (
            <p className="text-center text-white/80 mt-2" style={{ fontSize: "0.7rem" }}>
              明日も刻ると {(followInfo?.streakDays ?? 0) + 1}日連続になるよ！
            </p>
          )}
        </div>
        </KizaruCardWrapper>
        )}
      </KizaruSection>

      {/* コンテンツブロック */}
      {creator.contentBlocks.map((block) => {
        if (block.type === "youtube") {
          const videoId = extractYoutubeVideoId(block.url ?? "");
          if (!videoId) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                {block.title && (
                  <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
                    <span className="sparkle" />{block.title}<span className="sparkle" />
                  </h2>
                )}
                <div className="relative z-[1] w-full" style={{ aspectRatio: "16/9" }}>
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${videoId}`}
                    title="YouTube video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
                  />
                </div>
                {block.caption && (
                  <p className="relative z-[1] px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
                )}
              </div>
            </div>
          );
        }

        if (block.type === "image") {
          if (!block.imageUrl) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <FeaturedImageCard
                imageUrl={block.imageUrl}
                title={block.title ?? null}
                caption={block.caption ?? null}
                link={block.link ?? null}
                creatorId={creator.id}
                blockId={block.id}
              />
            </div>
          );
        }

        if (block.type === "text") {
          if (!block.title && !block.caption) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl px-5 py-4">
                {block.title && (
                  <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
                    <span className="sparkle" />{block.title}<span className="sparkle" />
                  </h2>
                )}
                {block.caption && (
                  <p className="relative z-[1] text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
                )}
              </div>
            </div>
          );
        }

        if (block.type === "applemusic") {
          const embedUrl = extractAppleMusicEmbedUrl(block.url ?? "");
          if (!embedUrl) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                {block.title && (
                  <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
                    <span className="sparkle" />{block.title}<span className="sparkle" />
                  </h2>
                )}
                <div className="relative z-[1]">
                  <iframe
                    src={embedUrl}
                    height={getAppleMusicEmbedHeight(embedUrl)}
                    allow="autoplay *; encrypted-media *; fullscreen *"
                    sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
                    className="w-full border-0"
                    title="Apple Music"
                  />
                </div>
                {block.caption && (
                  <p className="relative z-[1] px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
                )}
              </div>
            </div>
          );
        }

        if (block.type === "spotify") {
          const embedUrl = extractSpotifyEmbedUrl(block.url ?? "");
          if (!embedUrl) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                {block.title && (
                  <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
                    <span className="sparkle" />{block.title}<span className="sparkle" />
                  </h2>
                )}
                <div className="relative z-[1]">
                  <iframe
                    src={embedUrl}
                    height={getSpotifyEmbedHeight(embedUrl)}
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="w-full border-0"
                    style={{ borderRadius: 12 }}
                    title="Spotify"
                  />
                </div>
                {block.caption && (
                  <p className="relative z-[1] px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
                )}
              </div>
            </div>
          );
        }

        if (block.type === "timetree") {
          const embedUrl = extractTimeTreeEmbedUrl(block.url ?? "");
          if (!embedUrl) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl overflow-hidden">
                {block.title && (
                  <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
                    <span className="sparkle" />{block.title}<span className="sparkle" />
                  </h2>
                )}
                <div className="relative z-[1]">
                  <iframe
                    src={embedUrl}
                    height={500}
                    allow="autoplay"
                    className="w-full border-0"
                    title="タイムツリー"
                  />
                </div>
                {block.caption && (
                  <p className="relative z-[1] px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
                )}
              </div>
            </div>
          );
        }

        if (block.type === "ranking") {
          const order = (creator.cardOrder ?? "fastest,random,most,streak").split(",");
          const showMap: Record<string, boolean> = {
            fastest: creator.showFastestCard,
            random: creator.showRandomCard,
            most: creator.showMostCard,
            streak: creator.showStreakCard,
          };
          const visibleKeys = order.filter((k) => showMap[k]);
          if (visibleKeys.length === 0) return null;
          return (
            <div key={block.id} className="w-full max-w-lg mx-auto px-4 mt-4 mb-2">
              <div className="glass-card rounded-2xl px-5 divide-y divide-slate-100">
                {visibleKeys.map((key) => (
                  <div key={key} className="py-4">
                    {key === "fastest" && (
                      <>
                        <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
                          <span className="sparkle" />最速<span className="sparkle" />
                        </h2>
                        {fastestKizaris.length === 0 ? (
                          <div className="text-center py-2">
                            <p className="text-slate-400 text-xs">まだ誰も刻っていません</p>
                            <p className="text-xs font-bold brand-gradient-text mt-1">今日最初に刻む人になろう！</p>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-3 gap-2">
                              {fastestKizaris.map((k) => {
                                const name = k.fan.displayName ?? k.fan.name ?? "名無し";
                                const iconUrl = k.fan.creatorProfile?.iconUrl;
                                const isMe = k.fanId === session?.user.id;
                                return (
                                  <div key={k.id} className="flex items-center gap-2">
                                    <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                      {iconUrl ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized /> : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                                    </div>
                                    <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-center mt-4">
                              <a href={`/${slug}/kizaris`} className="inline-flex items-center gap-1 text-xs brand-gradient-text font-bold">もっと見る<span className="more-icon" /></a>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {key === "random" && (
                      <>
                        <h2 className="text-xs font-bold brand-gradient-text text-center mb-1 flex items-center justify-center gap-1.5">
                          <span className="sparkle" />ランダム<span className="sparkle" />
                        </h2>
                        {randomKizaris.length === 0 ? (
                          <div className="text-center py-2">
                            <p className="text-slate-400 text-xs">まだ誰も刻っていません</p>
                            <p className="text-xs font-bold brand-gradient-text mt-1">今日最初に刻む人になろう！</p>
                          </div>
                        ) : (
                          <>
                            <p className="text-center text-slate-400 mb-3" style={{ fontSize: "0.6rem" }}>ランダムで{randomKizaris.length}名表示中！</p>
                            <div className="grid grid-cols-3 gap-2">
                              {randomKizaris.map((k) => {
                                const name = k.fan.displayName ?? k.fan.name ?? "名無し";
                                const iconUrl = k.fan.creatorProfile?.iconUrl;
                                const isMe = k.fanId === session?.user.id;
                                return (
                                  <div key={k.id} className="flex items-center gap-2">
                                    <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                      {iconUrl ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized /> : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                                    </div>
                                    <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-center mt-4">
                              <a href={`/${slug}/kizaris`} className="inline-flex items-center gap-1 text-xs brand-gradient-text font-bold">もっと見る<span className="more-icon" /></a>
                            </div>
                          </>
                        )}
                      </>
                    )}
                    {key === "most" && (
                      <>
                        <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
                          <span className="sparkle" />歴代最多<span className="sparkle" />
                        </h2>
                        {mostFans.length === 0 ? (
                          <div className="text-center py-2">
                            <p className="text-slate-400 text-xs">まだ誰も刻っていません</p>
                            <p className="text-xs font-bold brand-gradient-text mt-1">今日最初に刻む人になろう！</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {mostFans.map((f) => {
                              const name = f.fan.displayName ?? f.fan.name ?? "名無し";
                              const iconUrl = f.fan.creatorProfile?.iconUrl;
                              const isMe = f.fanId === session?.user.id;
                              return (
                                <div key={f.id} className="flex items-center gap-2">
                                  <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                    {iconUrl ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized /> : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                                    <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>{f.totalKizari}回</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                    {key === "streak" && (
                      <>
                        <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
                          <span className="sparkle" />歴代継続<span className="sparkle" />
                        </h2>
                        {streakFans.length === 0 ? (
                          <div className="text-center py-2">
                            <p className="text-slate-400 text-xs">まだ誰も刻っていません</p>
                            <p className="text-xs font-bold brand-gradient-text mt-1">今日最初に刻む人になろう！</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {streakFans.map((f) => {
                              const name = f.fan.displayName ?? f.fan.name ?? "名無し";
                              const iconUrl = f.fan.creatorProfile?.iconUrl;
                              const isMe = f.fanId === session?.user.id;
                              return (
                                <div key={f.id} className="flex items-center gap-2">
                                  <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                                    {iconUrl ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized /> : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                                    <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>🔥 {f.streakDays}日連続</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return null;
      })}

      {session && !isOwner && (
        <div className="flex justify-center mt-6 mb-2">
          <ReportButton targetUserId={creator.userId} />
        </div>
      )}

    </div>
  );
}
