"use client";

import { useState, useTransition } from "react";
import { submitReport } from "@/app/actions/user";

const FIXED_REASONS = ["不適切なコンテンツ", "なりすまし", "スパム"];
type Step = "reason" | "other" | "confirm" | "done";

export default function ReportModal({
  targetUserId,
  onClose,
}: {
  targetUserId: string;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("reason");
  const [reason, setReason] = useState("");
  const [otherText, setOtherText] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const finalReason = reason === "その他" ? otherText : reason;

  const handleSubmit = () => {
    setError("");
    startTransition(async () => {
      const result = await submitReport(targetUserId, finalReason);
      if (result?.error) {
        setError(result.error);
        return;
      }
      setStep("done");
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(185,138,245,0.10)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white/95 rounded-t-3xl px-6 pt-4 pb-10 flex flex-col gap-4"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.8)",
          boxShadow: "0 -8px 48px rgba(185,138,245,0.18), 0 -1px 0 rgba(255,255,255,0.7)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-1" />

        {step === "reason" && (
          <>
            <h2 className="text-base font-bold text-center brand-gradient-text">通報する</h2>
            <p className="text-xs text-slate-400 text-center -mt-2">通報の理由を選んでください</p>
            <div className="flex flex-col gap-2">
              {FIXED_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => { setReason(r); setStep("confirm"); }}
                  className="glass-btn-secondary w-full py-3 rounded-xl text-sm text-left px-4 font-medium"
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => { setReason("その他"); setStep("other"); }}
                className="glass-btn-secondary w-full py-3 rounded-xl text-sm text-left px-4 font-medium"
              >
                その他
              </button>
            </div>
            <button
              onClick={onClose}
              className="text-xs text-slate-400 text-center mt-1 hover:text-slate-600 transition-colors"
            >
              キャンセル
            </button>
          </>
        )}

        {step === "other" && (
          <>
            <h2 className="text-base font-bold text-center brand-gradient-text">その他の理由</h2>
            <textarea
              value={otherText}
              onChange={(e) => setOtherText(e.target.value.slice(0, 500))}
              placeholder="理由を入力してください（500文字以内）"
              className="w-full h-32 rounded-xl border border-slate-200 p-3 text-sm text-slate-700 resize-none focus:outline-none transition-colors"
              style={{ focusBorderColor: "#B98AF5" } as React.CSSProperties}
              onFocus={(e) => (e.target.style.borderColor = "#B98AF5")}
              onBlur={(e) => (e.target.style.borderColor = "")}
            />
            <p className="text-xs text-slate-400 text-right -mt-2">{otherText.length}/500</p>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("reason")}
                className="glass-btn-secondary flex-1 py-3 rounded-xl text-sm font-semibold"
              >
                戻る
              </button>
              <button
                onClick={() => setStep("confirm")}
                disabled={otherText.trim().length === 0}
                className="glass-btn-primary flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-40"
              >
                次へ
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <>
            <h2 className="text-base font-bold text-center brand-gradient-text">通報しますか？</h2>
            <div
              className="glass-card rounded-xl px-4 py-3 mx-1"
              style={{ background: "rgba(245,139,203,0.05)" }}
            >
              <p className="text-xs text-slate-400 text-center mb-1">選択した理由</p>
              <p className="text-sm font-semibold text-slate-700 text-center">{finalReason}</p>
            </div>
            <p className="text-xs text-slate-400 text-center">内容を確認のうえ運営が対応します。</p>
            {error && (
              <p className="text-xs text-center font-medium" style={{ color: "#F58BCB" }}>
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(reason === "その他" ? "other" : "reason")}
                disabled={isPending}
                className="glass-btn-secondary flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                戻る
              </button>
              <button
                onClick={handleSubmit}
                disabled={isPending}
                className="glass-btn-primary flex-1 py-3 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {isPending ? "送信中..." : "通報する"}
              </button>
            </div>
          </>
        )}

        {step === "done" && (
          <>
            <div className="flex justify-center py-2">
              <span className="sparkle" style={{ width: 24, height: 24 }} />
            </div>
            <h2 className="text-base font-bold text-center brand-gradient-text">通報しました</h2>
            <p className="text-xs text-slate-400 text-center">
              ご報告ありがとうございます。内容を確認のうえ対応します。
            </p>
            <button
              onClick={onClose}
              className="glass-btn-secondary w-full py-3 rounded-xl text-sm font-semibold"
            >
              閉じる
            </button>
          </>
        )}
      </div>
    </div>
  );
}
