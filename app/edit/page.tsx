import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import EditProfileIdentity from "./EditProfileIdentity";
import EditProfileBio from "./EditProfileBio";
import EditSlug from "./EditSlug";
import EditSocialLinks from "./EditSocialLinks";
import ButtonVisibilityForm from "./ButtonVisibilityForm";
import CollapsibleCard from "./CollapsibleCard";
import ContentBlockManager from "./ContentBlockManager";

export default async function EditPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: {
        include: {
          socialLinks: { orderBy: { order: "asc" } },
          contentBlocks: { orderBy: { order: "asc" } },
        },
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  const profile = user.creatorProfile;
  if (!profile) redirect("/setup");

  const snsSummary = profile.socialLinks.length > 0
    ? `${profile.socialLinks.length}件登録済み`
    : "未設定";

  return (
    <div className="min-h-screen px-4 py-8 pb-32 max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        <a
          href={`/${profile.slug}`}
          className="w-8 h-8 flex items-center justify-center rounded-full glass-btn-secondary flex-shrink-0"
          title="公開ページを見る"
        >
          <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
        </a>
        <h1 className="text-xl font-bold text-slate-800">プロフィール編集</h1>
      </div>

      <div className="space-y-3">
        {/* 基本設定セクション区切り */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }} />
          <span className="text-xs font-bold brand-gradient-text tracking-widest">基本設定</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }} />
        </div>

        <CollapsibleCard title="SNSリンク" summary={snsSummary}>
          <EditSocialLinks socialLinks={profile.socialLinks} />
        </CollapsibleCard>

        <CollapsibleCard title="アイコン・表示名" summary={profile.displayName}>
          <EditProfileIdentity
            displayName={profile.displayName}
            iconUrl={profile.iconUrl ?? null}
          />
        </CollapsibleCard>

        <CollapsibleCard title="ID" summary={`@${profile.slug}`}>
          <EditSlug slug={profile.slug} slugChangedAt={profile.slugChangedAt} />
        </CollapsibleCard>

        <CollapsibleCard
          title="自己紹介"
          summary={profile.bio ? profile.bio.slice(0, 40) + (profile.bio.length > 40 ? "…" : "") : "未設定"}
        >
          <EditProfileBio
            bio={profile.bio ?? ""}
            bioLink={profile.bioLink ?? ""}
            bioLinkLabel={profile.bioLinkLabel ?? ""}
          />
        </CollapsibleCard>

        <CollapsibleCard
          title="ボタン表示設定"
          summary={profile.showKizaruButton ? "刻むボタン：表示中" : "刻むボタン：非表示"}
        >
          <ButtonVisibilityForm showKizaruButton={profile.showKizaruButton} />
        </CollapsibleCard>

        {/* コンテンツセクション区切り */}
        <div className="flex items-center gap-3 pt-2">
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }} />
          <span className="text-xs font-bold brand-gradient-text tracking-widest">コンテンツ</span>
          <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }} />
        </div>

        <ContentBlockManager
          initialBlocks={profile.contentBlocks.map((b) => ({
            id: b.id,
            type: b.type,
            title: b.title,
            caption: b.caption,
            url: b.url,
            imageUrl: b.imageUrl,
            link: b.link,
          }))}
          rankingSettings={{
            showFastestCard: profile.showFastestCard,
            showRandomCard: profile.showRandomCard,
            showMostCard: profile.showMostCard,
            showStreakCard: profile.showStreakCard,
            cardOrder: profile.cardOrder,
          }}
        />

      </div>

      {/* 固定プレビューボタン */}
      <div className="fixed bottom-16 left-0 right-0 z-30 flex justify-center pb-[env(safe-area-inset-bottom)]">
        <a
          href={`/${profile.slug}`}
          className="glass-btn-primary px-10 py-3.5 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-lg"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          公開ページを確認する
        </a>
      </div>
    </div>
  );
}
