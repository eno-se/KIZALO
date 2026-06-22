"use server";

import { auth, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function setupUser(displayName: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: session.user.id },
    data: { displayName },
  });
}

export async function updateDisplayName(displayName: string) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: session.user.id },
    data: { displayName },
  });

  revalidatePath("/me");
}

export async function logoutUser() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccount() {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  await db.user.delete({ where: { id: session.user.id } });
  await signOut({ redirectTo: "/" });
}
