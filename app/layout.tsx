import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Capital Desk",
  description: "Internal platform for real estate investment deal management.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
