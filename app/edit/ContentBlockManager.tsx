"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { addContentBlock, deleteContentBlock, reorderContentBlocks } from "@/app/actions/content-blocks";
import ContentBlockForm, { type RankingSettings } from "./ContentBlockForm";

type Block = {
  id: string;
  type: string;
  title: string | null;
  caption: string | null;
  url: string | null;
  imageUrl: string | null;
  link: string | null;
};

const TYPE_LABELS: Record<string, string> = {
  youtube: "YouTube動画",
  image: "画像",
  text: "テキスト",
  applemusic: "Apple Music",
  spotify: "Spotify",
  timetree: "タイムツリー",
  ranking: "ランキングカード",
};

const ALL_TYPES = ["youtube", "image", "text", "applemusic", "spotify", "timetree", "ranking"] as const;

// ── KIZALOカラーSVGアイコン ──────────────────────────────────────────

// グラデーション定義は1か所だけ（hidden SVG）でまとめて定義する
// 各アイコンSVGから url(#kizalo-block-grad) で参照
const GRAD_ID = "kizalo-block-grad";

function KizaloGradientDefs() {
  return (
    <svg width="0" height="0" style={{ position: "absolute", overflow: "hidden" }} aria-hidden>
      <defs>
        <linearGradient id={GRAD_ID} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F58BCB" />
          <stop offset="50%" stopColor="#B98AF5" />
          <stop offset="100%" stopColor="#7DB7FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BlockTypeIcon({ type, size = 20 }: { type: string; size?: number }) {
  const g = `url(#${GRAD_ID})`;
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none" } as const;
  switch (type) {
    case "youtube":
      return <svg {...p}><polygon points="5,3 19,12 5,21" fill={g} /></svg>;
    case "image":
      return (
        <svg {...p}>
          {/* 外枠 */}
          <rect x="3" y="3" width="18" height="18" rx="3" fill={g} />
          {/* 内側を白抜き */}
          <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="white" fillOpacity="0.9" />
          {/* 太陽（円） */}
          <circle cx="8.5" cy="8.5" r="1.8" fill={g} />
          {/* 山（三角ポリゴン） */}
          <polygon points="4.5,17.5 9,12 13,15.5 16,12.5 19.5,17.5" fill={g} />
        </svg>
      );
    case "text":
      return (
        <svg {...p}>
          <rect x="4" y="6" width="16" height="2.5" rx="1.25" fill={g} />
          <rect x="4" y="11" width="16" height="2.5" rx="1.25" fill={g} />
          <rect x="4" y="16" width="10" height="2.5" rx="1.25" fill={g} />
        </svg>
      );
    case "applemusic":
      return (
        <svg {...p}>
          {/* 音符の柱（太めの filled rect） */}
          <rect x="8" y="5.5" width="2.5" height="13" rx="1.25" fill={g} />
          <rect x="14" y="3.5" width="2.5" height="13" rx="1.25" fill={g} />
          {/* 横線でつなぐ */}
          <rect x="8" y="5.5" width="9" height="2.5" rx="1.25" fill={g} />
          {/* 音符の丸 */}
          <circle cx="9.25" cy="18.5" r="3" fill={g} />
          <circle cx="15.25" cy="16.5" r="3" fill={g} />
        </svg>
      );
    case "spotify":
      return (
        <svg {...p}>
          {/* 背景円 */}
          <circle cx="12" cy="12" r="10" fill={g} />
          {/* 音波を白抜き rect で表現 */}
          <rect x="6"   y="9"    width="12" height="2" rx="1" fill="white" />
          <rect x="7"   y="13"   width="10" height="2" rx="1" fill="white" />
          <rect x="8.5" y="17"   width="7"  height="2" rx="1" fill="white" />
        </svg>
      );
    case "timetree":
      return (
        <svg {...p}>
          {/* 本体 */}
          <rect x="3" y="5" width="18" height="17" rx="2" fill={g} />
          {/* 日付エリアを白抜き */}
          <rect x="4" y="10" width="16" height="11" rx="1" fill="white" fillOpacity="0.9" />
          {/* リング（上部） */}
          <rect x="7.5" y="3" width="2.5" height="5" rx="1.25" fill={g} />
          <rect x="14" y="3" width="2.5" height="5" rx="1.25" fill={g} />
          {/* 日付マス */}
          <rect x="6"    y="12" width="3" height="2.5" rx="0.5" fill={g} />
          <rect x="10.5" y="12" width="3" height="2.5" rx="0.5" fill={g} />
          <rect x="15"   y="12" width="3" height="2.5" rx="0.5" fill={g} />
          <rect x="6"    y="16" width="3" height="2.5" rx="0.5" fill={g} />
          <rect x="10.5" y="16" width="3" height="2.5" rx="0.5" fill={g} />
        </svg>
      );
    case "ranking":
      return (
        <svg {...p}>
          {/* カップ本体 */}
          <path d="M7 3h10l-1.5 9A4.5 4.5 0 0 1 7 12H7a4.5 4.5 0 0 1-4.5-4.5L2 3H7z" fill={g} />
          {/* 取っ手（左右） */}
          <path d="M2 3c-1 0-2 1-2 2.5S1 8 2 8" fill={g} />
          <path d="M22 3c1 0 2 1 2 2.5S23 8 22 8" fill={g} />
          {/* 台座 */}
          <rect x="9.5" y="16" width="5" height="2" rx="1" fill={g} />
          <rect x="7"   y="18" width="10" height="2.5" rx="1" fill={g} />
          {/* 柱 */}
          <rect x="11" y="12" width="2" height="4.5" rx="1" fill={g} />
          {/* 星（上） */}
          <polygon points="12,4 12.7,6.2 15,6.2 13.2,7.5 13.9,9.7 12,8.4 10.1,9.7 10.8,7.5 9,6.2 11.3,6.2" fill="white" fillOpacity="0.9" />
        </svg>
      );
    default:
      return null;
  }
}

// ── ソータブルアイテム ────────────────────────────────────────────────

function SortableBlockItem({
  block,
  onDelete,
  rankingSettings,
}: {
  block: Block;
  onDelete: (id: string) => void;
  rankingSettings?: RankingSettings;
}) {
  const [open, setOpen] = useState(false);
  const [deleting, startDeleteTransition] = useTransition();

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const handleDelete = () => {
    if (!confirm(`「${TYPE_LABELS[block.type] ?? block.type}」を削除しますか？\nブロックの設定もすべて削除されます。`)) return;
    startDeleteTransition(async () => {
      await deleteContentBlock(block.id);
      onDelete(block.id);
    });
  };

  const summary = block.url || block.imageUrl
    ? "設定済み"
    : (block.title || block.caption) ? "設定済み" : "未設定";

  return (
    <div ref={setNodeRef} style={style} className="glass-card rounded-2xl overflow-hidden relative">
      {/* 削除中オーバーレイ */}
      {deleting && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-sm">
          <p className="text-sm font-bold text-slate-500">削除中...</p>
        </div>
      )}
      {/* ヘッダー行 */}
      <div className="flex items-center gap-2 px-4 py-3">
        {/* ドラッグハンドル */}
        <button
          {...attributes}
          {...listeners}
          suppressHydrationWarning
          className="flex-shrink-0 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
          aria-label="並び替え"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
            <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
            <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
          </svg>
        </button>

        {/* タイプ名・サマリー（クリックで展開） */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-1 min-w-0 text-left flex items-center gap-2"
        >
          <BlockTypeIcon type={block.type} size={16} />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-500">
              {TYPE_LABELS[block.type] ?? block.type}
            </p>
            {!open && (
              <p className="text-sm font-semibold text-slate-700 truncate">{summary}</p>
            )}
          </div>
        </button>

        {/* 削除ボタン */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-300 hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
          aria-label="削除"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* 展開/折り畳みシェブロン */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex-shrink-0 text-slate-400"
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* フォーム本体 */}
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="pt-4">
            <ContentBlockForm block={block} rankingSettings={rankingSettings} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── 型ピッカーモーダル ────────────────────────────────────────────────

function TypePickerModal({
  onSelect,
  onClose,
}: {
  onSelect: (type: string) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg mx-auto rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ background: "linear-gradient(160deg, #fff 0%, #fdf4fb 50%, #f4f0ff 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* トップグラデーションライン */}
        <div className="h-[3px]" style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }} />

        {/* ハンドルバー */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: "linear-gradient(90deg, #F58BCB, #B98AF5, #7DB7FF)" }}
          />
        </div>

        {/* タイトル */}
        <p className="text-sm font-bold brand-gradient-text text-center pt-3 pb-1">
          コンテンツを追加
        </p>
        <p className="text-xs text-slate-400 text-center mb-4">追加するコンテンツの種類を選んでください</p>

        {/* グリッド */}
        <div className="grid grid-cols-2 gap-2.5 px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          {ALL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all active:scale-95"
              style={{
                background: "rgba(255,255,255,0.8)",
                border: "1px solid rgba(185,138,245,0.18)",
                boxShadow: "0 2px 12px rgba(185,138,245,0.10)",
                backdropFilter: "blur(8px)",
              }}
            >
              {/* アイコン背景 */}
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, rgba(245,139,203,0.15) 0%, rgba(185,138,245,0.18) 50%, rgba(125,183,255,0.15) 100%)" }}
              >
                <BlockTypeIcon type={type} size={20} />
              </div>
              <span className="text-sm font-semibold text-slate-700 leading-tight">{TYPE_LABELS[type]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── メインコンポーネント ──────────────────────────────────────────────

export default function ContentBlockManager({
  initialBlocks,
  rankingSettings,
}: {
  initialBlocks: Block[];
  rankingSettings: RankingSettings;
}) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [showPicker, setShowPicker] = useState(false);
  const [adding, startAddTransition] = useTransition();
  const [reordering, startReorderTransition] = useTransition();

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = blocks.findIndex((b) => b.id === active.id);
    const newIndex = blocks.findIndex((b) => b.id === over.id);
    const newBlocks = arrayMove(blocks, oldIndex, newIndex);
    setBlocks(newBlocks);

    startReorderTransition(async () => {
      await reorderContentBlocks(newBlocks.map((b) => b.id));
    });
  };

  const handleAddType = (type: string) => {
    setShowPicker(false);
    startAddTransition(async () => {
      const res = await addContentBlock(type as never);
      if (res?.error) { alert(res.error); return; }
      if (res?.success && res.id) {
        setBlocks((prev) => [
          ...prev,
          { id: res.id!, type, title: null, caption: null, url: null, imageUrl: null, link: null },
        ]);
      }
    });
  };

  const handleDelete = (id: string) => {
    setBlocks((prev) => {
      const filtered = prev.filter((b) => b.id !== id);
      return filtered;
    });
  };

  return (
    <div className="space-y-2">
      {/* グラデーション定義（1回だけ、リスト側のアイコン用） */}
      <KizaloGradientDefs />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
          {blocks.map((block) => (
            <SortableBlockItem
              key={block.id}
              block={block}
              onDelete={handleDelete}
              rankingSettings={block.type === "ranking" ? rankingSettings : undefined}
            />
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-4">
          まだコンテンツがありません。下のボタンから追加してください。
        </p>
      )}

      {/* 追加ボタン */}
      <button
        onClick={() => setShowPicker(true)}
        disabled={blocks.length >= 5 || adding}
        className="glass-btn-secondary w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="text-lg leading-none">+</span>
        {adding ? "追加中..." : blocks.length >= 5 ? "コンテンツは最大5個まで" : "コンテンツを追加する"}
      </button>

      {showPicker && (
        <TypePickerModal onSelect={handleAddType} onClose={() => setShowPicker(false)} />
      )}
    </div>
  );
}
