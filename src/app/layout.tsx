import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ConsoleGuard from "@/components/providers/ConsoleGuard";
import Providers from "@/components/providers/Providers";
import { CRITICAL_CSS } from "@/lib/hero/critical-css";
import { rootMetadata } from "@/lib/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  adjustFontFallback: true,
  preload: false,
});

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} min-h-dvh antialiased`}
    >
      <head>
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
      </head>
      <body className="flex min-h-dvh flex-col overflow-x-hidden bg-neutral-950 text-neutral-100">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <ConsoleGuard />
          <Header />
          <main id="main-content" className="flex flex-1 flex-col" tabIndex={-1}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
