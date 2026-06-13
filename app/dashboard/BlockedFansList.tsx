"use client";

import { useTransition } from "react";
import { unblockFan } from "@/app/actions/creator";
import { useRouter } from "next/navigation";

type Fan = { id: string; displayName: string | null; name: string | null };
type Blocked = { id: string; fanId: string; fan: Fan };

export default function BlockedFansList({ blockedFans }: { blockedFans: Blocked[] }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (blockedFans.length === 0) {
    return <p className="text-xs text-slate-400">ブロック中のユーザーはいません</p>;
  }

  return (
    <div className="space-y-2">
      {blockedFans.map((b) => (
        <div key={b.id} className="flex items-center justify-between text-sm">
          <span className="text-slate-700">{b.fan.displayName ?? b.fan.name ?? "名無し"}</span>
          <button
            onClick={() =>
              startTransition(async () => {
                await unblockFan(b.fanId);
                router.refresh();
              })
            }
            disabled={isPending}
            className="text-xs text-violet-500 hover:underline cursor-pointer"
          >
            解除
          </button>
        </div>
      ))}
    </div>
  );
}
