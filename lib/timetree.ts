export function extractTimeTreeEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);

    // timetreeapp.com/public_calendars/[ID]
    if (u.hostname === "timetreeapp.com") {
      const match = u.pathname.match(/^\/public_calendars\/([^/?#]+)/);
      if (!match) return null;
      return `https://timetreeapp.com/public_calendars/${match[1]}/embed`;
    }

    // timetr.ee/p/[ID]（短縮URL）
    if (u.hostname === "timetr.ee") {
      const match = u.pathname.match(/^\/p\/([^/?#]+)/);
      if (!match) return null;
      return `https://timetreeapp.com/public_calendars/${match[1]}/embed`;
    }

    return null;
  } catch {
    return null;
  }
}
