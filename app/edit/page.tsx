import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CreatorSetupForm from "@/app/dashboard/CreatorSetupForm";
import EditProfileForm from "./EditProfileForm";
import EditSocialLinks from "./EditSocialLinks";
import CardVisibilityForm from "./CardVisibilityForm";
import ButtonVisibilityForm from "./ButtonVisibilityForm";

export default async function EditPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: {
        include: { socialLinks: { orderBy: { order: "asc" } } },
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  const profile = user.creatorProfile;

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      {/* ヘッダー */}
      <div className="flex items-center gap-3 mb-6">
        {profile && (
          <a
            href={`/${profile.slug}`}
            className="w-8 h-8 flex items-center justify-center rounded-full glass-btn-secondary flex-shrink-0"
            title="公開ページを見る"
          >
            <span className="more-icon" style={{ transform: "scaleX(-1)" }} />
          </a>
        )}
        <h1 className="text-xl font-bold text-slate-800">プロフィール編集</h1>
      </div>

      {!profile ? (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-slate-700 mb-1">推しページを作成する</h2>
          <p className="text-sm text-slate-400 mb-4">プロフィールIDと名前を設定してください</p>
          <CreatorSetupForm defaultName={user.displayName ?? ""} />
        </div>
      ) : (
        <div className="space-y-5">
          {/* 基本情報 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-bold text-slate-400 mb-4">基本情報</h2>
            <EditProfileForm
              displayName={profile.displayName}
              bio={profile.bio ?? ""}
              bioLink={profile.bioLink ?? ""}
              bioLinkLabel={profile.bioLinkLabel ?? ""}
              iconUrl={profile.iconUrl ?? null}
              slug={profile.slug}
              slugChangedAt={profile.slugChangedAt}
            />
          </div>

          {/* SNSリンク */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-bold text-slate-400 mb-4">SNSリンク</h2>
            <EditSocialLinks socialLinks={profile.socialLinks} />
          </div>

          {/* ボタン表示設定 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-bold text-slate-400 mb-4">ボタン表示設定</h2>
            <ButtonVisibilityForm showKizaruButton={profile.showKizaruButton} />
          </div>

          {/* カード表示設定 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="text-xs font-bold text-slate-400 mb-4">カード表示設定</h2>
            <CardVisibilityForm
              showFastestCard={profile.showFastestCard}
              showRandomCard={profile.showRandomCard}
              showMostCard={profile.showMostCard}
              showStreakCard={profile.showStreakCard}
              cardOrder={profile.cardOrder}
            />
          </div>

          {/* プレビュー */}
          <a
            href={`/${profile.slug}`}
            className="glass-btn-secondary flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            公開ページを確認する
          </a>
        </div>
      )}
    </div>
  );
}
