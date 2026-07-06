import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";
import { checkRateLimit } from "@/lib/rate-limit";
import { requireActiveUser } from "@/lib/require-active-user";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const r = await requireActiveUser();
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

    if (!checkRateLimit(`upload-profile-image:${r.userId}`, 10, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "アップロード回数の上限に達しました。しばらくお待ちください。" }, { status: 429 });
    }

    const { contentType, contentLength } = await req.json();
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(contentType)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    const MAX_BYTES = 10 * 1024 * 1024;
    if (!Number.isInteger(contentLength) || contentLength <= 0 || contentLength > MAX_BYTES) {
      return NextResponse.json({ error: "ファイルサイズが不正です" }, { status: 400 });
    }

    const ext = contentType.split("/")[1].replace("jpeg", "jpg");
    const key = `profile-images/${r.userId}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: contentLength,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ presignedUrl, publicUrl });
  } catch (e) {
    console.error("[upload-profile-image]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
