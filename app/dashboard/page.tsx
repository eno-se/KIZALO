import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import CreatorSetupForm from "./CreatorSetupForm";
import ProfileEditForm from "./ProfileEditForm";
import SocialLinksEditor from "./SocialLinksEditor";
import BlockedFansList from "./BlockedFansList";
import { signOut } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      creatorProfile: {
        include: {
          socialLinks: { orderBy: { order: "asc" } },
          blockedFans: { include: { fan: true } },
          fans: { orderBy: { totalKizari: "desc" }, take: 10, include: { fan: true } },
        },
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  const profile = user.creatorProfile;
  const totalKizari = profile
    ? await db.kizari.count({ where: { creatorId: profile.id } })
    : 0;

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1>
        <div className="flex gap-2">
          <a href="/me" className="text-xs glass-btn-secondary px-3 py-1.5 rounded-lg">
            ファン画面
          </a>
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button className="text-xs glass-btn-secondary px-3 py-1.5 rounded-lg cursor-pointer">
              ログアウト
            </button>
          </form>
        </div>
      </div>

      {!profile ? (
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-slate-700 mb-1">推しページを作成する</h2>
          <p className="text-sm text-slate-400 mb-4">自分のプロフィールIDと名前を設定してください</p>
          <CreatorSetupForm defaultName={user.displayName ?? ""} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* 統計 */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex gap-6 text-center">
              <div>
                <div className="text-xl font-bold text-violet-600">{totalKizari}</div>
                <div className="text-xs text-slate-400">総キザり数</div>
              </div>
              <div>
                <div className="text-xl font-bold text-violet-600">{profile.fans.length}</div>
                <div className="text-xs text-slate-400">ファン数</div>
              </div>
            </div>
            <a
              href={`/${profile.slug}`}
              className="mt-4 block text-center text-xs text-violet-500 underline"
            >
              kizalo.jp/{profile.slug} を開く
            </a>
          </div>

          {/* プロフィール編集 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">プロフィール</h2>
            <ProfileEditForm
              displayName={profile.displayName}
              bio={profile.bio ?? ""}
            />
          </div>

          {/* SNSリンク */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">SNSリンク</h2>
            <SocialLinksEditor socialLinks={profile.socialLinks} />
          </div>

          {/* キザってくれたファン */}
          {profile.fans.length > 0 && (
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-semibold text-slate-700 mb-3">キザってくれたファン</h2>
              <div className="space-y-2">
                {profile.fans.map((f) => (
                  <div key={f.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-700">{f.fan.displayName ?? f.fan.name}</span>
                    <span className="text-slate-400 text-xs">累計 {f.totalKizari}回 / {f.streakDays}日連続</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ブロック管理 */}
          <div className="glass-card rounded-2xl p-5">
            <h2 className="font-semibold text-slate-700 mb-3">非表示・ブロック管理</h2>
            <BlockedFansList blockedFans={profile.blockedFans} />
          </div>
        </div>
      )}
    </div>
  );
}
