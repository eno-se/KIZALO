import { requireAdmin } from "@/lib/admin";
import AdminNav from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen flex" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside
        className="w-56 flex-shrink-0 fixed top-0 left-0 h-full flex flex-col"
        style={{ background: "#0f172a", borderRight: "1px solid #1e293b" }}
      >
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-center gap-2">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ background: "linear-gradient(135deg, #F58BCB, #B98AF5)" }}
            >
              ADMIN
            </span>
            <span className="text-white font-bold text-sm">KIZALO</span>
          </div>
        </div>
        <AdminNav />
        <div className="mt-auto px-5 py-4">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
            ← サイトに戻る
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 min-h-screen p-8">
        {children}
      </main>
    </div>
  );
}
