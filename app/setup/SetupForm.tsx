"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setupUser } from "@/app/actions/user";

export default function SetupForm({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await setupUser(name.trim());
      router.push("/");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">表示名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例：Taiga"
          maxLength={30}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/80 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          required
        />
        <p className="text-xs text-slate-400 mt-1">推しのページに刻まれる名前です</p>
      </div>
      <button
        type="submit"
        disabled={isPending || !name.trim()}
        className="glass-btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {isPending ? "設定中..." : "はじめる"}
      </button>
    </form>
  );
}
