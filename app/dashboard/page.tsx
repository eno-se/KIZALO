import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getJstDateString } from "@/lib/jst";
import Analytics from "./Analytics";

const JST = 9 * 60 * 60 * 1000;

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { displayName: true, creatorProfile: { select: { id: true } } },
  });

  if (!user) redirect("/login");
  if (!user.displayName) redirect("/setup");

  if (!user.creatorProfile) {
    return (
      <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
        <div className="mb-6"><h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1></div>
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-500 mb-3">まだ推しページが作成されていません</p>
          <a href="/edit" className="glass-btn-primary inline-block px-6 py-2.5 rounded-xl text-sm font-semibold">ページを作成する</a>
        </div>
      </div>
    );
  }

  // 日付計算のみ（DBクエリなし）
  const jstNow = Date.now() + JST;
  const todayStr = getJstDateString();
  const jstDate = new Date(jstNow);
  const currentYear = jstDate.getUTCFullYear();
  const currentMonth = jstDate.getUTCMonth();
  const todayDow = jstDate.getUTCDay();
  const daysFromMonday = (todayDow - 1 + 7) % 7;
  const mondayMs = jstNow - daysFromMonday * 24 * 60 * 60 * 1000;
  const initialWeekStart = new Date(mondayMs).toISOString().slice(0, 10);
  const initialMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}`;

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-800">ダッシュボード</h1>
      </div>
      <div className="space-y-4">
        <Analytics
          initialDate={todayStr}
          initialWeekStart={initialWeekStart}
          initialMonth={initialMonth}
          initialYear={currentYear}
        />
      </div>
    </div>
  );
}
