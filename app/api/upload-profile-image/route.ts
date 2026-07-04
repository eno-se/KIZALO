import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@/lib/auth";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
    const key = `profile-images/${session.user.id}-${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}.${ext}`;

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
