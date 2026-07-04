"use client";

import { useState } from "react";
import Image from "next/image";

export default function FeaturedImageCard({
  imageUrl,
  title,
  caption,
  link,
  creatorId,
  blockId,
}: {
  imageUrl: string;
  title: string | null;
  caption: string | null;
  link: string | null;
  creatorId?: string;
  blockId?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (link) {
      if (creatorId && blockId) {
        fetch("/api/link-click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            creatorId,
            linkId: blockId,
            label: title || "画像",
            platform: "block-image",
          }),
        }).catch(() => {});
      }
      window.open(link, "_blank", "noopener,noreferrer");
    } else {
      setOpen(true);
    }
  };

  return (
    <>
      <div className="glass-card rounded-2xl overflow-hidden">
        {title && (
          <h2 className="relative z-[1] text-xs font-bold brand-gradient-text text-center pt-4 pb-3 flex items-center justify-center gap-1.5">
            <span className="sparkle" />{title}<span className="sparkle" />
          </h2>
        )}
        <button
          type="button"
          onClick={handleClick}
          className="relative z-[1] w-full block"
          style={{ cursor: link ? "pointer" : "zoom-in" }}
        >
          <Image
            src={imageUrl}
            alt={title ?? "画像"}
            width={600}
            height={400}
            className="w-full h-auto"
            unoptimized
          />
        </button>
        {caption && (
          <p className="relative z-[1] px-4 py-3 text-xs text-slate-600 whitespace-pre-wrap leading-relaxed">{caption}</p>
        )}
      </div>

      {/* Lightbox */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute top-4 right-4 text-white text-2xl font-bold w-10 h-10 flex items-center justify-center"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <div
            className="max-w-[92vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imageUrl}
              alt={title ?? "画像"}
              width={1200}
              height={900}
              className="max-w-[92vw] max-h-[90vh] w-auto h-auto object-contain rounded-xl"
              unoptimized
            />
          </div>
        </div>
      )}
    </>
  );
}
