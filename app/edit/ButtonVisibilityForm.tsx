"use client";

import { useState, useTransition } from "react";
import { updateButtonVisibility } from "@/app/actions/creator";

type Props = {
  showKizaruButton: boolean;
};

export default function ButtonVisibilityForm({ showKizaruButton }: Props) {
  const [kizaru, setKizaru] = useState(showKizaruButton);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      await updateButtonVisibility({ showKizaruButton: kizaru });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-sm text-slate-700">刻るボタン</span>
          <button
            type="button"
            onClick={() => setKizaru(!kizaru)}
            className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${kizaru ? "bg-pink-400" : "bg-slate-200"}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${kizaru ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>
        <p className="text-xs text-slate-400 px-1">推される側はON、推す側として使う場合はOFFがおすすめです</p>
      </div>
      <button
        onClick={handleSave}
        disabled={isPending}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
