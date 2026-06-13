"use client";

import { useState, useTransition } from "react";
import { updateCreatorProfile } from "@/app/actions/creator";

type Props = { displayName: string; bio: string };

export default function ProfileEditForm({ displayName, bio }: Props) {
  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      await updateCreatorProfile({ displayName: name, bio: bioText });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">表示名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">自己紹介</label>
        <textarea
          value={bioText}
          onChange={(e) => setBioText(e.target.value)}
          rows={3}
          maxLength={200}
          className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-300"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="glass-btn-primary px-5 py-2 rounded-xl font-semibold text-sm disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </form>
  );
}
