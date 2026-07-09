import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function Header() {
  const session = await auth();
  let logoHref = "/";

  if (session?.user.id) {
    const profile = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    });
    if (profile?.slug) logoHref = `/${profile.slug}`;
  }

  return (
    <header className="glass-header fixed top-0 left-0 right-0 z-50 px-4 py-1 flex items-center justify-center">
      <Link href={logoHref}>
        <Image src="/logo.png" alt="KIZALO" height={28} width={94} className="object-contain" priority />
      </Link>
    </header>
  );
}
