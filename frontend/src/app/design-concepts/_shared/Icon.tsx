/**
 * Иконки макетов 6 и 7 — в том же стиле, что AdminIcons: сетка 24×24, линия 1.75, скруглённые концы.
 * Размер задаёт CSS (по умолчанию 1em), цвет — currentColor.
 */
const paths = {
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  arrowUpRight: "M7 17 17 7M9 7h8v8",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-4-4",
  menu: "M4 7h16M4 12h16M4 17h16",
  wallet: "M4 7.5A2.5 2.5 0 0 1 6.5 5H18v4M4 7.5v9A2.5 2.5 0 0 0 6.5 19H20V9H6.5A2.5 2.5 0 0 1 4 7.5ZM16 14h.01",
  building: "M4 20h16M6 20V9l6-4 6 4v11M10 20v-5h4v5M9 11h.01M15 11h.01",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14.5a6 6 0 0 1 3 5.5",
  chart: "M4 19h16M6 15l4-4 3 3 5-6",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5ZM14 3v5h5M9 13h6M9 17h4",
  bank: "M3 10h18L12 4 3 10ZM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18",
  coin: "M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM9.5 9.5h4a1.5 1.5 0 0 1 0 3h-3a1.5 1.5 0 0 0 0 3h4M12 8v1.5M12 15.5V17",
  book: "M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z",
  megaphone: "M4 10v4a1 1 0 0 0 1 1h2l6 4V5L7 9H5a1 1 0 0 0-1 1ZM17 9a4 4 0 0 1 0 6",
  phone: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  pin: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21ZM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      className={className}
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={paths[name]} />
    </svg>
  );
}
