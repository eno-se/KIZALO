"use client";

import { useTransition } from "react";
import { adminBanUser, adminDeleteReport, adminSetCreatorVisibility } from "@/app/actions/admin";

type Report = {
  id: string;
  reason: string;
  createdAt: Date;
  reporter: { displayName: string | null; name: string | null };
  targetUser: {
    id: string;
    displayName: string | null;
    isBanned: boolean;
    isSuspended: boolean;
    creatorProfile: { id: string; slug: string; isPublic: boolean } | null;
    _count: { reportsReceived: number };
  };
};

export default function AdminReportRow({ report }: { report: Report }) {
  const [isPending, startTransition] = useTransition();
  const { targetUser } = report;
  const slug = targetUser.creatorProfile?.slug;
  const isPublic = targetUser.creatorProfile?.isPublic ?? false;
  const reporterName = report.reporter.displayName ?? report.reporter.name ?? "不明";

  return (
    <tr className={`${targetUser.isBanned ? "bg-red-50/40" : ""}`}>
      {/* 名前 / ID */}
      <td className="px-4 py-3">
        <p className="font-semibold text-slate-700">{targetUser.displayName ?? "名無し"}</p>
        {slug ? (
          <a href={`/${slug}`} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 hover:underline">
            @{slug}
          </a>
        ) : (
          <span className="text-xs text-slate-400">プロフなし</span>
        )}
        {targetUser.isBanned && <span className="ml-1 text-xs text-red-500 font-bold">BAN</span>}
      </td>

      {/* 通報理由 */}
      <td className="px-4 py-3 text-slate-600">{report.reason}</td>

      {/* 通報数 */}
      <td className="px-4 py-3 text-center">
        <span className="text-sm font-bold text-slate-700">{targetUser._count.reportsReceived}</span>
      </td>

      {/* 通報者 */}
      <td className="px-4 py-3 text-slate-500 text-xs">{reporterName}</td>

      {/* 日時 */}
      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
        {new Date(report.createdAt).toLocaleDateString("ja-JP")}
      </td>

      {/* 操作 */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 justify-center flex-wrap">
          {/* 非表示 */}
          {targetUser.creatorProfile && (
            <button
              disabled={isPending}
              onClick={() => startTransition(() =>
                adminSetCreatorVisibility(targetUser.creatorProfile!.id, !isPublic)
              )}
              className={`px-2 py-1 rounded text-xs font-semibold disabled:opacity-50 ${
                isPublic
                  ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  : "bg-orange-100 text-orange-600 hover:bg-orange-200"
              }`}
            >
              {isPublic ? "非表示" : "表示に戻す"}
            </button>
          )}

          {/* BAN */}
          <button
            disabled={isPending}
            onClick={() => startTransition(() => adminBanUser(targetUser.id, !targetUser.isBanned))}
            className={`px-2 py-1 rounded text-xs font-semibold disabled:opacity-50 ${
              targetUser.isBanned
                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                : "bg-red-100 text-red-600 hover:bg-red-200"
            }`}
          >
            {targetUser.isBanned ? "BAN解除" : "BAN"}
          </button>

          {/* 通報削除 */}
          <button
            disabled={isPending}
            onClick={() => startTransition(() => adminDeleteReport(report.id))}
            className="px-2 py-1 rounded text-xs font-semibold bg-slate-50 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </td>
    </tr>
  );
}
