import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Studio",
  description: "Your AI creative agency: brand study, ideas, copy and posters that don't look AI-made.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Also used by the poster typesetter (canvas). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,600;0,700;1,600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
