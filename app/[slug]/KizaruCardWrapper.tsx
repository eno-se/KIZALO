"use client";

import { useKizaruPending } from "./KizaruContext";

export default function KizaruCardWrapper({ children }: { children: React.ReactNode }) {
  const isPending = useKizaruPending();

  return (
    <div className="relative mt-4">
      {children}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-10" style={{ background: "rgba(255,255,255,0.6)" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loading.gif" alt="loading" style={{ width: 48, height: 48 }} />
        </div>
      )}
    </div>
  );
}
