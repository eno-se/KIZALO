import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import SettingsButtons from "./SettingsButtons";

export default async function MePage() {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen px-4 py-8 max-w-lg mx-auto pb-28">
      <h1 className="text-xl font-bold text-slate-800 mb-6">設定</h1>
      <div className="space-y-4">
        <SettingsButtons />
      </div>
    </div>
  );
}
