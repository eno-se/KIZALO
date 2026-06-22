"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type User = { id: string; displayName: string | null; name: string | null; email: string | null };

export default function DevLogin({ users }: { users: User[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const login = async (userId: string) => {
    setLoadingId(userId);
    await fetch("/api/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    router.push("/");
    router.refresh();
  };

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-xs text-slate-400">DEV — テストユーザー</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {users.map((u) => (
          <button
            key={u.id}
            onClick={() => login(u.id)}
            disabled={loadingId !== null}
            className="w-full text-left px-3 py-2 rounded-xl border border-slate-200 bg-white/60 hover:bg-white/90 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <p className="text-sm font-semibold text-slate-700 truncate">
              {loadingId === u.id ? "ログイン中..." : (u.displayName ?? u.name ?? "名無し")}
            </p>
            <p className="text-xs text-slate-400 truncate">{u.email}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
