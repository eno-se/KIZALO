import { db } from "@/lib/db";
import AdminReportRow from "./AdminReportRow";

export default async function AdminReportsPage() {
  const reports = await db.report.findMany({
    include: {
      reporter: { select: { displayName: true, name: true } },
      targetUser: {
        select: {
          id: true,
          displayName: true,
          isBanned: true,
          isSuspended: true,
          creatorProfile: { select: { id: true, slug: true, isPublic: true } },
          _count: { select: { reportsReceived: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">通報一覧</h1>
      {reports.length === 0 ? (
        <p className="text-slate-400 text-sm">通報はありません</p>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs">
              <tr>
                <th className="text-left px-4 py-3">名前 / ID</th>
                <th className="text-left px-4 py-3">通報理由</th>
                <th className="text-center px-4 py-3">通報数</th>
                <th className="text-left px-4 py-3">通報者</th>
                <th className="text-left px-4 py-3">日時</th>
                <th className="text-center px-4 py-3">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reports.map((r) => (
                <AdminReportRow key={r.id} report={r} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
