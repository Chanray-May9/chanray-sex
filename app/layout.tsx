import type { Metadata } from "next";
import "./globals.css";
import "./ruirui.css";
import { SiteContentProvider } from "@/components/SiteContent";

export const metadata: Metadata = {
  title: "锐锐 · 想靠近你",
  description: "主人，锐锐在这里。聊一会儿，听句悄悄话，留一点只属于我们的时间。",
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
