import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <p className="text-2xl">🚫</p>
        <h1 className="text-lg font-bold text-slate-700">アカウント停止中です</h1>
        <p className="text-sm text-slate-500">
          このアカウントは現在ご利用いただけません。
          お心当たりがある場合はお問い合わせください。
        </p>
        <Link href="/settings" className="glass-btn-secondary block w-full py-2.5 rounded-xl text-sm font-semibold text-center">
          設定・お問い合わせ
        </Link>
      </div>
    </div>
  );
}
