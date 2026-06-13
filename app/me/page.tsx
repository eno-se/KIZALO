import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export default async function MePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      follows: {
        include: { creator: true },
        orderBy: { totalKizari: "desc" },
      },
    },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  const totalKizari = user.follows.reduce((s, f) => s + f.totalKizari, 0);

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto">
      <div className="glass-card rounded-2xl p-6 mb-4">
        <div className="flex items-center gap-3 mb-4">
          {session.user.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-12 h-12 rounded-full" />
          )}
          <div>
            <p className="font-bold text-slate-800">{user.displayName}</p>
            <p className="text-xs text-slate-400">ファンアカウント</p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <div className="text-lg font-bold text-violet-600">{user.follows.length}</div>
            <div className="text-xs text-slate-400">推し登録数</div>
          </div>
          <div>
            <div className="text-lg font-bold text-violet-600">{totalKizari}</div>
            <div className="text-xs text-slate-400">総キザり数</div>
          </div>
        </div>
      </div>

      {user.follows.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-400">
          まだ推しをキザっていません
        </div>
      ) : (
        <div className="space-y-3">
          {user.follows.map((follow) => (
            <a key={follow.id} href={`/${follow.creator.slug}`} className="block glass-card rounded-2xl p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{follow.creator.displayName}</p>
                  <p className="text-xs text-slate-400">@{follow.creator.slug}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-600">{follow.streakDays}日連続</p>
                  <p className="text-xs text-slate-400">累計 {follow.totalKizari}回</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="mt-6 text-center space-y-2">
        <a href="/" className="block text-xs text-slate-400 underline">
          トップへ戻る
        </a>
      </div>
    </div>
  );
}
