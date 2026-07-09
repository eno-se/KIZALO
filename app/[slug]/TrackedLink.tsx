"use client";

export default function TrackedLink({ href, creatorId, linkId, label, platform, children, className, style }: {
  href: string;
  creatorId: string;
  linkId: string;
  label: string;
  platform: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const track = () => {
    fetch("/api/link-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ creatorId, linkId, label, platform }),
    }).catch(() => {});
  };

  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={track} className={className} style={style}>
      {children}
    </a>
  );
}
