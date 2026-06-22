import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import Image from "next/image";

export default async function Home() {
  const session = await auth();

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: { creatorProfile: true },
    });
    if (user?.creatorProfile) {
      redirect(`/${user.creatorProfile.slug}`);
    }
    redirect("/edit");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <div className="glass-card rounded-3xl p-10 max-w-sm w-full">
        <Image src="/logo.png" alt="KIZALO" width={200} height={68} className="object-contain mx-auto mb-6" />
        <p className="text-slate-400 text-sm mb-8">推しのプロフィールに、名前を刻む。</p>
        <a href="/login" className="glass-btn-primary block py-3 rounded-xl font-semibold text-sm">
          はじめる
        </a>
      </div>
    </div>
  );
}
