"use client";

import { useEffect, useState } from "react";

function smoothstep(edge0: number, edge1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function generateDisplacementMap(size = 512): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.createImageData(size, size);
  const edgeWidth = 0.18;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size;
      const ny = y / size;

      const nearL = 1 - smoothstep(0, edgeWidth, nx);
      const nearR = 1 - smoothstep(0, edgeWidth, 1 - nx);
      const nearT = 1 - smoothstep(0, edgeWidth, ny);
      const nearB = 1 - smoothstep(0, edgeWidth, 1 - ny);

      const dx = -nearL + nearR;
      const dy = -nearT + nearB;

      const i = (y * size + x) * 4;
      imageData.data[i]     = Math.round(Math.max(0, Math.min(255, 128 + dx * 80)));
      imageData.data[i + 1] = Math.round(Math.max(0, Math.min(255, 128 + dy * 80)));
      imageData.data[i + 2] = 0;
      imageData.data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export default function LiquidGlassFilter() {
  const [dispUrl, setDispUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = generateDisplacementMap(512);
    setDispUrl(url);

    if (CSS.supports("backdrop-filter", "url(#lg-filter)")) {
      document.documentElement.classList.add("supports-liquid-glass");
    }
  }, []);

  return (
    <svg style={{ display: "none" }} aria-hidden="true">
      <defs>
        <filter
          id="lg-filter"
          x="-30%"
          y="-30%"
          width="160%"
          height="160%"
          colorInterpolationFilters="sRGB"
        >
          {dispUrl && (
            <feImage href={dispUrl} result="disp" preserveAspectRatio="none" />
          )}
          <feDisplacementMap
            in="SourceGraphic"
            in2="disp"
            scale="18"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
