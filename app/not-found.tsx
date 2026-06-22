import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Image src="/logo.png" alt="KIZALO" width={120} height={36} className="object-contain" />
      </Link>

      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center">
        <p className="text-6xl font-bold brand-gradient-text mb-4">404</p>
        <p className="text-sm font-semibold text-slate-700 mb-1">ページが見つかりません</p>
        <p className="text-xs text-slate-400 mb-6">URLが間違っているか、削除された可能性があります</p>
        <Link href="/" className="glass-btn-primary inline-block px-6 py-2.5 rounded-xl text-sm font-semibold">
          トップへ戻る
        </Link>
      </div>
    </div>
  );
}
