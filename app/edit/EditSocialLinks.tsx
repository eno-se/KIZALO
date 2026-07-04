"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { upsertSocialLink, deleteSocialLink, reorderSocialLinks } from "@/app/actions/creator";
import { validateSnsUrl } from "@/lib/sns-validation";
import { useRouter } from "next/navigation";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const PLATFORMS = [
  { value: "x",          label: "X (Twitter)" },
  { value: "instagram",  label: "Instagram" },
  { value: "tiktok",     label: "TikTok" },
  { value: "youtube",    label: "YouTube" },
  { value: "twitch",     label: "Twitch" },
  { value: "showroom",   label: "SHOWROOM" },
  { value: "17live",     label: "17LIVE" },
  { value: "pococha",    label: "Pococha" },
  { value: "note",       label: "note" },
  { value: "threads",    label: "Threads" },
  { value: "booth",      label: "BOOTH" },
  { value: "litlink",    label: "lit.link" },
  { value: "website",    label: "公式サイト" },
];

type SocialLink = { id: string; platform: string; url: string; isNew?: boolean };

function SortableIcon({
  link,
  index,
  total,
  onMove,
}: {
  link: SocialLink;
  index: number;
  total: number;
  onMove: (index: number, dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex flex-col items-center gap-1.5">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center touch-none cursor-grab active:cursor-grabbing ${link.isNew ? "ring-2 ring-pink-300" : "glass-btn-secondary"}`}
        {...attributes}
        {...listeners}
      >
        <Image src={`/sns/${link.platform}.png`} alt={link.platform} width={28} height={28} className="object-contain" />
      </div>
      <div className="flex gap-1">
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}
          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
          ‹
        </button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1}
          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-slate-600 disabled:opacity-20 transition-colors">
          ›
        </button>
      </div>
    </div>
  );
}

export default function EditSocialLinks({ socialLinks: initial }: { socialLinks: Omit<SocialLink, "isNew">[] }) {
  const [links, setLinks] = useState<SocialLink[]>(initial);
  const [platform, setPlatform] = useState("x");
  const [url, setUrl] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, startSave] = useTransition();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex(l => l.id === active.id);
    const newIndex = links.findIndex(l => l.id === over.id);
    setLinks(prev => arrayMove(prev, oldIndex, newIndex));
    setHasChanges(true);
  };

  const moveLink = (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= links.length) return;
    setLinks(prev => {
      const arr = [...prev];
      [arr[index], arr[next]] = [arr[next], arr[index]];
      return arr;
    });
    setHasChanges(true);
  };

  const handleAddLocal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (links.length >= 4) { setAddError("登録できるリンクは4つまでです"); return; }
    const validationError = validateSnsUrl(platform, url.trim());
    if (validationError) { setAddError(validationError); return; }
    setAddError(null);
    setLinks(prev => [...prev, { id: `temp-${Date.now()}`, platform, url: url.trim(), isNew: true }]);
    setUrl("");
    setHasChanges(true);
  };

  const handleDeleteLocal = (id: string) => {
    setLinks(prev => prev.filter(l => l.id !== id));
    setHasChanges(true);
  };

  const handleSave = () => {
    setSaveError(null);
    startSave(async () => {
      try {
        // 削除
        const removedIds = initial
          .filter(il => !links.find(sl => sl.id === il.id))
          .map(il => il.id);
        for (const id of removedIds) {
          await deleteSocialLink(id);
        }

        // 追加（tempIDを実IDに変換）
        const tempToReal: Record<string, string> = {};
        for (const link of links) {
          if (link.isNew) {
            const result = await upsertSocialLink(link.platform, link.url);
            if (result?.id) tempToReal[link.id] = result.id;
          }
        }

        // 並び替え
        const finalIds = links
          .filter(l => !l.isNew || tempToReal[l.id])
          .map(l => l.isNew ? tempToReal[l.id] : l.id);
        if (finalIds.length > 0) {
          await reorderSocialLinks(finalIds);
        }

        // isNew フラグを消してIDを実IDに更新
        const cleanLinks: SocialLink[] = links
          .filter(l => !l.isNew || tempToReal[l.id])
          .map(l => ({
            id: l.isNew ? tempToReal[l.id] : l.id,
            platform: l.platform,
            url: l.url,
          }));
        setLinks(cleanLinks);
        setHasChanges(false);

        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        router.refresh();
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : "エラーが発生しました");
      }
    });
  };

  return (
    <div className="space-y-4">
      {links.length > 0 && (
        <>
          {/* 横並びプレビュー */}
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-3">並び順（ドラッグまたは ‹ › で変更）</p>
            {mounted ? (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={links.map(l => l.id)} strategy={horizontalListSortingStrategy}>
                  <div className="flex justify-center gap-3">
                    {links.map((link, index) => (
                      <SortableIcon key={link.id} link={link} index={index} total={links.length} onMove={moveLink} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="flex justify-center gap-3">
                {links.map(link => (
                  <div key={link.id} className="glass-btn-secondary w-10 h-10 rounded-xl flex items-center justify-center">
                    <Image src={`/sns/${link.platform}.png`} alt={link.platform} width={28} height={28} className="object-contain" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* リンク一覧（削除用） */}
          <div className="space-y-2">
            {links.map(link => (
              <div key={link.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <Image src={`/sns/${link.platform}.png`} alt={link.platform} width={24} height={24} className="object-contain" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700">
                    {PLATFORMS.find(p => p.value === link.platform)?.label ?? link.platform}
                    {link.isNew && <span className="ml-1 text-pink-400">（未保存）</span>}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{link.url}</p>
                </div>
                <button
                  onClick={() => handleDeleteLocal(link.id)}
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 追加フォーム */}
      <form onSubmit={handleAddLocal} className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">リンクを追加</p>
          <p className="text-xs text-slate-400">{links.length} / 4</p>
        </div>
        {addError && <p className="text-xs text-red-500 font-semibold">{addError}</p>}
        <div>
          <label className="block text-xs text-slate-400 mb-1">プラットフォーム</label>
          <select value={platform} onChange={e => setPlatform(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200">
            {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">URL</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200" />
        </div>
        <button type="submit" disabled={!url.trim() || links.length >= 4}
          className="glass-btn-secondary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer">
          リストに追加
        </button>
      </form>

      {/* 保存 */}
      {saveError && <p className="text-xs text-red-500 text-center">{saveError}</p>}
      {hasChanges && !saved && (
        <p className="text-xs text-center brand-gradient-text font-semibold">保存するボタンを押すまで反映されません</p>
      )}
      <button
        type="button"
        onClick={handleSave}
        disabled={isSaving || !hasChanges}
        className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
      >
        {saved ? "保存しました ✓" : isSaving ? "保存中..." : "保存する"}
      </button>
    </div>
  );
}
