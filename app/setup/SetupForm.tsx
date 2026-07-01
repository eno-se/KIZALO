"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setupUser } from "@/app/actions/user";

export default function SetupForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const honeypotRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("表示名を入力してください"); return; }
    if (!slug.trim()) { setError("プロフィールIDを入力してください"); return; }
    if (!agreed) { setError("利用規約とプライバシーポリシーへの同意が必要です"); return; }
    setError(null);
    startTransition(async () => {
      const honeypot = honeypotRef.current?.value ?? "";
      const result = await setupUser(name.trim(), slug.trim(), honeypot);
      if (result?.error) {
        setError(result.error);
      } else if (result?.slug) {
        router.push(`/${result.slug}`);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot: ボット対策。人間には見えない */}
      <input
        ref={honeypotRef}
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
      />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">表示名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：Taiga"
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">プロフィールID</label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 flex-shrink-0">kizalo.jp/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="your-id"
            className="flex-1 px-3 py-3 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            required
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">英数字・ハイフン・アンダースコア（3〜30文字）</p>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-pink-400 flex-shrink-0"
        />
        <span className="text-xs text-slate-500 leading-relaxed">
          <a href="/terms" target="_blank" className="text-pink-400 underline underline-offset-2">利用規約</a>
          {" "}および{" "}
          <a href="/privacy" target="_blank" className="text-pink-400 underline underline-offset-2">プライバシーポリシー</a>
          に同意する
        </span>
      </label>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="glass-btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? "作成中..." : "プロフィールを作成する"}
      </button>
    </form>
  );
}
