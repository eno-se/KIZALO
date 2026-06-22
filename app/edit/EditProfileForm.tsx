"use client";

import { useState, useTransition, useRef, useCallback } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { updateCreatorProfile, updateSlug } from "@/app/actions/creator";

type Props = {
  displayName: string;
  bio: string;
  bioLink: string;
  bioLinkLabel: string;
  iconUrl: string | null;
  slug: string;
  slugChangedAt: Date | null;
};

async function getCroppedBlob(imageSrc: string, cropArea: Area): Promise<Blob> {
  const img = await new Promise<HTMLImageElement>((resolve) => {
    const i = new window.Image();
    i.onload = () => resolve(i);
    i.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  const SIZE = 400;
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, cropArea.x, cropArea.y, cropArea.width, cropArea.height, 0, 0, SIZE, SIZE);
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9));
}

export default function EditProfileForm({ displayName, bio, bioLink, bioLinkLabel, iconUrl, slug, slugChangedAt }: Props) {
  const [name, setName] = useState(displayName);
  const [bioText, setBioText] = useState(bio);
  const [bioLinkText, setBioLinkText] = useState(bioLink);
  const [bioLinkLabelText, setBioLinkLabelText] = useState(bioLinkLabel);
  const [slugText, setSlugText] = useState(slug);
  const [slugError, setSlugError] = useState<string | null>(null);
  const [slugSaved, setSlugSaved] = useState(false);
  const [isSlugPending, startSlugTransition] = useTransition();
  const [showSlugWarning, setShowSlugWarning] = useState(false);

  const todayJst = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const changedToday = slugChangedAt
    ? new Date(slugChangedAt.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10) === todayJst
    : false;

  const handleSlugSave = () => {
    setSlugError(null);
    setShowSlugWarning(true);
  };

  const confirmSlugSave = () => {
    setShowSlugWarning(false);
    startSlugTransition(async () => {
      const res = await updateSlug(slugText.trim());
      if (res.error) {
        setSlugError(res.error);
      } else {
        setSlugSaved(true);
        setTimeout(() => setSlugSaved(false), 2500);
      }
    });
  };
  const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(iconUrl);

  // クロップ用
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedArea(areaPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedArea) return;
    setUploading(true);
    setUploadError(null);
    try {
      const blob = await getCroppedBlob(cropSrc, croppedArea);
      const res = await fetch("/api/upload-icon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: "image/jpeg" }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const { presignedUrl, publicUrl } = await res.json();
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": "image/jpeg" },
        body: blob,
      });
      if (!putRes.ok) throw new Error(`R2 PUT failed: ${putRes.status}`);
      setCurrentIconUrl(publicUrl);
      setCropSrc(null);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      await updateCreatorProfile({
        displayName: name.trim(),
        bio: bioText,
        bioLink: bioLinkText.trim(),
        bioLinkLabel: bioLinkLabelText.trim(),
        iconUrl: currentIconUrl,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <>
      {/* ID変更確認ダイアログ */}
      {showSlugWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6 bg-black/50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <p className="text-base font-bold text-slate-800 mb-2">IDを変更しますか？</p>
            <p className="text-sm text-slate-500 mb-1">
              <span className="font-semibold text-slate-700">@{slug}</span> → <span className="font-semibold text-slate-700">@{slugText.trim()}</span>
            </p>
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 my-4">
              <p className="text-xs text-red-600 font-semibold mb-1">⚠️ 注意</p>
              <ul className="text-xs text-red-500 space-y-1 list-disc list-inside">
                <li>旧URL（<span className="font-mono">/{slug}</span>）は即座に404になります</li>
                <li>SNSなどでシェアした既存リンクがすべて無効になります</li>
                <li>変更は1日1回までです</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowSlugWarning(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600"
              >
                キャンセル
              </button>
              <button
                onClick={confirmSlugSave}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold"
              >
                変更する
              </button>
            </div>
          </div>
        </div>
      )}

      {/* クロップモーダル */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <button onClick={() => setCropSrc(null)} className="text-sm text-white/70">キャンセル</button>
            <p className="text-sm font-semibold">位置を調整</p>
            <button
              onClick={handleCropConfirm}
              disabled={uploading}
              className="text-sm font-bold text-[#F58BCB]"
            >
              {uploading ? "処理中..." : "決定"}
            </button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          </div>
          <div className="px-6 py-4 bg-black/60">
            {uploadError && (
              <p className="text-xs text-red-400 text-center mb-2 break-all">{uploadError}</p>
            )}
            <p className="text-xs text-white/50 text-center mb-2">ピンチまたはスライダーでズーム</p>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full accent-pink-400"
            />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* アイコン */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative group"
          >
            <div
              className="rounded-full p-[3px]"
              style={{ background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)" }}
            >
              <div className="rounded-full bg-white p-[2px]" style={{ width: 84, height: 84 }}>
                <div className="rounded-full overflow-hidden bg-pink-50 flex items-center justify-center" style={{ width: 80, height: 80 }}>
                  {currentIconUrl ? (
                    <Image src={currentIconUrl} alt={name} width={80} height={80} className="object-cover" style={{ width: 80, height: 80 }} unoptimized />
                  ) : (
                    <span className="text-2xl font-bold text-[#F58BCB]">{name[0] ?? "?"}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </div>
          </button>
          <p className="text-xs text-slate-400">タップして画像を変更</p>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
        </div>

        {/* 表示名 */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">表示名</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={30}
            required
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>

        {/* ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">ID</label>
          <div className="flex gap-2">
            <div className="flex items-center flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm gap-1">
              <span className="text-slate-400">@</span>
              <input
                type="text"
                value={slugText}
                onChange={(e) => setSlugText(e.target.value)}
                disabled={changedToday}
                maxLength={30}
                className="flex-1 bg-transparent focus:outline-none disabled:text-slate-400"
              />
            </div>
            <button
              type="button"
              onClick={handleSlugSave}
              disabled={isSlugPending || changedToday || slugText.trim() === slug}
              className="glass-btn-secondary px-4 rounded-xl text-xs font-semibold disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              {slugSaved ? "変更 ✓" : isSlugPending ? "変更中..." : "変更"}
            </button>
          </div>
          {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
          {changedToday ? (
            <p className="text-xs text-slate-400 mt-1">IDの変更は1日1回までです。明日以降に変更できます。</p>
          ) : (
            <p className="text-xs text-slate-400 mt-1">IDは1日1回まで変更できます。英数字・アンダースコア・ハイフン（3〜30文字）</p>
          )}
        </div>

        {/* 自己紹介 */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">一言</label>
          <textarea
            value={bioText}
            onChange={(e) => setBioText(e.target.value)}
            rows={4}
            maxLength={200}
            placeholder="一言を入力..."
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
          <p className="text-right text-xs text-slate-300 mt-1">{bioText.length}/200</p>
        </div>

        {/* 一言リンク */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">一言の下のリンク</label>
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={bioLinkLabelText}
              onChange={(e) => setBioLinkLabelText(e.target.value)}
              placeholder="タイトル（例：グッズはこちら）"
              maxLength={30}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
            <input
              type="url"
              value={bioLinkText}
              onChange={(e) => setBioLinkText(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
            />
          </div>
          <p className="text-xs text-slate-400 mt-2">タイトルを設定するとリンクにその文字が表示されます。未設定の場合はURLがそのまま表示されます。</p>
        </div>

        <button
          type="submit"
          disabled={isPending || !name.trim()}
          className="glass-btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50 cursor-pointer"
        >
          {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
        </button>
      </form>
    </>
  );
}
