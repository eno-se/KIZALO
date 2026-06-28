import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function escapeCell(v: string | number | null | undefined): string {
  const s = v == null ? "" : String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toRow(cells: (string | number | null | undefined)[]): string {
  return cells.map(escapeCell).join(",");
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { creatorProfile: { select: { id: true } } },
  });
  if (!user?.creatorProfile) return NextResponse.json({ error: "No profile" }, { status: 404 });

  const creatorId = user.creatorProfile.id;
  const { searchParams } = new URL(req.url);

  if (searchParams.get("type") !== "daily") {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const groups = await db.kizari.groupBy({
    by: ["date"],
    where: { creatorId },
    _count: { id: true },
    orderBy: { date: "asc" },
  });

  const header = toRow(["日付", "刻り数"]);
  const rows = groups.map((g) => toRow([g.date, g._count.id]));

  const csv = [header, ...rows].join("\r\n");
  const filename = `kizalo-daily-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse("﻿" + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`,
    },
  });
}
