"use client";

import { useState, useTransition } from "react";
import { logoutUser, deleteAccount } from "@/app/actions/user";

// TODO: Googleフォームが完成したらURLを差し替える
const CONTACT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdExCpeqFErxpnVwLo49M9K2Lf70kxI6x9DgnxZAs6yTpESFg/viewform";

export default function SettingsButtons() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(() => logoutUser());
  };

  const handleDelete = () => {
    startTransition(() => deleteAccount());
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      {/* 利用規約 */}
      <a
        href="/terms"
        className="flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
      >
        <span className="text-sm text-slate-700">利用規約</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>

      {/* プライバシーポリシー */}
      <a
        href="/privacy"
        className="flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
      >
        <span className="text-sm text-slate-700">プライバシーポリシー</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>

      {/* お問い合わせ */}
      <a
        href={CONTACT_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
      >
        <span className="text-sm text-slate-700">お問い合わせ</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </a>

      {/* ログアウト */}
      <button
        onClick={handleLogout}
        disabled={isPending}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-slate-100 hover:bg-slate-50/60 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <span className="text-sm text-slate-700">ログアウト</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* 退会する */}
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          disabled={isPending}
          className="w-full flex items-center justify-between px-5 py-4 hover:bg-red-50/60 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span className="text-sm text-red-400">退会する</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
      ) : (
        <div className="px-5 py-4 bg-red-50/40 space-y-3">
          <p className="text-xs text-red-500 font-semibold text-center">本当に退会しますか？</p>
          <p className="text-xs text-slate-400 text-center">キザり記録・フォロー情報がすべて削除されます。この操作は取り消せません。</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-xs font-semibold glass-btn-secondary disabled:opacity-50 cursor-pointer"
            >
              キャンセル
            </button>
            <button
              onClick={handleDelete}
              disabled={isPending}
              className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "退会中..." : "退会する"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
