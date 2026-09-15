import type { ReactNode } from "react";

const icons = {
  dashboard: (
    <path d="M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9.5z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
  ),
  news: (
    <>
      <path d="M6 4h12a2 2 0 012 2v14l-4-3-4 3-4-3-4 3V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M8 8h8M8 12h5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  pages: (
    <>
      <path d="M8 4h10a2 2 0 012 2v14H8a2 2 0 01-2-2V6a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M6 8H4a2 2 0 00-2 2v10h4" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M10 9h6M10 13h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  menu: <path d="M5 7h14M5 12h14M5 17h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
  slider: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M8 15l2.5-3 2 2.5L17 10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  media: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="8.5" cy="10" r="1.5" stroke="currentColor" strokeWidth="1.75" />
      <path d="M7 16l3.5-4 3 3.5L17 12l4 4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  requests: (
    <>
      <path d="M4 6h16a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
      <path d="M4 8l8 5 8-5" stroke="currentColor" strokeWidth="1.75" strokeLinejoin="round" />
    </>
  ),
  users: (
    <path
      d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 20v-1a5 5 0 015-5h2a5 5 0 015 5v1M18 8a3 3 0 100-6 3 3 0 000 6z"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  visits: (
    <>
      <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 14l3-3 3 2 5-6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  audit: <path d="M8 5h12M8 9h12M8 13h12M8 17h8M4 5h.01M4 9h.01M4 13h.01M4 17h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />,
  swagger: <path d="M8 9l-3 3 3 3M16 9l3 3-3 3M13 5l-2 14" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />,
  profile: (
    <>
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.75" />
      <path d="M5 20v-1a7 7 0 0114 0v1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </>
  ),
  site: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.75" />
      <path d="M3 12h18M12 3a14 14 0 000 18M12 3a14 14 0 010 18" stroke="currentColor" strokeWidth="1.75" />
    </>
  ),
  logout: (
    <path
      d="M10 17l-1 1H5a2 2 0 01-2-2V8a2 2 0 012-2h4l1 1M15 12H8M18 9l3 3-3 3"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  chevron: <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  burger: <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  burgerShort: <path d="M4 7h16M4 12h16M4 17h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
};

export function AdminIcon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg className="admin-icon" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {icons[name] as ReactNode}
    </svg>
  );
}
