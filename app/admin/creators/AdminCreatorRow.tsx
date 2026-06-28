"use client";

import { useState } from "react";
import {
  adminSetCreatorVisibility,
  adminDeleteCreator,
  adminUpdateSlug,
  adminClearCreatorBio,
  adminClearCreatorIcon,
} from "@/app/actions/admin";

type Creator = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  iconUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  user: { email: string | null; isSuspended: boolean };
  _count: { kizaris: number; fans: number };
};

export default function AdminCreatorRow({ creator }: { creator: Creator }) {
  const [isPublic, setIsPublic] = useState(creator.isPublic);
  const [slugValue, setSlugValue] = useState(creator.slug);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(creator.slug);
  const [bio, setBio] = useState(creator.bio);
  const [iconUrl, setIconUrl] = useState(creator.iconUrl);
  const [loading, setLoading] = useState(false);
  const [slugError, setSlugError] = useState("");

  const toggleVisibility = async () => {
    setLoading(true);
    const next = !isPublic;
    await adminSetCreatorVisibility(creator.id, next);
    setIsPublic(next);
    setLoading(false);
  };

  const handleSlugSave = async () => {
    if (!slugInput || slugInput === slugValue) { setEditingSlug(false); return; }
    setLoading(true);
    setSlugError("");
    const result = await adminUpdateSlug(creator.id, slugInput);
    if (result?.error) {
      setSlugError(result.error);
    } else {
      setSlugValue(slugInput);
      setEditingSlug(false);
    }
    setLoading(false);
  };

  const handleClearBio = async () => {
    if (!confirm("自己紹介を削除しますか？")) return;
    setLoading(true);
    await adminClearCreatorBio(creator.id);
    setBio("");
    setLoading(false);
  };

  const handleClearIcon = async () => {
    if (!confirm("アイコン画像を削除しますか？")) return;
    setLoading(true);
    await adminClearCreatorIcon(creator.id);
    setIconUrl(null);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`「${creator.displayName}」(/${slugValue}) のプロフィールを削除しますか？この操作は取り消せません。`)) return;
    setLoading(true);
    await adminDeleteCreator(creator.id);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {iconUrl ? (
            <div className="relative group">
              <img src={iconUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <button
                onClick={handleClearIcon}
                disabled={loading}
                title="アイコン削除"
                className="absolute inset-0 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center disabled:opacity-20"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 text-lg">⭐</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">{creator.displayName}</span>
            {!isPublic && <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">非公開</span>}
            {creator.user.isSuspended && <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500">停止中</span>}
          </div>

          {/* Slug */}
          <div className="flex items-center gap-2 mt-1">
            {editingSlug ? (
              <>
                <input
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  className="text-xs border border-[#B98AF5] rounded px-2 py-0.5 outline-none w-36 font-mono"
                  onKeyDown={(e) => e.key === "Enter" && handleSlugSave()}
                  autoFocus
                />
                <button onClick={handleSlugSave} disabled={loading} className="text-xs text-[#B98AF5] font-medium disabled:opacity-40">保存</button>
                <button onClick={() => { setEditingSlug(false); setSlugInput(slugValue); setSlugError(""); }} className="text-xs text-slate-400">キャンセル</button>
              </>
            ) : (
              <>
                <a href={`/${slugValue}`} target="_blank" className="text-xs text-[#B98AF5] hover:underline font-mono">/{slugValue}</a>
                <button onClick={() => setEditingSlug(true)} className="text-xs text-slate-400 hover:text-slate-600">✏️</button>
              </>
            )}
            {slugError && <span className="text-xs text-red-500">{slugError}</span>}
          </div>

          <p className="text-xs text-slate-400 mt-0.5">{creator.user.email}</p>

          {/* Bio */}
          {bio && (
            <div className="flex items-start gap-1 mt-1">
              <p className="text-xs text-slate-500 truncate max-w-xs">{bio}</p>
              <button onClick={handleClearBio} disabled={loading} title="bio削除" className="text-xs text-slate-300 hover:text-red-400 flex-shrink-0 disabled:opacity-40">✕</button>
            </div>
          )}

          <p className="text-xs text-slate-400 mt-1">
            刻み {creator._count.kizaris.toLocaleString()} · ファン {creator._count.fans.toLocaleString()} · {new Date(creator.createdAt).toLocaleDateString("ja-JP")}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleVisibility}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            {isPublic ? "非公開" : "公開"}
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40 transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  );
}
