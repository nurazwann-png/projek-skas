import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Portal PPD Dalat",
  description: "Portal Pengurusan Digital Pejabat Pendidikan Daerah Dalat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ms">
      <body>{children}</body>
    </html>
  );
}
