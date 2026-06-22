"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";


function PersonIcon({ active }: { active: boolean }) {
  const stroke = active ? "url(#nav-grad)" : "#94a3b8";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <defs>
        <linearGradient id="nav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F58BCB" />
          <stop offset="50%" stopColor="#B98AF5" />
          <stop offset="100%" stopColor="#7DB7FF" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function DashboardIcon({ active }: { active: boolean }) {
  const stroke = active ? "url(#nav-grad)" : "#94a3b8";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="9" rx="1" />
      <rect x="10" y="7" width="4" height="14" rx="1" />
      <rect x="17" y="3" width="4" height="18" rx="1" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const stroke = active ? "url(#nav-grad)" : "#94a3b8";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function BottomNav({ mySlug }: { mySlug: string | null }) {
  const pathname = usePathname();
  const myPageHref = mySlug ? `/${mySlug}` : "/me";
  const myPageActive = mySlug ? pathname === `/${mySlug}` : pathname === "/me";

  const dashboardActive = pathname === "/dashboard";
  const settingsActive = pathname === "/me";

  const items = [
    { label: "マイページ", href: myPageHref, active: myPageActive, icon: <PersonIcon active={myPageActive} /> },
    { label: "ダッシュボード", href: "/dashboard", active: dashboardActive, icon: <DashboardIcon active={dashboardActive} /> },
    { label: "設定", href: "/me", active: settingsActive, icon: <SettingsIcon active={settingsActive} /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-header">
      <div className="max-w-lg mx-auto flex items-center justify-around px-8 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="flex flex-col items-center gap-0.5 min-w-[56px]"
          >
            {item.icon}
            <span
              className="text-[0.6rem] font-semibold"
              style={item.active ? {
                background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              } : { color: "#94a3b8" }}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
