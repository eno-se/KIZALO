"use client";

import { useState, useTransition } from "react";
import { createCreatorProfile } from "@/app/actions/creator";
import { useRouter } from "next/navigation";

export default function CreatorSetupForm({ defaultName }: { defaultName: string }) {
  const [slug, setSlug] = useState("");
  const [name, setName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createCreatorProfile(slug, name);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">プロフィールID</label>
        <div className="flex items-center gap-1">
          <span className="text-sm text-slate-400">kizalo.jp/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="your-id"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
            required
          />
        </div>
        <p className="text-xs text-slate-400 mt-1">英数字・ハイフン・アンダースコア（3〜30文字）</p>
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">表示名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="あなたの名前"
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          required
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="glass-btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 cursor-pointer"
      >
        {isPending ? "作成中..." : "ページを作成する"}
      </button>
    </form>
  );
}
