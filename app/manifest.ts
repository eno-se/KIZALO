import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KIZALO",
    short_name: "KIZALO",
    description: "推しのプロフィールに、名前を刻む。",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#F58BCB",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
