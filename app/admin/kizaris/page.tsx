import { db } from "@/lib/db";

export default async function AdminKizarisPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; creator?: string }>;
}) {
  const { date, creator } = await searchParams;

  const kizaris = await db.kizari.findMany({
    where: {
      ...(date ? { date } : {}),
      ...(creator
        ? { creator: { OR: [{ slug: { contains: creator, mode: "insensitive" } }, { displayName: { contains: creator, mode: "insensitive" } }] } }
        : {}),
    },
    include: {
      fan: { select: { displayName: true, email: true } },
      creator: { select: { slug: true, displayName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">刻みログ</h1>
      <form className="flex gap-3 mb-4">
        <input
          name="date"
          defaultValue={date}
          placeholder="日付 (YYYY-MM-DD)"
          className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#B98AF5] bg-white w-48"
        />
        <input
          name="creator"
          defaultValue={creator}
          placeholder="クリエイター名・スラッグ"
          className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#B98AF5] bg-white"
        />
        <button type="submit" className="px-4 py-2.5 rounded-xl bg-slate-800 text-white text-sm font-medium hover:bg-slate-700 transition-colors">
          絞り込む
        </button>
      </form>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 text-left">
              <th className="px-4 py-3 font-medium">日時</th>
              <th className="px-4 py-3 font-medium">ファン</th>
              <th className="px-4 py-3 font-medium">クリエイター</th>
              <th className="px-4 py-3 font-medium">日付</th>
            </tr>
          </thead>
          <tbody>
            {kizaris.map((k) => (
              <tr key={k.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-2.5 text-slate-400 text-xs">
                  {new Date(k.createdAt).toLocaleString("ja-JP", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-sm text-slate-700">{k.fan.displayName ?? k.fan.email ?? "—"}</p>
                </td>
                <td className="px-4 py-2.5">
                  <a href={`/${k.creator.slug}`} target="_blank" className="text-[#B98AF5] hover:underline text-sm">
                    {k.creator.displayName}
                  </a>
                  <span className="text-xs text-slate-400 ml-1">/{k.creator.slug}</span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-400 font-mono">{k.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {kizaris.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-12">データなし</p>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">{kizaris.length} 件表示（最大200件）</p>
    </div>
  );
}
