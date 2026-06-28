"use client";

import { useState } from "react";
import {
  adminDeleteUser,
  adminSuspendUser,
  adminSetCreatorVisibility,
  adminUpdateSlug,
  adminClearCreatorBio,
  adminClearCreatorIcon,
  adminDeleteCreator,
} from "@/app/actions/admin";

type CreatorProfile = {
  id: string;
  slug: string;
  displayName: string;
  bio: string | null;
  iconUrl: string | null;
  isPublic: boolean;
  createdAt: Date;
  _count: { kizaris: number; fans: number };
};

type User = {
  id: string;
  email: string | null;
  displayName: string | null;
  name: string | null;
  isSuspended: boolean;
  createdAt: Date;
  creatorProfile: CreatorProfile | null;
};

export default function AdminUserRow({ user }: { user: User }) {
  const cp = user.creatorProfile;

  const [suspended, setSuspended] = useState(user.isSuspended);
  const [isPublic, setIsPublic] = useState(cp?.isPublic ?? true);
  const [slugValue, setSlugValue] = useState(cp?.slug ?? "");
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState(cp?.slug ?? "");
  const [slugError, setSlugError] = useState("");
  const [bio, setBio] = useState(cp?.bio ?? null);
  const [iconUrl, setIconUrl] = useState(cp?.iconUrl ?? null);
  const [loading, setLoading] = useState(false);
  const [cpDeleted, setCpDeleted] = useState(false);

  const handleSuspend = async () => {
    const next = !suspended;
    if (!confirm(`${user.email} を${next ? "停止" : "停止解除"}しますか？`)) return;
    setLoading(true);
    await adminSuspendUser(user.id, next);
    setSuspended(next);
    setLoading(false);
  };

  const handleDeleteUser = async () => {
    if (!confirm(`${user.email} を完全削除しますか？この操作は取り消せません。`)) return;
    setLoading(true);
    await adminDeleteUser(user.id);
  };

  const toggleVisibility = async () => {
    if (!cp) return;
    setLoading(true);
    const next = !isPublic;
    await adminSetCreatorVisibility(cp.id, next);
    setIsPublic(next);
    setLoading(false);
  };

  const handleSlugSave = async () => {
    if (!cp || !slugInput || slugInput === slugValue) { setEditingSlug(false); return; }
    setLoading(true);
    setSlugError("");
    const result = await adminUpdateSlug(cp.id, slugInput);
    if (result?.error) {
      setSlugError(result.error);
    } else {
      setSlugValue(slugInput);
      setEditingSlug(false);
    }
    setLoading(false);
  };

  const handleClearBio = async () => {
    if (!cp || !confirm("自己紹介を削除しますか？")) return;
    setLoading(true);
    await adminClearCreatorBio(cp.id);
    setBio(null);
    setLoading(false);
  };

  const handleClearIcon = async () => {
    if (!cp || !confirm("アイコン画像を削除しますか？")) return;
    setLoading(true);
    await adminClearCreatorIcon(cp.id);
    setIconUrl(null);
    setLoading(false);
  };

  const handleDeleteCreator = async () => {
    if (!cp || !confirm(`「${cp.displayName}」のプロフィールページを削除しますか？`)) return;
    setLoading(true);
    await adminDeleteCreator(cp.id);
    setCpDeleted(true);
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-4">
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          {iconUrl && !cpDeleted ? (
            <div className="relative group">
              <img src={iconUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
              <button
                onClick={handleClearIcon}
                disabled={loading}
                title="アイコン削除"
                className="absolute inset-0 rounded-full bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm font-bold">
              {(user.displayName ?? user.name ?? "?")[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Name + badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-800">
              {user.displayName ?? user.name ?? "（名前なし）"}
            </span>
            {suspended && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">停止中</span>
            )}
            {cp && !cpDeleted && !isPublic && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">非公開</span>
            )}
          </div>

          <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>

          {/* Creator page info */}
          {cp && !cpDeleted && (
            <>
              <div className="flex items-center gap-2 mt-1.5">
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
                    <button onClick={() => setEditingSlug(true)} className="text-xs text-slate-300 hover:text-slate-500">✏️</button>
                  </>
                )}
                {slugError && <span className="text-xs text-red-500">{slugError}</span>}
              </div>

              {bio && (
                <div className="flex items-center gap-1 mt-1">
                  <p className="text-xs text-slate-500 truncate max-w-xs">{bio}</p>
                  <button onClick={handleClearBio} disabled={loading} title="bio削除" className="text-xs text-slate-300 hover:text-red-400 disabled:opacity-40">✕</button>
                </div>
              )}

              <p className="text-xs text-slate-400 mt-1">
                刻み {cp._count.kizaris.toLocaleString()} · ファン {cp._count.fans.toLocaleString()} · 登録 {new Date(user.createdAt).toLocaleDateString("ja-JP")}
              </p>
            </>
          )}

          {(!cp || cpDeleted) && (
            <p className="text-xs text-slate-300 mt-1">プロフページなし · 登録 {new Date(user.createdAt).toLocaleDateString("ja-JP")}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            {cp && !cpDeleted && (
              <button
                onClick={toggleVisibility}
                disabled={loading}
                className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
              >
                {isPublic ? "非公開" : "公開"}
              </button>
            )}
            <button
              onClick={handleSuspend}
              disabled={loading}
              className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              {suspended ? "停止解除" : "停止"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            {cp && !cpDeleted && (
              <button
                onClick={handleDeleteCreator}
                disabled={loading}
                className="text-xs text-orange-400 hover:text-orange-600 font-medium disabled:opacity-40 transition-colors"
              >
                ページ削除
              </button>
            )}
            <button
              onClick={handleDeleteUser}
              disabled={loading}
              className="text-xs text-red-400 hover:text-red-600 font-medium disabled:opacity-40 transition-colors"
            >
              アカウント削除
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
