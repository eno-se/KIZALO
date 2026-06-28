"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "概要", icon: "📊" },
  { href: "/admin/users", label: "ユーザー", icon: "👤" },
  { href: "/admin/kizaris", label: "刻みログ", icon: "✂️" },
  { href: "/admin/reports", label: "通報", icon: "🚨" },
  { href: "/admin/announcements", label: "お知らせ", icon: "📢" },
  { href: "/admin/inquiries", label: "問い合わせ", icon: "💬" },
  { href: "/admin/permissions", label: "権限管理", icon: "🔑" },
  { href: "/admin/logs", label: "システムログ", icon: "📋" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 mt-6">
      {NAV_ITEMS.map(({ href, label, icon }) => {
        const isActive = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors"
            style={
              isActive
                ? { background: "linear-gradient(135deg, rgba(245,139,203,0.15), rgba(185,138,245,0.15))", color: "#F58BCB", fontWeight: 600 }
                : { color: "#94a3b8" }
            }
          >
            <span>{icon}</span>
            <span>{label}</span>
            {isActive && <span className="ml-auto w-1 h-1 rounded-full bg-[#F58BCB]" />}
          </Link>
        );
      })}
    </nav>
  );
}
