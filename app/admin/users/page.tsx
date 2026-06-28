import { db } from "@/lib/db";
import AdminUserRow from "./AdminUserRow";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const users = await db.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { displayName: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { creatorProfile: { slug: { contains: q, mode: "insensitive" } } },
          ],
        }
      : undefined,
    include: {
      creatorProfile: {
        include: { _count: { select: { kizaris: true, fans: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-6">ユーザー管理</h1>
      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="メール・名前・スラッグで検索..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#B98AF5] bg-white"
        />
      </form>
      <div className="flex flex-col gap-2">
        {users.map((user) => (
          <AdminUserRow key={user.id} user={user} />
        ))}
        {users.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-100 py-12 text-center">
            <p className="text-sm text-slate-400">該当ユーザーなし</p>
          </div>
        )}
      </div>
      <p className="text-xs text-slate-400 mt-2">{users.length} 件表示</p>
    </div>
  );
}
