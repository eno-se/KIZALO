import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export type ActiveUser = { userId: string };
export type AuthError = { error: string; status: number };

export async function requireActiveUser(): Promise<ActiveUser | AuthError> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 };
  if (session.user.isSuspended) return { error: "アカウントが利用停止されています", status: 403 };

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { isBanned: true, isSuspended: true },
  });
  if (!user || user.isBanned || user.isSuspended) {
    return { error: "アカウントが利用停止されています", status: 403 };
  }

  return { userId: session.user.id };
}
