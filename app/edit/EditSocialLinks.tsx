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
  verticalListSortingStrategy,
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

type SocialLink = { id: string; platform: string; url: string };

function SortableLink({ link, onDelete, isDeleting }: { link: SocialLink; onDelete: () => void; isDeleting: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: link.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/60 border border-slate-100">
      {/* ドラッグハンドル */}
      <button
        type="button"
        className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500"
        {...attributes}
        {...listeners}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <rect x="3" y="3" width="10" height="1.5" rx="0.75" />
          <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" />
          <rect x="3" y="11.5" width="10" height="1.5" rx="0.75" />
        </svg>
      </button>
      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center flex-shrink-0 border border-slate-100">
        <Image src={`/sns/${link.platform}.png`} alt={link.platform} width={24} height={24} className="object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-slate-700">
          {PLATFORMS.find((p) => p.value === link.platform)?.label ?? link.platform}
        </p>
        <p className="text-xs text-slate-400 truncate">{link.url}</p>
      </div>
      <button
        onClick={onDelete}
        disabled={isDeleting}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-50 cursor-pointer"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

export default function EditSocialLinks({ socialLinks: initial }: { socialLinks: SocialLink[] }) {
  const [links, setLinks] = useState(initial);
  const [platform, setPlatform] = useState("x");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAdding, startAdd] = useTransition();
  const [isDeleting, startDelete] = useTransition();
  const [isReordering, startReorder] = useTransition();
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = links.findIndex((l) => l.id === active.id);
    const newIndex = links.findIndex((l) => l.id === over.id);
    const newLinks = arrayMove(links, oldIndex, newIndex);
    setLinks(newLinks);
    startReorder(async () => {
      await reorderSocialLinks(newLinks.map((l) => l.id));
    });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    if (links.length >= 4) {
      setError("登録できるリンクは4つまでです");
      return;
    }
    const validationError = validateSnsUrl(platform, url.trim());
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    startAdd(async () => {
      await upsertSocialLink(platform, url.trim());
      setUrl("");
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
    startDelete(async () => {
      await deleteSocialLink(id);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {/* 登録済みリンク */}
      {links.length > 0 && (
        mounted ? (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={links.map((l) => l.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {links.map((link) => (
                  <SortableLink
                    key={link.id}
                    link={link}
                    onDelete={() => handleDelete(link.id)}
                    isDeleting={isDeleting}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        ) : (
          <div className="space-y-2">
            {links.map((link) => (
              <SortableLink
                key={link.id}
                link={link}
                onDelete={() => handleDelete(link.id)}
                isDeleting={isDeleting}
              />
            ))}
          </div>
        )
      )}
      {isReordering && <p className="text-xs text-slate-400 text-center">並び替え中...</p>}

      {/* 追加フォーム */}
      <form onSubmit={handleAdd} className="space-y-3 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-slate-500">リンクを追加</p>
          <p className="text-xs text-slate-400">{links.length} / 4</p>
        </div>
        {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
        <div>
          <label className="block text-xs text-slate-400 mb-1">プラットフォーム</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          >
            {PLATFORMS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-pink-200"
          />
        </div>
        <button
          type="submit"
          disabled={isAdding || !url.trim()}
          className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer"
        >
          {isAdding ? "追加中..." : "追加する"}
        </button>
      </form>
    </div>
  );
}
