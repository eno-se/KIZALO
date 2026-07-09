import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import GuideTabs from "./GuideTabs";

export const metadata: Metadata = {
  title: "使い方ガイド | KIZALO",
  description: "KIZALOの使い方をファン・クリエイター向けに解説します。",
};

export default async function GuidePage() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  return <GuideTabs isLoggedIn={isLoggedIn} />;
}
