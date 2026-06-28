import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  const session = await auth();

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { creatorProfile: true },
    });
    if (user?.creatorProfile) redirect(`/${user.creatorProfile.slug}`);
    redirect("/edit");
  }

  return (
    <div className="max-w-lg mx-auto px-5 py-10 flex flex-col gap-14">

      {/* Hero */}
      <section className="flex flex-col items-center text-center gap-6 pt-4">
        <Image src="/logo.png" alt="KIZALO" width={180} height={60} className="object-contain" priority />
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold leading-snug" style={{ color: "#2a2a3a" }}>
            推しのプロフィールに、<br />
            <span className="brand-gradient-text">名前を刻む。</span>
          </h1>
          <p className="text-sm text-slate-500 leading-relaxed">
            毎日1回のボタンで、あなたの応援が形になる。
          </p>
        </div>
        <Link href="/login" className="glass-btn-primary px-10 py-3.5 rounded-2xl font-semibold text-sm text-white">
          はじめる →
        </Link>
      </section>

      {/* How it works */}
      <section className="glass-card rounded-3xl px-6 py-6 flex flex-col gap-3">
        <p className="text-xs font-semibold text-slate-400 tracking-widest uppercase">How it works</p>
        <p className="text-base font-semibold text-slate-700 leading-relaxed">
          推しのページを開いて、<br />刻むボタンを押すだけ。
        </p>
        <p className="text-sm text-slate-500 leading-relaxed">
          毎日続けると連続記録が伸びて、あなたの名前が推しのページに刻まれていく。
        </p>
      </section>

      {/* For fans */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="sparkle" style={{ width: 12, height: 12 }} />
          <h2 className="text-sm font-bold text-slate-700">ファンとして使う</h2>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: "📌", text: "推しのページに自分の名前が残る" },
            { icon: "🔥", text: "毎日刻むとストリークが伸びていく" },
            { icon: "🏆", text: "最速・最多・最長でランキングに載れる" },
          ].map(({ icon, text }) => (
            <div key={text} className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <p className="text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* For creators */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="sparkle" style={{ width: 12, height: 12 }} />
          <h2 className="text-sm font-bold text-slate-700">推しとして使う</h2>
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: "👥", text: "応援してくれたファンの名前が見える" },
            { icon: "📅", text: "誰が何日連続で来てくれているかわかる" },
            { icon: "🔗", text: "SNSリンクをひとつのページにまとめられる" },
          ].map(({ icon, text }) => (
            <div key={text} className="glass-card rounded-2xl px-4 py-3.5 flex items-center gap-3">
              <span className="text-xl flex-shrink-0">{icon}</span>
              <p className="text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="flex flex-col items-center text-center gap-4 pb-4">
        <p className="text-sm text-slate-500">今日から、推しとのつながりを刻もう。</p>
        <Link href="/login" className="glass-btn-primary px-10 py-3.5 rounded-2xl font-semibold text-sm text-white">
          Googleで無料ではじめる
        </Link>
      </section>

    </div>
  );
}
