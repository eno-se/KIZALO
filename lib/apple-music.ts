export function extractAppleMusicEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("music.apple.com")) return null;

    // embed.music.apple.com に変換
    u.hostname = "embed.music.apple.com";

    // 不要なクエリパラメータを除去（?i= は楽曲指定で必要なので残す）
    const songId = u.searchParams.get("i");
    u.search = "";
    if (songId) u.searchParams.set("i", songId);

    return u.toString();
  } catch {
    return null;
  }
}

export function getAppleMusicEmbedHeight(url: string): number {
  try {
    const u = new URL(url);
    const path = u.pathname;
    // 楽曲単体（?i= パラメータあり or /song/）
    if (u.searchParams.get("i") || path.includes("/song/")) return 175;
    // アーティスト
    if (path.includes("/artist/")) return 450;
    // アルバム・プレイリスト
    return 450;
  } catch {
    return 450;
  }
}
