import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import LoginButton from "./LoginButton";

export default async function LoginPage() {
  const session = await auth();
  if (session) redirect("/");

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-10 w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold tracking-tight text-violet-700 mb-1">KIZALO</h1>
        <p className="text-sm text-slate-500 mb-8">推しのプロフィールに、名前を刻む。</p>
        <LoginButton />
        <p className="mt-6 text-xs text-slate-400">
          ログインすることで利用規約に同意したものとみなします
        </p>
      </div>
    </div>
  );
}
