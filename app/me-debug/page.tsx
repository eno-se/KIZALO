import { auth } from "@/lib/auth";

export default async function MeDebug() {
  const session = await auth();
  return <pre>{JSON.stringify({ id: session?.user?.id ?? null }, null, 2)}</pre>;
}
