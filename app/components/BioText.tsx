"use client";

import { useState } from "react";

const MD_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const COLLAPSE_THRESHOLD = 4;

type Props = { text: string };

function renderLine(line: string, idx: number) {
  if (MD_LINK_REGEX.test(line)) {
    MD_LINK_REGEX.lastIndex = 0;
    const match = MD_LINK_REGEX.exec(line);
    if (match) {
      return (
        <div key={idx}>
          <a
            href={match[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 glass-btn-secondary px-3 py-1 rounded-full text-[#B98AF5] font-medium"
            style={{ fontSize: "0.65rem" }}
          >
            {match[1]} →
          </a>
        </div>
      );
    }
  }

  if (URL_REGEX.test(line)) {
    URL_REGEX.lastIndex = 0;
    return (
      <p key={idx} className="text-slate-500">
        {line.split(/(https?:\/\/[^\s]+)/).map((part, i) =>
          /^https?:\/\//.test(part) ? (
            <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#B98AF5] underline break-all">{part}</a>
          ) : part
        )}
      </p>
    );
  }

  return <p key={idx} className="text-slate-500">{line}</p>;
}

export default function BioText({ text }: Props) {
  const [expanded, setExpanded] = useState(false);
  const lines = text.split("\n");
  const needsCollapse = lines.length >= COLLAPSE_THRESHOLD;
  const visibleLines = needsCollapse && !expanded ? lines.slice(0, 3) : lines;

  return (
    <div className="text-center space-y-1" style={{ fontSize: "0.65rem" }}>
      {visibleLines.map((line, idx) => renderLine(line, idx))}
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs brand-gradient-text font-semibold mt-1"
        >
          {expanded ? "折りたたむ" : "もっと見る"}
        </button>
      )}
    </div>
  );
}
