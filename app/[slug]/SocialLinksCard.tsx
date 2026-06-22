import Image from "next/image";

type SocialLink = {
  id: string;
  platform: string;
  url: string;
};

const PLATFORM_META: Record<string, { label: string }> = {
  x:         { label: "X" },
  instagram: { label: "Instagram" },
  tiktok:    { label: "TikTok" },
  youtube:   { label: "YouTube" },
  twitch:    { label: "Twitch" },
  showroom:  { label: "SHOWROOM" },
  "17live": { label: "17LIVE" },
  pococha:   { label: "Pococha" },
  note:      { label: "note" },
  threads:   { label: "Threads" },
  booth:     { label: "BOOTH" },
  litlink:   { label: "lit.link" },
  website:   { label: "公式サイト" },
};

type Props = {
  links: SocialLink[];
};

export default function SocialLinksCard({ links }: Props) {
  if (links.length === 0) return null;

  return (
    <div className="glass-card rounded-2xl p-4 mb-4">
      <div className="flex flex-wrap gap-2">
        {links.map((link) => {
          const meta = PLATFORM_META[link.platform];
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-btn-secondary px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs font-medium"
            >
              <Image
                src={`/sns/${link.platform}.png`}
                alt={meta?.label ?? link.platform}
                width={16}
                height={16}
                className="object-contain"
              />
              {meta?.label ?? link.platform}
            </a>
          );
        })}
      </div>
    </div>
  );
}
