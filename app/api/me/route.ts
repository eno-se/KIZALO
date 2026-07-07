import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export const GET = auth((req) => {
  return NextResponse.json({ id: req.auth?.user?.id ?? null });
});
