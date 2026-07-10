import Image from "next/image";
import { notFound } from "next/navigation";
import BioText from "@/app/components/BioText";
import FanNameMarquee from "@/app/components/FanNameMarquee";
import DemoShareButton from "./DemoShareButton";
import DemoKizaruButton from "./DemoKizaruButton";
import DemoMediaBlock from "./DemoMediaBlock";
import DemoMoreButton from "./DemoMoreButton";
import DemoBioLinkButton from "./DemoBioLinkButton";
import DemoSnsIcons from "./DemoSnsIcons";

type DemoFan = {
  name: string;
  totalKizari: number;
  streakDays: number;
  iconPath?: string;
};

type DemoContentBlock =
  | { id: string; type: "text"; title: string; caption: string }
  | { id: string; type: "media"; mediaType: "youtube" | "spotify" | "applemusic" | "timetree"; imageUrl: string; title: string };

type DemoProfile = {
  slug: string;
  displayName: string;
  tagline: string;
  shortBio: string;
  bio: string;
  bioLinkLabel: string;
  iconPath: string | null;
  kizaruButtonText: string;
  guideText: string;
  socialLinks: { platform: string; label: string }[];
  fans: DemoFan[];
  contentBlocks: DemoContentBlock[];
};

const DEMO_RANDOM_FANS: DemoFan[] = [
  { name: "高橋みおな", totalKizari: 12, streakDays: 4, iconPath: "/demo/fans/fan7.jpg" },
  { name: "伊藤ゆいか", totalKizari: 9, streakDays: 2, iconPath: "/demo/fans/fan8.jpg" },
  { name: "渡辺そらら", totalKizari: 7, streakDays: 1, iconPath: "/demo/fans/fan9.jpg" },
  { name: "松本りくと", totalKizari: 5, streakDays: 3, iconPath: "/demo/fans/fan10.jpg" },
  { name: "加藤ひびき", totalKizari: 3, streakDays: 0, iconPath: "/demo/fans/fan11.jpg" },
  { name: "木村なつめ", totalKizari: 2, streakDays: 1 },
];

const DEMO_FANS: DemoFan[] = [
  { name: "田中ファン太郎", totalKizari: 47, streakDays: 23, iconPath: "/demo/fans/fan1.jpg" },
  { name: "佐藤おうえん子", totalKizari: 31, streakDays: 8, iconPath: "/demo/fans/fan2.jpg" },
  { name: "鈴木きざり丸", totalKizari: 28, streakDays: 5, iconPath: "/demo/fans/fan3.jpg" },
  { name: "山田はぴな", totalKizari: 22, streakDays: 3, iconPath: "/demo/fans/fan4.jpg" },
  { name: "中村すたー", totalKizari: 19, streakDays: 1, iconPath: "/demo/fans/fan5.jpg" },
  { name: "小林ながみん", totalKizari: 15, streakDays: 0, iconPath: "/demo/fans/fan6.jpg" },
];

const DEMO_PROFILES: Record<string, DemoProfile> = {
  koharu_hoshino: {
    slug: "koharu_hoshino",
    displayName: "星乃 こはる",
    tagline: "セルフプロデュースアイドル / 黄色担当",
    shortBio: "",
    bio: "衣装も、告知も、ライブの準備も、できることは全部自分！\n毎日こはるのプロフィールに名前を刻んでくれたら嬉しいです。\nあなたの応援、ちゃんと見えています🌼",
    bioLinkLabel: "次のライブ予定を見る",
    iconPath: "/demo/koharu_hoshino/icon.jpg",
    kizaruButtonText: "名前を刻る",
    guideText: "こはるを見つけてくれた記録を、ここに残せます。\n最速で来てくれた人、毎日続けてくれた人はプロフィールに表示されます。",
    socialLinks: [
      { platform: "x", label: "X" },
      { platform: "instagram", label: "Instagram" },
      { platform: "tiktok", label: "TikTok" },
      { platform: "youtube", label: "YouTube" },
    ],
    fans: DEMO_FANS,
    contentBlocks: [
      { id: "youtube", type: "media", mediaType: "youtube", imageUrl: "/demo/koharu_hoshino/youtube.jpg", title: "最新PV確認してね！" },
      { id: "spotify", type: "media", mediaType: "spotify", imageUrl: "/demo/koharu_hoshino/spotify.jpg", title: "" },
      { id: "applemusic", type: "media", mediaType: "applemusic", imageUrl: "/demo/koharu_hoshino/applemusic.jpg", title: "" },
      { id: "timetree", type: "media", mediaType: "timetree", imageUrl: "/demo/koharu_hoshino/timetree.jpg", title: "" },
      {
        id: "career",
        type: "text",
        title: "アイドル経歴",
        caption: `2019年\n早稲田大学 商学部 入学\n\n2020年\nTikTokで弾き語り動画の投稿を開始\n\n2021年\n高田馬場CLUB PHASEで初ライブ出演\n\n2021年\nソロアイドル「星乃こはる」として活動開始\n\n2022年\n渋谷DESEO、新宿MARZ、下北沢シャングリラに出演\n\n2022年\n初のオリジナル曲「放課後シンデレラ」をライブで披露\n\n2023年\n早稲田大学 商学部 卒業\n\n2023年\nサイバーエージェントに入社\nSNSマーケティング・広告運用を担当\n\n2024年\n仕事と並行しながらアイドル活動を継続\n\n2024年\nセルフプロデュース体制に切り替え\n衣装、告知画像、物販、SNS運用を自分で担当\n\n2025年\n渋谷Spotify O-nestで初主催ライブ\n「星乃こはる 1st Solo Live - 一番星を見つけて -」開催\n\n2026年\nセルフプロデュースアイドルとして活動を本格化\n\n現在\n渋谷DESEO、新宿MARZ、下北沢シャングリラを中心に出演中\n応援してくれる人の名前を、ちゃんと覚えるアイドルを目指しています🌼`,
      },
    ],
  },
};

const DEMO_ME = DEMO_FANS[0]; // 田中ファン太郎
const DEMO_ME_TOTAL = 47;
const DEMO_ME_STREAK = 23;
const DEMO_ME_MAX_STREAK = 23;

export default async function DemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = DEMO_PROFILES[slug];
  if (!profile) notFound();

  const renderBlock = (block: DemoContentBlock) => {
    if (block.type === "media") {
      return (
        <div key={block.id} className="w-full max-w-lg mx-auto mt-4 mb-2">
          <DemoMediaBlock mediaType={block.mediaType} imageUrl={block.imageUrl} title={block.title} />
        </div>
      );
    }
    return (
      <div key={block.id} className="w-full max-w-lg mx-auto mt-4 mb-2">
        <div className="glass-card rounded-2xl px-5 py-4">
          {block.title && (
            <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />{block.title}<span className="sparkle" />
            </h2>
          )}
          <p className="relative z-[1] text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{block.caption}</p>
        </div>
      </div>
    );
  };

  const fastestFans = [...profile.fans].reverse();
  const randomFans = [...DEMO_RANDOM_FANS].sort(() => 0.5 - Math.random());
  const mostFans = [...profile.fans].sort((a, b) => b.totalKizari - a.totalKizari);
  const streakFans = [...profile.fans].filter((f) => f.streakDays > 0).sort((a, b) => b.streakDays - a.streakDays);

  return (
    <div className="min-h-screen px-4 pt-4 pb-28 max-w-lg mx-auto">
      <DemoShareButton />

      {/* プロフィールヘッダー */}
      <div className="px-2 mb-4">
        <div className="flex flex-col items-center text-center mb-5">
          {/* SNSアイコン */}
          <DemoSnsIcons links={profile.socialLinks} />

          {/* アバター */}
          <div
            className="rounded-full p-[3px] mb-3"
            style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
          >
            <div className="rounded-full bg-white p-[3px]" style={{ width: 106, height: 106 }}>
              <div className="rounded-full overflow-hidden" style={{ width: 100, height: 100 }}>
                {profile.iconPath ? (
                  <Image src={profile.iconPath} alt={profile.displayName} width={100} height={100} className="object-cover" style={{ width: 100, height: 100 }} />
                ) : (
                  <div
                    className="flex items-center justify-center text-3xl font-bold text-white"
                    style={{
                      width: 100,
                      height: 100,
                      background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                    }}
                  >
                    {profile.displayName[0]}
                  </div>
                )}
              </div>
            </div>
          </div>

          <h1 className="text-lg font-bold text-slate-800 mb-1">{profile.displayName}</h1>
          <p className="text-sm text-slate-400 mb-1">@{profile.slug}</p>
          <p className="text-slate-500 mb-2" style={{ fontSize: "0.65rem" }}>{profile.tagline}</p>
          <BioText text={profile.bio} />

          {/* メインリンクボタン */}
          <DemoBioLinkButton label={profile.bioLinkLabel} />
        </div>
      </div>

      {/* 刻みカード（田中ファン太郎） */}
      <div className="relative mt-4 mb-2">
        <div
          className="relative rounded-2xl pt-3 pb-4 px-4 overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(245,139,203,0.75) 0%, rgba(185,138,245,0.80) 50%, rgba(125,183,255,0.72) 100%)",
            border: "1px solid rgba(255,255,255,0.40)",
            boxShadow: "0 4px 24px rgba(185,138,245,0.35)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <Image src="/logo.png" alt="KIZALO" width={56} height={17} className="absolute top-3 left-4 object-contain" style={{ filter: "brightness(0) invert(1)" }} />

          {/* 未刻みリボン */}
          <div
            className="absolute font-bold text-white text-center"
            style={{
              width: 110,
              padding: "6px 0",
              fontSize: "0.55rem",
              letterSpacing: "0.04em",
              background: "rgba(255,255,255,0.35)",
              top: 18,
              right: -26,
              transform: "rotate(45deg)",
              boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
              pointerEvents: "none",
            }}
          >
            未刻み
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
                <div className="rounded-full overflow-hidden" style={{ width: 52, height: 52 }}>
                  {DEMO_ME.iconPath ? (
                    <Image src={DEMO_ME.iconPath} alt={DEMO_ME.name} width={52} height={52} className="object-cover" style={{ width: 52, height: 52 }} />
                  ) : (
                    <div className="flex items-center justify-center text-lg font-bold text-white w-full h-full" style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}>
                      {DEMO_ME.name[0]}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <p className="text-sm font-bold text-white leading-tight">{DEMO_ME.name}</p>
              <p className="text-xs text-white/60">@tantaro</p>
            </div>
          </div>

          {/* 統計 */}
          <div className="flex items-center text-center w-full">
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{DEMO_ME_TOTAL}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">総合</div>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{DEMO_ME_STREAK}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">連続</div>
            </div>
            <div className="w-px self-stretch" style={{ background: "rgba(255,255,255,0.25)" }} />
            <div className="flex-1 py-1">
              <div className="text-2xl font-bold text-white mb-1">{DEMO_ME_MAX_STREAK}</div>
              <div className="text-white/60 text-sm whitespace-nowrap">最高連続</div>
            </div>
          </div>

          <p className="text-center font-bold text-white mt-2" style={{ fontSize: "0.65rem" }}>
            🔥 記録更新中！！
          </p>
        </div>
      </div>

      {/* YouTube（1枚目のみ） */}
      {renderBlock(profile.contentBlocks[0])}

      {/* ランキングカード */}
      <div className="w-full max-w-lg mx-auto mt-4 mb-2">
        <div className="glass-card rounded-2xl px-5 divide-y divide-slate-100">
          {/* 最速 */}
          <div className="py-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />最速<span className="sparkle" />
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {fastestFans.map((f) => (
                <div key={f.name} className="flex items-center gap-2">
                  <div
                    className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: 28, height: 28, flexShrink: 0, background: f.iconPath ? undefined : "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
                  >
                    {f.iconPath ? <Image src={f.iconPath} alt={f.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} /> : f.name[0]}
                  </div>
                  <FanNameMarquee name={f.name} className="text-xs text-slate-600" />
                </div>
              ))}
            </div>
            <DemoMoreButton />
          </div>

          {/* ランダム */}
          <div className="py-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-1 flex items-center justify-center gap-1.5">
              <span className="sparkle" />ランダム<span className="sparkle" />
            </h2>
            <p className="text-center text-slate-400 mb-3" style={{ fontSize: "0.6rem" }}>ランダムで{randomFans.length}名表示中！</p>
            <div className="grid grid-cols-3 gap-2">
              {randomFans.map((f, i) => (
                <div key={`random-${i}`} className="flex items-center gap-2">
                  <div
                    className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: 28, height: 28, flexShrink: 0, background: f.iconPath ? undefined : "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
                  >
                    {f.iconPath ? <Image src={f.iconPath} alt={f.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} /> : f.name[0]}
                  </div>
                  <FanNameMarquee name={f.name} className="text-xs text-slate-600" />
                </div>
              ))}
            </div>
            <DemoMoreButton />
          </div>

          {/* 歴代最多 */}
          <div className="py-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />歴代最多<span className="sparkle" />
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {mostFans.map((f) => (
                <div key={`most-${f.name}`} className="flex items-center gap-2">
                  <div
                    className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: 28, height: 28, flexShrink: 0, background: f.iconPath ? undefined : "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
                  >
                    {f.iconPath ? <Image src={f.iconPath} alt={f.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} /> : f.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <FanNameMarquee name={f.name} className="text-xs text-slate-600" />
                    <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>{f.totalKizari}回</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 歴代継続 */}
          <div className="py-4">
            <h2 className="text-xs font-bold brand-gradient-text text-center mb-3 flex items-center justify-center gap-1.5">
              <span className="sparkle" />歴代継続<span className="sparkle" />
            </h2>
            <div className="grid grid-cols-3 gap-2">
              {streakFans.map((f) => (
                <div key={`streak-${f.name}`} className="flex items-center gap-2">
                  <div
                    className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ width: 28, height: 28, flexShrink: 0, background: f.iconPath ? undefined : "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
                  >
                    {f.iconPath ? <Image src={f.iconPath} alt={f.name} width={28} height={28} className="object-cover" style={{ width: 28, height: 28 }} /> : f.name[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <FanNameMarquee name={f.name} className="text-xs text-slate-600" />
                    <p className="text-slate-400" style={{ fontSize: "0.6rem" }}>🔥 {f.streakDays}日連続</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 残りのコンテンツブロック（Spotify / Apple Music / 経歴） */}
      {profile.contentBlocks.slice(1).map(renderBlock)}

      {/* 誘導文 */}
      <p className="text-xs text-slate-400 text-center whitespace-pre-wrap mt-4 mb-2 px-4 leading-relaxed">
        {profile.guideText}
      </p>

      <DemoKizaruButton buttonText={profile.kizaruButtonText} creatorName={profile.displayName} />
    </div>
  );
}
