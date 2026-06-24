"use client";

import { useRef, useEffect, useState } from "react";

export default function FanNameMarquee({ name, className }: { name: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (el) setOverflow(el.scrollWidth > el.clientWidth);
  }, [name]);

  return (
    <div ref={containerRef} className="overflow-hidden flex-1 min-w-0">
      <span className={`whitespace-nowrap ${overflow ? "fan-name-marquee" : ""} ${className ?? ""}`}>
        {overflow ? `${name}　　　${name}　　　` : name}
      </span>
    </div>
  );
}
