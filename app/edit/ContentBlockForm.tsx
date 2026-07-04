"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { updateContentBlock } from "@/app/actions/content-blocks";
import { extractYoutubeVideoId } from "@/lib/youtube";
import { extractAppleMusicEmbedUrl } from "@/lib/apple-music";
import { extractSpotifyEmbedUrl } from "@/lib/spotify";
import { extractTimeTreeEmbedUrl } from "@/lib/timetree";
import CardVisibilityForm from "./CardVisibilityForm";

type Block = {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  url: string | null;
  imageUrl: string | null;
  link: string | null;
};

export type RankingSettings = {
  showFastestCard: boolean;
  showRandomCard: boolean;
  showMostCard: boolean;
  showStreakCard: boolean;
  cardOrder: string;
};

type OnSaved = (id: string, updates: Partial<Block>) => void;

export default function ContentBlockForm({
  block,
  rankingSettings,
  onSaved,
}: {
  block: Block;
  rankingSettings?: RankingSettings;
  onSaved?: OnSaved;
}) {
  switch (block.type) {
    case "youtube":    return <YoutubeForm block={block} onSaved={onSaved} />;
    case "image":      return <ImageForm block={block} onSaved={onSaved} />;
    case "text":       return <TextForm block={block} onSaved={onSaved} />;
    case "applemusic": return <AppleMusicForm block={block} onSaved={onSaved} />;
    case "spotify":    return <SpotifyForm block={block} onSaved={onSaved} />;
    case "timetree":   return <TimeTreeForm block={block} onSaved={onSaved} />;
    case "ranking":    return <RankingForm settings={rankingSettings} />;
    default:           return null;
  }
}

// ── 共通ユーティリティ ────────────────────────────────────────────────

function TitleField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">タイトル（任意）</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="タイトルを入力"
        maxLength={50}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
      />
      <p className={`text-xs text-right mt-1 ${value.length >= 50 ? "text-red-500" : "text-slate-400"}`}>
        {value.length} / 50
      </p>
    </div>
  );
}

function CaptionField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">文章（任意）</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="テキストを入力"
        maxLength={2200}
        rows={4}
        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 resize-none"
      />
      <p className={`text-xs text-right mt-1 ${value.length >= 2200 ? "text-red-500" : "text-slate-400"}`}>
        {value.length} / 2200
      </p>
    </div>
  );
}

function SaveButton({
  isPending,
  saved,
  hasChanges,
  onClick,
}: {
  isPending: boolean;
  saved: boolean;
  hasChanges: boolean;
  onClick: () => void;
}) {
  return (
    <>
      {hasChanges && !saved && (
        <p className="text-xs text-center brand-gradient-text font-semibold">
          保存するボタンを押すまで反映されません
        </p>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={isPending || !hasChanges}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold cursor-pointer"
      >
        {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
      </button>
    </>
  );
}

// ── YouTube ──────────────────────────────────────────────────────────

function YoutubeForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [url, setUrl] = useState(block.url ?? "");
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [savedUrl, setSavedUrl] = useState(block.url ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl || title.trim() !== savedTitle || caption.trim() !== savedCaption;
  const videoId = extractYoutubeVideoId(url);

  const handleSave = () => {
    if (url.trim() && !videoId) { setError("YouTubeのURLを正しく入力してください"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateContentBlock(block.id, {
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const u = url.trim(); const t = title.trim(); const c = caption.trim();
      setSavedUrl(u); setSavedTitle(t); setSavedCaption(c);
      onSaved?.(block.id, { url: u || null, title: t || null, caption: c || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">YouTube URL</label>
        <input
          type="url" value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
        />
        <p className="text-xs text-slate-400 mt-1">youtube.com / youtu.be / Shorts に対応。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      {videoId && (
        <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: "16/9" }}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}`}
            title="プレビュー" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen className="absolute inset-0 w-full h-full"
          />
        </div>
      )}
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      {!url.trim() && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">YouTubeのURLが設定されていないと、タイトル・文章は公開されません</p>
      )}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── 画像 ──────────────────────────────────────────────────────────────

function ImageForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [imageUrl, setImageUrl] = useState(block.imageUrl ?? "");
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [link, setLink] = useState(block.link ?? "");
  const [savedImageUrl, setSavedImageUrl] = useState(block.imageUrl ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [savedLink, setSavedLink] = useState(block.link ?? "");
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasChanges =
    imageUrl !== savedImageUrl || title.trim() !== savedTitle ||
    caption.trim() !== savedCaption || link.trim() !== savedLink;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) { setError("JPEG / PNG / WebP / GIF のみ対応"); return; }
    if (file.size > 10 * 1024 * 1024) { setError("10MB以下にしてください"); return; }
    setError(null); setUploading(true);
    try {
      const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type, contentLength: file.size }),
      });
      if (!res.ok) throw new Error("アップロードの準備に失敗しました");
      const { presignedUrl, publicUrl } = await res.json();
      const putRes = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
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
      const res = await updateContentBlock(block.id, {
        imageUrl: imageUrl || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
        link: link.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const t = title.trim(); const c = caption.trim(); const l = link.trim();
      setSavedImageUrl(imageUrl); setSavedTitle(t); setSavedCaption(c); setSavedLink(l);
      onSaved?.(block.id, { imageUrl: imageUrl || null, title: t || null, caption: c || null, link: l || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  const handleDeleteImage = () => {
    setImageUrl("");
    startTransition(async () => {
      await updateContentBlock(block.id, { imageUrl: null });
    });
    setSavedImageUrl("");
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-2">画像</label>
        {imageUrl ? (
          <div className="mb-2">
            <div className="relative rounded-xl overflow-hidden bg-slate-50">
              <Image src={imageUrl} alt="プレビュー" width={600} height={400} className="w-full h-auto" unoptimized />
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity text-white text-sm font-semibold">
                画像を変更
              </button>
            </div>
            <button type="button" onClick={handleDeleteImage} disabled={isPending}
              className="mt-1 block w-full text-center text-xs text-red-400 hover:text-red-500 transition-colors disabled:opacity-50">
              画像を削除する
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 text-slate-400 text-sm hover:border-pink-200 transition-colors disabled:opacity-50 cursor-pointer">
            {uploading ? <span>アップロード中...</span> : <><span className="text-3xl leading-none">+</span><span>画像を選択</span></>}
          </button>
        )}
        <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleFileChange} />
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">リンクURL（任意）</label>
        <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
          placeholder="https://..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        <p className="text-xs text-slate-400 mt-1">設定すると画像タップでリンクへ遷移。空欄なら画像拡大。</p>
      </div>
      {!imageUrl && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">画像が設定されていないと、タイトル・文章は公開されません</p>
      )}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── テキスト ──────────────────────────────────────────────────────────

function TextForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasChanges = title.trim() !== savedTitle || caption.trim() !== savedCaption;

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateContentBlock(block.id, {
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const t = title.trim(); const c = caption.trim();
      setSavedTitle(t); setSavedCaption(c);
      onSaved?.(block.id, { title: t || null, caption: c || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── Apple Music ────────────────────────────────────────────────────────

function AppleMusicForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [url, setUrl] = useState(block.url ?? "");
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [savedUrl, setSavedUrl] = useState(block.url ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl || title.trim() !== savedTitle || caption.trim() !== savedCaption;
  const embedUrl = extractAppleMusicEmbedUrl(url.trim());

  const handleSave = () => {
    if (url.trim() && !embedUrl) { setError("Apple Music の URL を正しく入力してください"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateContentBlock(block.id, {
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const u = url.trim(); const t = title.trim(); const c = caption.trim();
      setSavedUrl(u); setSavedTitle(t); setSavedCaption(c);
      onSaved?.(block.id, { url: u || null, title: t || null, caption: c || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Apple Music URL</label>
        <input type="url" value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); setIframeLoaded(false); }}
          placeholder="https://music.apple.com/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        <p className="text-xs text-slate-400 mt-1">曲・アルバム・プレイリスト・アーティストURLに対応。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      {embedUrl && (
        <div className="rounded-xl overflow-hidden relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 rounded-xl bg-slate-100 flex items-center justify-center">
              <Image src="/loading.gif" alt="読み込み中" width={48} height={48} unoptimized />
            </div>
          )}
          <iframe
            key={embedUrl} src={embedUrl} height={175}
            allow="autoplay *; encrypted-media *; fullscreen *"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
            className="w-full border-0" title="Apple Music"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      )}
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      {!url.trim() && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">URLが設定されていないと、タイトル・文章は公開されません</p>
      )}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── Spotify ────────────────────────────────────────────────────────────

function SpotifyForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [url, setUrl] = useState(block.url ?? "");
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [savedUrl, setSavedUrl] = useState(block.url ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl || title.trim() !== savedTitle || caption.trim() !== savedCaption;
  const embedUrl = extractSpotifyEmbedUrl(url.trim());

  const handleSave = () => {
    if (url.trim() && !embedUrl) { setError("Spotify の URL を正しく入力してください"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateContentBlock(block.id, {
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const u = url.trim(); const t = title.trim(); const c = caption.trim();
      setSavedUrl(u); setSavedTitle(t); setSavedCaption(c);
      onSaved?.(block.id, { url: u || null, title: t || null, caption: c || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Spotify URL</label>
        <input type="url" value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); setIframeLoaded(false); }}
          placeholder="https://open.spotify.com/track/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        <p className="text-xs text-slate-400 mt-1">トラック・アルバム・プレイリスト・アーティスト・ポッドキャストに対応。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      {embedUrl && (
        <div className="rounded-xl overflow-hidden relative">
          {!iframeLoaded && (
            <div className="absolute inset-0 rounded-xl bg-slate-100 flex items-center justify-center" style={{ minHeight: 152 }}>
              <Image src="/loading.gif" alt="読み込み中" width={48} height={48} unoptimized />
            </div>
          )}
          <iframe
            key={embedUrl} src={embedUrl} height={152}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            className="w-full border-0" style={{ borderRadius: 12, opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            title="Spotify" onLoad={() => setIframeLoaded(true)}
          />
        </div>
      )}
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      {!url.trim() && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">URLが設定されていないと、タイトル・文章は公開されません</p>
      )}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── TimeTree ────────────────────────────────────────────────────────────

function TimeTreeForm({ block, onSaved }: { block: Block; onSaved?: OnSaved }) {
  const [url, setUrl] = useState(block.url ?? "");
  const [title, setTitle] = useState(block.title ?? "");
  const [caption, setCaption] = useState(block.caption ?? "");
  const [savedUrl, setSavedUrl] = useState(block.url ?? "");
  const [savedTitle, setSavedTitle] = useState(block.title ?? "");
  const [savedCaption, setSavedCaption] = useState(block.caption ?? "");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanges =
    url.trim() !== savedUrl || title.trim() !== savedTitle || caption.trim() !== savedCaption;
  const embedUrl = extractTimeTreeEmbedUrl(url.trim());

  const handleSave = () => {
    if (url.trim() && !embedUrl) { setError("TimeTree の公開カレンダー URL を正しく入力してください"); return; }
    setError(null);
    startTransition(async () => {
      const res = await updateContentBlock(block.id, {
        url: url.trim() || null,
        title: title.trim() || null,
        caption: caption.trim() || null,
      });
      if (res?.error) { setError(res.error); return; }
      const u = url.trim(); const t = title.trim(); const c = caption.trim();
      setSavedUrl(u); setSavedTitle(t); setSavedCaption(c);
      onSaved?.(block.id, { url: u || null, title: t || null, caption: c || null });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">TimeTree 公開カレンダー URL</label>
        <input type="url" value={url}
          onChange={(e) => { setUrl(e.target.value); setError(null); setIframeLoaded(false); }}
          placeholder="https://timetreeapp.com/public_calendars/..."
          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        <p className="text-xs text-slate-400 mt-1">TimeTree の公開カレンダーページの URL を貼り付けてください。空欄で削除。</p>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      </div>
      {embedUrl && (
        <div className="rounded-xl overflow-hidden relative" style={{ height: 500 }}>
          {!iframeLoaded && (
            <div className="absolute inset-0 rounded-xl bg-slate-100 flex items-center justify-center">
              <Image src="/loading.gif" alt="読み込み中" width={48} height={48} unoptimized />
            </div>
          )}
          <iframe
            key={embedUrl} src={embedUrl} height={500} allow="autoplay"
            className="w-full border-0" title="TimeTree カレンダー"
            style={{ opacity: iframeLoaded ? 1 : 0, transition: "opacity 0.3s" }}
            onLoad={() => setIframeLoaded(true)}
          />
        </div>
      )}
      <TitleField value={title} onChange={setTitle} />
      <CaptionField value={caption} onChange={setCaption} />
      {!url.trim() && (title.trim() || caption.trim()) && (
        <p className="text-xs text-center text-amber-500 font-semibold">URLが設定されていないと、タイトル・文章は公開されません</p>
      )}
      <SaveButton isPending={isPending} saved={saved} hasChanges={hasChanges} onClick={handleSave} />
    </div>
  );
}

// ── ランキング ──────────────────────────────────────────────────────────

function RankingForm({ settings }: { settings?: RankingSettings }) {
  if (!settings) {
    return (
      <div className="py-2">
        <p className="text-xs text-slate-500 text-center">ランキングカードはこの位置に表示されます。</p>
      </div>
    );
  }
  return (
    <CardVisibilityForm
      showFastestCard={settings.showFastestCard}
      showRandomCard={settings.showRandomCard}
      showMostCard={settings.showMostCard}
      showStreakCard={settings.showStreakCard}
      cardOrder={settings.cardOrder}
    />
  );
}
