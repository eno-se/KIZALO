import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import { getJstDateString } from "@/lib/jst";
import KizaruButton from "./KizaruButton";
import TrackedLink from "./TrackedLink";
import BioText from "@/app/components/BioText";
import FanNameMarquee from "@/app/components/FanNameMarquee";
import ShareButton from "./ShareButton";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { displayName: true, bio: true },
  });
  if (!creator) return {};
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
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
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

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    include: {
      socialLinks: { orderBy: { order: "asc" } },
      kizaris: {
        where: { date: getJstDateString() },
        include: { fan: { include: { creatorProfile: { select: { iconUrl: true } } } } },
        orderBy: { createdAt: "desc" },
        take: 30,
      },
    },
  });

  if (!creator || !creator.isPublic) notFound();

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
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      {/* プロフィール */}
      <div className="px-2 mb-4">
        {/* 右上ボタン */}
        <div className="flex justify-end gap-2 mb-2">
          <ShareButton slug={slug} />
          {isOwner && (
            <a href="/edit" className="text-xs glass-btn-secondary px-3 py-1.5 rounded-lg flex items-center">
              編集
            </a>
          )}
        </div>

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
            <div className="rounded-full bg-white p-[3px]" style={{ width: 166, height: 166 }}>
              <div className="rounded-full overflow-hidden" style={{ width: 160, height: 160 }}>
                {creator.iconUrl ? (
                  <Image src={creator.iconUrl} alt={creator.displayName} width={160} height={160} className="object-cover" style={{ width: 160, height: 160 }} />
                ) : (
                  <div className="bg-pink-50 flex items-center justify-center text-3xl text-[#F58BCB] font-bold" style={{ width: 160, height: 160 }}>
                    {creator.displayName[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-slate-800 mb-1">{creator.displayName}</h1>
          <p className="text-sm text-slate-400 mb-1">@{creator.slug}</p>
          {creator.bio && <BioText text={creator.bio} />}
          {creator.bioLink && (
            <TrackedLink
              href={creator.bioLink}
              creatorId={creator.id}
              linkId="bio"
              label={creator.bioLinkLabel || "リンク"}
              platform="bio"
              className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn-secondary text-xs font-semibold"
            >
              <span
                className="flex-shrink-0"
                style={{
                  width: 14,
                  height: 14,
                  maskImage: "url(/link-icon.png)",
                  maskSize: "contain",
                  maskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskImage: "url(/link-icon.png)",
                  WebkitMaskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  background: "#94a3b8",
                }}
              />
              <span
                style={{
                  background: "#94a3b8",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {creator.bioLinkLabel || creator.bioLink.replace(/^https?:\/\//, "")}
              </span>
            </TrackedLink>
          )}
        </div>

      </div>

      {/* キザるボタン（固定） */}
      {!isOwner && creator.showKizaruButton && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pt-4">
          <div className="max-w-lg mx-auto flex justify-center">
            <KizaruButton
              creatorId={creator.id}
              slug={slug}
              alreadyKizared={alreadyKizared}
              isLoggedIn={!!session}
              streakDays={followInfo?.streakDays ?? 0}
            />
          </div>
        </div>
      )}

      {/* 私の刻み実績 */}
      {session && !isOwner && (
        <div className="relative rounded-2xl pt-3 pb-4 px-4 mt-4 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(245,139,203,0.75) 0%, rgba(185,138,245,0.80) 50%, rgba(125,183,255,0.72) 100%)", border: "1px solid rgba(255,255,255,0.40)", boxShadow: "0 4px 24px rgba(185,138,245,0.35)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
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
        </div>
      )}

      {/* カード（cardOrderに従って描画） */}
      {(creator.cardOrder ?? "fastest,random,kizaki").split(",").map((key) => {
        if (key === "fastest") return (
          <div key="fastest" className="glass-card rounded-2xl pt-2 pb-4 px-5 mt-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />今日、{creator.displayName}に最速で刻んだ人<span className="sparkle" />
            </h2>
            {!creator.showFastestCard ? (
              <div className="flex justify-center py-2">
                <span style={{ display: "inline-block", width: 32, height: 32, maskImage: "url(/hidden-icon.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", WebkitMaskImage: "url(/hidden-icon.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", background: "#94a3b8" }} />
              </div>
            ) : fastestKizaris.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-2">まだ誰も刻っていません</p>
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
                          {iconUrl
                            ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                            : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                        </div>
                        <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-5">
                  <a href={`/${slug}/kizaris`} className="inline-flex items-center gap-1 text-xs brand-gradient-text font-bold">もっと見る<span className="more-icon" /></a>
                </div>
              </>
            )}
          </div>
        );

        if (key === "random") return (
          <div key="random" className="glass-card rounded-2xl pt-2 pb-4 px-5 mt-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-1 flex items-center justify-center gap-1.5">
              <span className="sparkle" />今日、{creator.displayName}に刻んだ人<span className="sparkle" />
            </h2>
            {!creator.showRandomCard ? (
              <div className="flex justify-center py-2">
                <span style={{ display: "inline-block", width: 32, height: 32, maskImage: "url(/hidden-icon.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", WebkitMaskImage: "url(/hidden-icon.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", background: "#94a3b8" }} />
              </div>
            ) : randomKizaris.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-2">まだ誰も刻っていません</p>
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
                          {iconUrl
                            ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                            : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
                        </div>
                        <FanNameMarquee name={name} className={`text-xs ${isMe ? "brand-gradient-text font-bold" : "text-slate-600"}`} />
                      </div>
                    );
                  })}
                </div>
                <div className="text-center mt-5">
                  <a href={`/${slug}/kizaris`} className="inline-flex items-center gap-1 text-xs brand-gradient-text font-bold">もっと見る<span className="more-icon" /></a>
                </div>
              </>
            )}
          </div>
        );

        if (key === "most") return (
          <div key="most" className="glass-card rounded-2xl pt-2 pb-4 px-5 mt-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />{creator.displayName}を最多で刻んだ人<span className="sparkle" />
            </h2>
            {!creator.showMostCard ? (
              <div className="flex justify-center py-2">
                <span style={{ display: "inline-block", width: 32, height: 32, maskImage: "url(/hidden-icon.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", WebkitMaskImage: "url(/hidden-icon.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", background: "#94a3b8" }} />
              </div>
            ) : mostFans.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-2">まだ誰も刻っていません</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mostFans.map((f) => {
                  const name = f.fan.displayName ?? f.fan.name ?? "名無し";
                  const iconUrl = f.fan.creatorProfile?.iconUrl;
                  const isMe = f.fanId === session?.user.id;
                  return (
                    <div key={f.id} className="flex items-center gap-2">
                      <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                        {iconUrl
                          ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                          : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
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
          </div>
        );

        if (key === "streak") return (
          <div key="streak" className="glass-card rounded-2xl pt-2 pb-4 px-5 mt-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />{creator.displayName}を継続で刻んだ人<span className="sparkle" />
            </h2>
            {!creator.showStreakCard ? (
              <div className="flex justify-center py-2">
                <span style={{ display: "inline-block", width: 32, height: 32, maskImage: "url(/hidden-icon.png)", maskSize: "contain", maskRepeat: "no-repeat", maskPosition: "center", WebkitMaskImage: "url(/hidden-icon.png)", WebkitMaskSize: "contain", WebkitMaskRepeat: "no-repeat", WebkitMaskPosition: "center", background: "#94a3b8" }} />
              </div>
            ) : streakFans.length === 0 ? (
              <p className="text-center text-slate-400 text-xs py-2">まだ誰も刻っていません</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {streakFans.map((f) => {
                  const name = f.fan.displayName ?? f.fan.name ?? "名無し";
                  const iconUrl = f.fan.creatorProfile?.iconUrl;
                  const isMe = f.fanId === session?.user.id;
                  return (
                    <div key={f.id} className="flex items-center gap-2">
                      <div className="rounded-full overflow-hidden bg-pink-50 flex-shrink-0 flex items-center justify-center" style={{ width: 28, height: 28 }}>
                        {iconUrl
                          ? <Image src={iconUrl} alt={name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} unoptimized />
                          : <span className="text-xs font-bold text-[#F58BCB]">{name[0]}</span>}
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
          </div>
        );

        return null;
      })}

    </div>
  );
}
