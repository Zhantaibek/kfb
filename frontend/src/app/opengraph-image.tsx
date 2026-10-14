import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/** Превью ссылки в соцсетях и мессенджерах (Telegram, Facebook, WhatsApp) для страниц без своей картинки. */
export const alt = "Kyrgyz Stock Exchange — Кыргызская фондовая биржа";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const lockup = await readFile(join(process.cwd(), "public/brand/kse-lockup.png"));
  const logo = `data:image/png;base64,${lockup.toString("base64")}`;
  // Шрифт по умолчанию — только латиница, поэтому подписи на английском; русское название — на логотипе.
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          background: "linear-gradient(135deg, #0f2d31 0%, #1d4f55 55%, #3f9aa4 100%)",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", background: "#ffffff", borderRadius: 24, padding: "36px 44px", alignSelf: "flex-start" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} width={720} height={107} alt="" />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -1 }}>Kyrgyz Stock Exchange</div>
          <div style={{ fontSize: 32, opacity: 0.85 }}>Quotes · Trading results · Listing · Government securities</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, opacity: 0.75 }}>
          <span>kse.kg</span>
          <span>Bishkek · since 1994</span>
        </div>
      </div>
    ),
    size,
  );
}
