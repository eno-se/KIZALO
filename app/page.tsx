import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="glass-card rounded-3xl p-10 max-w-sm w-full">
        <h1 className="text-4xl font-bold text-violet-700 tracking-tight mb-2">KIZALO</h1>
        <p className="text-slate-500 text-sm mb-8">推しのプロフィールに、名前を刻む。</p>
        {session ? (
          <div className="space-y-3">
            <a href="/me" className="glass-btn-primary block py-3 rounded-xl font-semibold text-sm">
              キザりカードを見る
            </a>
            <a href="/dashboard" className="glass-btn-secondary block py-3 rounded-xl font-semibold text-sm">
              ダッシュボード
            </a>
          </div>
        ) : (
          <a href="/login" className="glass-btn-primary block py-3 rounded-xl font-semibold text-sm">
            はじめる
          </a>
        )}
      </div>
    </div>
  );
}
