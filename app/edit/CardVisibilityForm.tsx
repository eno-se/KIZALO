"use client";

import { useState, useTransition, useEffect } from "react";
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
import { updateCardVisibility } from "@/app/actions/creator";

type CardKey = "fastest" | "random";

const CARD_META: Record<CardKey, { label: string; description: string }> = {
  fastest: {
    label: "今日○○に最速で刻んだ人",
    description: "毎日いち早く刻んでくれる、熱量の高いファンを最大6名アピールできます",
  },
  random: {
    label: "今日○○に刻んだ人（ランダム）",
    description: "今日刻ってくれたファンを最大6名ランダムに紹介。すべてのファンに表示チャンスがあります",
  },
};

function parseOrder(raw: string | undefined | null): CardKey[] {
  const keys = (raw ?? "fastest,random").split(",").map((s) => s.trim()) as CardKey[];
  const valid: CardKey[] = ["fastest", "random"];
  const filtered = keys.filter((k) => valid.includes(k));
  for (const k of valid) {
    if (!filtered.includes(k)) filtered.push(k);
  }
  return filtered;
}

type Props = {
  showFastestCard: boolean;
  showRandomCard: boolean;
  cardOrder?: string | null;
};

function SortableCard({
  id,
  visibility,
  onToggle,
}: {
  id: CardKey;
  visibility: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const { label, description } = CARD_META[id];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="space-y-1 pb-3 border-b border-slate-100 last:border-0 last:pb-0"
    >
      <div className="flex items-center gap-2 px-1">
        <button
          type="button"
          className="flex-shrink-0 touch-none cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-slate-500"
          {...attributes}
          {...listeners}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="3" width="10" height="1.5" rx="0.75" />
            <rect x="3" y="7.25" width="10" height="1.5" rx="0.75" />
            <rect x="3" y="11.5" width="10" height="1.5" rx="0.75" />
          </svg>
        </button>

        <span className="text-sm text-slate-700 flex-1">{label}</span>

        <button
          type="button"
          onClick={onToggle}
          className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${visibility ? "bg-pink-400" : "bg-slate-200"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${visibility ? "translate-x-5" : "translate-x-0"}`}
          />
        </button>
      </div>
      <p className="text-xs text-slate-400 px-1 pl-9">{description}</p>
    </div>
  );
}

export default function CardVisibilityForm({ showFastestCard, showRandomCard, cardOrder }: Props) {
  const [order, setOrder] = useState<CardKey[]>(() => parseOrder(cardOrder));
  const [visibility, setVisibility] = useState<Record<CardKey, boolean>>({
    fastest: showFastestCard,
    random: showRandomCard,
  });
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrder((prev) => {
      const oldIndex = prev.indexOf(active.id as CardKey);
      const newIndex = prev.indexOf(over.id as CardKey);
      return arrayMove(prev, oldIndex, newIndex);
    });
    setDirty(true);
  };

  const handleToggle = (key: CardKey) => {
    setVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    setDirty(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      await updateCardVisibility({
        showFastestCard: visibility.fastest,
        showRandomCard: visibility.random,
        cardOrder: order.join(","),
      });
      setDirty(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  };

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={order} strategy={verticalListSortingStrategy}>
          {order.map((key) => (
            <SortableCard
              key={key}
              id={key}
              visibility={visibility[key]}
              onToggle={() => handleToggle(key)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {(dirty || saved) && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="glass-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 cursor-pointer mt-1"
        >
          {saved ? "保存しました ✓" : isPending ? "保存中..." : "保存する"}
        </button>
      )}
    </div>
  );
}
