import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ApnaShehar — Mumbai, a little less obvious",
  description: "Find local Mumbai places and little outings that fit your time, mood, and budget.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/apnashehar-icon.svg",
    shortcut: "/apnashehar-icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
