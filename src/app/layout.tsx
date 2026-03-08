import type { Metadata } from "next";
import "./globals.css";
import ScrollRevealInit from "@/components/ScrollRevealInit";

export const metadata: Metadata = {
  title: "EngagementFlow",
  description: "AI-powered SOW generation and engagement management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <ScrollRevealInit />
      </body>
    </html>
  );
}
