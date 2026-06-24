import { ImageResponse } from "next/og";
import { db } from "@/lib/db";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const creator = await db.creatorProfile.findUnique({
    where: { slug },
    select: { displayName: true, bio: true, iconUrl: true },
  });

  const name = creator?.displayName ?? slug;
  const bio = creator?.bio ? creator.bio.slice(0, 60) + (creator.bio.length > 60 ? "…" : "") : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #fde8f5 0%, #ede8fd 50%, #e8f3fd 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* 背景装飾 */}
        <div style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "rgba(245,139,203,0.15)",
        }} />
        <div style={{
          position: "absolute",
          bottom: -80,
          left: -80,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background: "rgba(125,183,255,0.15)",
        }} />

        {/* アバター */}
        {creator?.iconUrl ? (
          <div style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            overflow: "hidden",
            marginBottom: 28,
            border: "4px solid white",
            boxShadow: "0 8px 32px rgba(185,138,245,0.4)",
            display: "flex",
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={creator.iconUrl} width={120} height={120} style={{ objectFit: "cover" }} alt="" />
          </div>
        ) : (
          <div style={{
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            boxShadow: "0 8px 32px rgba(185,138,245,0.4)",
          }}>
            <span style={{ color: "white", fontSize: 52, fontWeight: 800 }}>
              {name[0]}
            </span>
          </div>
        )}

        {/* 名前 */}
        <div style={{
          fontSize: 56,
          fontWeight: 800,
          background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
          WebkitBackgroundClip: "text",
          color: "transparent",
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}>
          {name}
        </div>

        {/* @slug */}
        <div style={{ fontSize: 24, color: "#94a3b8", marginBottom: bio ? 20 : 32 }}>
          @{slug}
        </div>

        {/* bio */}
        {bio && (
          <div style={{
            fontSize: 22,
            color: "#64748b",
            maxWidth: 700,
            textAlign: "center",
            lineHeight: 1.6,
            marginBottom: 32,
          }}>
            {bio}
          </div>
        )}

        {/* KIZALO ロゴ */}
        <div style={{
          position: "absolute",
          bottom: 36,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <div style={{
            fontSize: 22,
            fontWeight: 900,
            background: "linear-gradient(135deg, #F58BCB 0%, #B98AF5 50%, #7DB7FF 100%)",
            WebkitBackgroundClip: "text",
            color: "transparent",
            letterSpacing: "0.1em",
          }}>
            KIZALO
          </div>
          <div style={{ fontSize: 18, color: "#94a3b8" }}>— 推しのプロフィールに、名前を刻む。</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
