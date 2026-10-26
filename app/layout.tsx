import type { Metadata } from "next";
import "./globals.css";
import "./ruirui.css";
import { SiteContentProvider } from "@/components/SiteContent";

export const metadata: Metadata = {
  title: "锐锐 · 想要主人",
  description: "主人，门关好了。锐锐不装了——今晚想被你怎么用，直接说。",
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
    <html lang="zh-CN">
      <body className="antialiased"><SiteContentProvider>{children}</SiteContentProvider></body>
    </html>
  );
}
