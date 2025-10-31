import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "EquiSynth",
  description: "Equity research copilot powered by multi-agent AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased bg-white text-slate-900`}>
        <Providers>
          <header className="border-b bg-white">
            <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <img src="/equisynth-logo.png" alt="EquiSynth logo" className="h-6 w-6" />
                <span className="font-semibold">EquiSynth</span>
              </Link>
              <AuthButton />
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
