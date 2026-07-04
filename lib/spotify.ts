export function extractSpotifyEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith("open.spotify.com") && !u.hostname.endsWith("spotify.link")) return null;

    // spotify.link の短縮URLは変換不可（展開が必要）→ null を返す
    if (u.hostname.endsWith("spotify.link")) return null;

    // /intl-xx/ などロケールプレフィックスを除去
    u.pathname = u.pathname.replace(/^\/intl-[a-z-]+\//, "/");

    // /track/xxx → /embed/track/xxx のようにパスに /embed を挿入
    if (u.pathname.startsWith("/embed/")) return u.toString();
    u.pathname = "/embed" + u.pathname;
    u.search = "";

    return u.toString();
  } catch {
    return null;
  }
}

export function getSpotifyEmbedHeight(url: string): number {
  try {
    const u = new URL(url);
    // track / episode は compact サイズ
    if (u.pathname.includes("/track/") || u.pathname.includes("/episode/")) return 152;
    return 352;
  } catch {
    return 352;
  }
}
