import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Poster Studio",
  description: "Pick an expert, get a detailed prompt, generate posters.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
