"use client";

import { useState, useTransition, useRef } from "react";
import { updateFeaturedImage } from "@/app/actions/creator";
import Image from "next/image";

export default function EditFeaturedImage({
  featuredImageUrl,
  featuredImageTitle,
  featuredImageCaption,
  featuredImageLink,
}: {
  featuredImageUrl: string | null;
  featuredImageTitle: string | null;
  featuredImageCaption: string | null;
  featuredImageLink: string | null;
}) {
  const [imageUrl, setImageUrl] = useState(featuredImageUrl ?? "");
  const [title, setTitle] = useState(featuredImageTitle ?? "");
  const [caption, setCaption] = useState(featuredImageCaption ?? "");
  const [link, setLink] = useState(featuredImageLink ?? "");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    imageUrl !== (featuredImageUrl ?? "") ||
    title.trim() !== (featuredImageTitle ?? "") ||
    caption.trim() !== (featuredImageCaption ?? "") ||
    link.trim() !== (featuredImageLink ?? "");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      setError("JPEG / PNG / WebP / GIF のみ対応しています");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("ファイルサイズは10MB以下にしてください");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
      });
      if (!res.ok) throw new Error("アップロードの準備に失敗しました");
      const { presignedUrl, publicUrl } = await res.json();
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("アップロードに失敗しました");
      setImageUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      await updateFeaturedImage({
        imageUrl: imageUrl || null,
        title: title || null,
        caption: caption || null,
        link: link || null,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleDelete = () => {
    setImageUrl("");
    startTransition(async () => {
      await updateFeaturedImage({
        imageUrl: null,
        title: title || null,
        caption: caption || null,
        link: link || null,
      });
    });
  };

  return (
    <div className="space-y-4">
      {/* 画像アップロード */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">画像</label>
        {imageUrl ? (
          <div className="mb-2">
            <div className="relative rounded-xl overflow-hidden bg-slate-50">
              <Image
                src={imageUrl}
                alt="プレビュー"
                width={600}
                height={400}
                className="w-full h-auto"
                unoptimized
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-semibold"
              >
                画像を変更
              </button>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="mt-1 block w-full text-center text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
            >
              画像を削除する
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm hover:border-pink-200 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {uploading ? (
              <span>アップロード中...</span>
            ) : (
              <>
                <span className="text-3xl leading-none">+</span>
                <span>画像を選択</span>
              </>
            )}
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>

      {/* タイトル */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">タイトル（任意）</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="タイトルを入力"
          maxLength={50}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className={`text-xs text-right mt-1 ${title.length >= 50 ? "text-red-500" : "text-slate-400"}`}>
          {title.length} / 50
        </p>
      </div>

      {/* 文章 */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">文章（任意）</label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="テキストを入力"
          maxLength={2200}
          rows={5}
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
        />
        <p className={`text-xs text-right mt-1 ${caption.length >= 2200 ? "text-red-500" : "text-slate-400"}`}>
          {caption.length} / 2200
        </p>
      </div>

      {/* リンクURL */}
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">リンクURL（任意）</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-xs text-slate-400 mt-1">設定すると画像タップでリンクへ遷移。空欄なら画像拡大。</p>
      </div>

      {!imageUrl && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">画像が設定されていないと、タイトル・文章は公開されません</p>
      )}
      {hasChanges && !saved && (
        <p className="text-xs text-center brand-gradient-text font-semibold">保存するボタンを押すまで反映されません</p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || uploading || !hasChanges}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
