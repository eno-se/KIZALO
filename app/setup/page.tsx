import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import SetupForm from "./SetupForm";

export default async function SetupPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: true },
  });

  if (!user) redirect("/login");
  if (user.displayName) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 w-full max-w-md">
        <h1 className="text-xl font-bold text-slate-800 mb-1">はじめまして！</h1>
        <p className="text-sm text-slate-500 mb-6">あなたの表示名を設定してください</p>
        <SetupForm defaultName={user.name ?? ""} />
      </div>
    </div>
  );
}
