import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: { select: { id: true } } },
  });

  if (!user) redirect("/login");
  if (user.displayName && user.creatorProfile) redirect("/");

  return (
    <div className="flex items-center justify-center px-4 min-h-[calc(100vh-7.5rem)]">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">プロフィールを作成する</h1>
        <p className="text-sm text-slate-500 mb-2">KIZALOへようこそ！まずはプロフィールを設定しましょう。</p>
        <ul className="text-xs text-slate-400 mb-6 space-y-1">
          <li>・表示名とIDは全員に公開されます</li>
          <li>・IDは1日1回のみ変更できます</li>
          <li>・トップ画像・一言などは後から設定できます</li>
        </ul>
        <SetupForm defaultName={user.name ?? ""} />
      </div>
    </div>
  );
}
