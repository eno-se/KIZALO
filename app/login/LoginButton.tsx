"use client";

import { signIn } from "next-auth/react";

export default function LoginButton() {
  return (
    <button
      onClick={() => signIn("google", { callbackUrl: "/setup" })}
      className="glass-btn-primary w-full py-3 px-6 rounded-xl font-semibold text-sm cursor-pointer"
    >
      Google でログイン
    </button>
  );
}
