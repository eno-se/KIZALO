import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import LiquidGlassFilter from "./components/LiquidGlassFilter";
import NextTopLoader from "nextjs-toploader";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { GoogleAnalytics } from "@next/third-parties/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "KIZALO — 推しのプロフィールに、名前を刻む。",
  description: "推しのプロフィールに自分の名前を刻もう。毎日1回、応援の証を残せる。",
  metadataBase: new URL("https://kizalo.com"),
  openGraph: {
    title: "KIZALO — 推しのプロフィールに、名前を刻む。",
    description: "推しのプロフィールに自分の名前を刻もう。毎日1回、応援の証を残せる。",
    url: "https://kizalo.com",
    siteName: "KIZALO",
    images: [{ url: "/og-base.png", width: 1200, height: 630 }],
    type: "website",
    locale: "ja_JP",
  },
  twitter: {
    card: "summary_large_image",
    title: "KIZALO — 推しのプロフィールに、名前を刻む。",
    description: "推しのプロフィールに自分の名前を刻もう。毎日1回、応援の証を残せる。",
    images: ["/og-base.png"],
  },
  appleWebApp: {
    capable: true,
    title: "KIZALO",
    statusBarStyle: "default",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  let mySlug: string | null = null;
  if (session?.user.id) {
    const creator = await db.creatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { slug: true },
    });
    mySlug = creator?.slug ?? null;
  }

  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <NextTopLoader color="#B98AF5" shadow="0 0 10px #F58BCB,0 0 5px #7DB7FF" height={3} showSpinner={false} />
        <LiquidGlassFilter />
        <Header />
        <div className="pt-14 pb-16">{children}</div>
        <BottomNav mySlug={mySlug} />
      </body>
      <GoogleAnalytics gaId="G-CJDKRNS05W" />
    </html>
  );
}
