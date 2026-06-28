import Link from "next/link";

const FAN_STEPS = [
  { step: "01", title: "推しのページを開く", desc: "推しが共有したURLからページにアクセスする。" },
  { step: "02", title: "刻むボタンを押す", desc: "ページ下部の「刻る」ボタンを1日1回押せる。" },
  { step: "03", title: "名前が刻まれる", desc: "あなたの表示名が推しのプロフィールページに残る。" },
  { step: "04", title: "毎日続けてストリークを伸ばす", desc: "連続で刻むと日数が記録される。最速・最多・最長でランキングに載れる。" },
];

const CREATOR_STEPS = [
  { step: "01", title: "アカウントを作る", desc: "Googleアカウントでログインして、自分のIDとプロフィールを設定する。" },
  { step: "02", title: "ページURLをシェアする", desc: "kizalo.jp/あなたのID のURLをSNSやプロフに貼る。" },
  { step: "03", title: "ファンが刻んでくれる", desc: "ファンがページを訪れて「刻る」を押すたびに、名前と記録が積み上がる。" },
  { step: "04", title: "応援を数字で確認する", desc: "誰が何日連続で来てくれているか、累計刻み数がひと目でわかる。" },
];

export default function GuidePage() {
  return (
    <div className="max-w-lg mx-auto px-5 py-8 flex flex-col gap-12">

      {/* Header */}
      <section className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-slate-800">使い方ガイド</h1>
        <p className="text-sm text-slate-500">KIZALOはファンと推しをつなぐ、毎日刻むサービスです。</p>
      </section>

      {/* Fan guide */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="sparkle" style={{ width: 12, height: 12 }} />
          <h2 className="text-sm font-bold text-slate-700">ファンとして使う</h2>
        </div>
        <div className="flex flex-col gap-3">
          {FAN_STEPS.map(({ step, title, desc }) => (
            <div key={step} className="glass-card rounded-2xl px-5 py-4 flex gap-4">
              <span className="text-xs font-bold mt-0.5 flex-shrink-0 brand-gradient-text">{step}</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Creator guide */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="sparkle" style={{ width: 12, height: 12 }} />
          <h2 className="text-sm font-bold text-slate-700">推しとして使う</h2>
        </div>
        <div className="flex flex-col gap-3">
          {CREATOR_STEPS.map(({ step, title, desc }) => (
            <div key={step} className="glass-card rounded-2xl px-5 py-4 flex gap-4">
              <span className="text-xs font-bold mt-0.5 flex-shrink-0 brand-gradient-text">{step}</span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-3 pb-4">
        <p className="text-sm text-slate-500">さっそく始めてみよう。</p>
        <Link href="/login" className="glass-btn-primary px-10 py-3.5 rounded-2xl font-semibold text-sm text-white">
          Googleで無料ではじめる
        </Link>
      </section>

    </div>
  );
}
