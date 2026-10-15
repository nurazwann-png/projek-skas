import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SK@S - Sistem Kualiti Sekolah",
  description: "Sistem Pengurusan Kualiti SK@S - Pejabat Pendidikan Daerah",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

  if (hasClerkKey) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { ClerkProvider } = require("@clerk/nextjs");
    return (
      <ClerkProvider>
        <html lang="ms">
          <body className={inter.className}>{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  return (
    <html lang="ms">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
