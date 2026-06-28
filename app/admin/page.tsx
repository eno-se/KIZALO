import { db } from "@/lib/db";
import { getJstDateString, getJstYesterdayString } from "@/lib/jst";

export default async function AdminPage() {
  const today = getJstDateString();
  const yesterday = getJstYesterdayString();

  const [userCount, kizariToday, kizariYesterday, kizariTotal] = await Promise.all([
    db.user.count(),
    db.kizari.count({ where: { date: today } }),
    db.kizari.count({ where: { date: yesterday } }),
    db.kizari.count(),
  ]);

  const stats = [
    { label: "登録ユーザー数", value: userCount, color: "#F58BCB" },
    { label: "本日の刻み", value: kizariToday, color: "#B98AF5" },
    { label: "昨日の刻み", value: kizariYesterday, color: "#7DB7FF" },
    { label: "累計刻み数", value: kizariTotal, color: "#F58BCB" },
    { label: "通報件数", value: 0, color: "#94a3b8" },
  ];

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">ダッシュボード</h1>
      <div className="grid grid-cols-5 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl px-5 py-4 shadow-sm border border-slate-100">
            <p className="text-xs text-slate-500 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
