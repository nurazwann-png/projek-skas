import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal PPD Dalat",
  description: "Portal Pengurusan Digital Pejabat Pendidikan Daerah Dalat",
  // PWA: manifest dan ikon yang sama dengan halaman HTML portal
  manifest: "/manifest.webmanifest",
  icons: { icon: [{ url: "/icons/ikon-32.png", sizes: "32x32" }], apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "PPD Dalat", statusBarStyle: "default" },
};

export const viewport: Viewport = { themeColor: "#0b2a4a" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
