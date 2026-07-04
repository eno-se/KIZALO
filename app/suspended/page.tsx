"use client";

import { useState, useTransition } from "react";
import { logoutUser, deleteAccount } from "@/app/actions/user";

const CONTACT_URL = "https://docs.google.com/forms/d/e/1FAIpQLSdExCpeqFErxpnVwLo49M9K2Lf70kxI6x9DgnxZAs6yTpESFg/viewform";

export default function SuspendedPage() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        <p className="text-2xl">🚫</p>
        <h1 className="text-lg font-bold text-slate-700">アカウント停止中です</h1>
        <p className="text-sm text-slate-500">
          このアカウントは現在ご利用いただけません。
          お心当たりがある場合はお問い合わせください。
        </p>

        <div className="space-y-2 pt-2">
          <a
            href={CONTACT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="glass-btn-secondary block w-full py-2.5 rounded-xl text-sm font-semibold text-center"
          >
            お問い合わせ
          </a>

          <button
            onClick={() => startTransition(() => logoutUser())}
            disabled={isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            ログアウト
          </button>

          {!showConfirm ? (
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isPending}
              className="w-full py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-50/60 transition-colors disabled:opacity-50 cursor-pointer"
            >
              退会する
            </button>
          ) : (
            <div className="rounded-xl bg-red-50/40 px-4 py-3 space-y-3">
              <p className="text-xs text-red-500 font-semibold">本当に退会しますか？</p>
              <p className="text-xs text-slate-400">キザり記録・フォロー情報がすべて削除されます。この操作は取り消せません。</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowConfirm(false)}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold glass-btn-secondary disabled:opacity-50 cursor-pointer"
                >
                  キャンセル
                </button>
                <button
                  onClick={() => startTransition(() => deleteAccount())}
                  disabled={isPending}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-red-400 hover:bg-red-500 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isPending ? "退会中..." : "退会する"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
