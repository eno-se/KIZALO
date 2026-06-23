"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginButton() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/setup";

  return (
    <button
      onClick={() => signIn("google", { callbackUrl })}
      className="glass-btn-primary w-full py-3 px-6 rounded-xl font-semibold text-sm cursor-pointer"
    >
      Google でログイン
    </button>
  );
}
