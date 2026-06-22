import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomBytes } from "crypto";

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const { userId } = await req.json();

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { sessionToken: token, userId, expires },
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("authjs.session-token", token, {
    expires,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return res;
}
