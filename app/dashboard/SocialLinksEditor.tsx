"use client";

import { useState, useTransition } from "react";
import { upsertSocialLink, deleteSocialLink } from "@/app/actions/creator";
import { useRouter } from "next/navigation";

const PLATFORMS = [
  { value: "x", label: "X (Twitter)" },
  { value: "instagram", label: "Instagram" },
  { value: "tiktok", label: "TikTok" },
  { value: "youtube", label: "YouTube" },
  { value: "twitch", label: "Twitch" },
  { value: "showroom", label: "SHOWROOM" },
  { value: "seventeen", label: "17LIVE" },
  { value: "pococha", label: "Pococha" },
  { value: "note", label: "note" },
  { value: "threads", label: "Threads" },
  { value: "booth", label: "BOOTH" },
  { value: "litlink", label: "lit.link" },
  { value: "website", label: "公式サイト" },
];

type SocialLink = { id: string; platform: string; url: string };

export default function SocialLinksEditor({ socialLinks }: { socialLinks: SocialLink[] }) {
  const [platform, setPlatform] = useState("x");
  const [url, setUrl] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    startTransition(async () => {
      await upsertSocialLink(platform, url.trim());
      setUrl("");
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteSocialLink(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      {socialLinks.map((link) => (
        <div key={link.id} className="flex items-center justify-between text-sm">
          <div>
            <span className="font-medium text-slate-700">
              {PLATFORMS.find((p) => p.value === link.platform)?.label ?? link.platform}
            </span>
            <p className="text-xs text-slate-400 truncate max-w-[200px]">{link.url}</p>
          </div>
          <button
            onClick={() => handleDelete(link.id)}
            className="text-xs text-red-400 hover:text-red-500 cursor-pointer"
          >
            削除
          </button>
        </div>
      ))}
      <form onSubmit={handleAdd} className="flex gap-2 items-end pt-2 border-t border-slate-100">
        <div className="space-y-1">
          <label className="text-xs text-slate-500">プラットフォーム</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="px-2 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs focus:outline-none"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-xs text-slate-500">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white/80 text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="glass-btn-primary px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 whitespace-nowrap"
        >
          追加
        </button>
      </form>
    </div>
  );
}
