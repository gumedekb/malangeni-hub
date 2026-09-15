/** Where a post or event can be shared. Each opens the network's own share page. */
export interface ShareTarget {
  id: string;
  label: string;
  /** Brand colour behind the one-letter mark. */
  color: string;
  mark: string;
  href: (url: string, text: string) => string;
}

const enc = encodeURIComponent;

export const SHARE_TARGETS: ShareTarget[] = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    mark: "W",
    href: (url, text) => `https://wa.me/?text=${enc(`${text} ${url}`)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    mark: "f",
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`,
  },
  {
    id: "x",
    label: "X (Twitter)",
    color: "#111111",
    mark: "X",
    href: (url, text) => `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: "telegram",
    label: "Telegram",
    color: "#229ED9",
    mark: "T",
    href: (url, text) => `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}`,
  },
  {
    id: "email",
    label: "Email",
    color: "#6b6864",
    mark: "@",
    href: (url, text) => `mailto:?subject=${enc(text)}&body=${enc(`${text}\n\n${url}`)}`,
  },
];

/** A site path as a full URL, so it works when pasted anywhere. */
export function absoluteUrl(path: string): string {
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
}
