import type { Metadata } from "next";
import "./globals.css";
import ScrollRevealInit from "@/components/ScrollRevealInit";
import ThemeProvider from "@/components/ThemeProvider";

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <ScrollRevealInit />
        </ThemeProvider>
      </body>
    </html>
  );
}
