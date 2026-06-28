"use client";

import { useState, useEffect, useRef } from "react";

type Props = {
  triggered: boolean;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const STORAGE_KEY = "kizalo-pwa-prompt-shown";

export default function PwaInstallPrompt({ triggered }: Props) {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (!triggered) return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const ua = navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(ua) && !(window as { MSStream?: unknown }).MSStream;
    setIsIOS(ios);

    const timer = setTimeout(() => setShow(true), 1800);
    return () => clearTimeout(timer);
  }, [triggered]);

  const dismiss = () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, "1");
  };

  const install = async () => {
    if (!deferredPrompt.current) return;
    await deferredPrompt.current.prompt();
    const { outcome } = await deferredPrompt.current.userChoice;
    if (outcome === "accepted") localStorage.setItem(STORAGE_KEY, "1");
    deferredPrompt.current = null;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-36 left-0 right-0 z-50 px-4 animate-slide-up">
      <div
        className="max-w-lg mx-auto rounded-2xl px-4 py-3 flex items-start gap-3"
        style={{ background: "rgba(255,255,255,0.95)", boxShadow: "0 4px 24px rgba(185,138,245,0.30)", border: "1px solid rgba(185,138,245,0.2)" }}
      >
        <span className="text-2xl flex-shrink-0 mt-0.5">📱</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-700">ホーム画面に追加しよう</p>
          {isIOS ? (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Safari の <span className="font-semibold text-slate-600">共有ボタン</span>（□↑）→「<span className="font-semibold text-slate-600">ホーム画面に追加</span>」で毎日すぐ刻れるよ！
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              ホーム画面に追加すると毎日すぐ刻れるよ！
            </p>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 mt-0.5">
          {!isIOS && deferredPrompt.current && (
            <button
              onClick={install}
              className="glass-btn-primary text-xs px-3 py-1.5 rounded-full font-bold whitespace-nowrap"
            >
              追加
            </button>
          )}
          <button
            onClick={dismiss}
            className="text-slate-400 hover:text-slate-600 text-base font-bold w-7 h-7 flex items-center justify-center"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
