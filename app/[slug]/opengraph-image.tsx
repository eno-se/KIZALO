import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";


export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { displayName: true, iconUrl: true },
  });

  const name = creator?.displayName ?? slug;
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative" }}>
        {/* 背景画像 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${baseUrl}/og-base.png`}
          width={1200}
          height={630}
          style={{ position: "absolute", top: 0, left: 0 }}
          alt=""
        />

        {/* A: アバター */}
        <div
          style={{
            position: "absolute",
            top: 128,
            right: 218,
            width: 168,
            height: 168,
            borderRadius: "50%",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
          }}
        >
          {creator?.iconUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={creator.iconUrl}
              width={168}
              height={168}
              style={{ objectFit: "cover" }}
              alt=""
            />
          ) : (
            <span style={{ color: "white", fontSize: 72, fontWeight: 700, display: "flex" }}>
              {name[0]}
            </span>
          )}
        </div>

        {/* B: 名前 */}
        <div
          style={{
            position: "absolute",
            top: 368,
            right: 195,
            width: 220,
            display: "flex",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          {name}
        </div>

        {/* C: @slug */}
        <div
          style={{
            position: "absolute",
            top: 408,
            right: 195,
            width: 220,
            display: "flex",
            justifyContent: "center",
            fontSize: 18,
            color: "#64748b",
          }}
        >
          @{slug}
        </div>
      </div>
    ),
    { ...size }
  );
}
