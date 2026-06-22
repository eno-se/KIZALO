import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";
import LoginButton from "./LoginButton";
import DevLogin from "./DevLogin";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  const devUsers = process.env.NODE_ENV === "development"
    ? await db.user.findMany({
        select: { id: true, displayName: true, name: true, email: true },
        orderBy: { createdAt: "asc" },
        take: 30,
      })
    : [];

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 w-full max-w-sm text-center">
        <div className="flex justify-center mb-1">
          <Image src="/logo.png" alt="KIZALO" width={140} height={42} className="object-contain" priority />
        </div>
        <p className="text-sm text-slate-400 mb-8">推しのプロフィールに、名前を刻む。</p>
        <LoginButton />
        <p className="mt-6 text-xs text-slate-400">
          ログインすることで利用規約に同意したものとみなします
        </p>
        {process.env.NODE_ENV === "development" && <DevLogin users={devUsers} />}
      </div>
    </div>
  );
}
