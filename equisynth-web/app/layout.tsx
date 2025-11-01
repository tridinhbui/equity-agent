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
          <header className="border-b bg-white shadow-sm">
            <div className="mx-auto max-w-7xl px-4 py-3">
              <div className="flex items-center justify-between mb-3">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/equisynth-logo.png" alt="EquiSynth logo" className="h-6 w-6" />
                  <span className="font-semibold text-lg">EquiSynth</span>
                </Link>
                <AuthButton />
              </div>
              <nav className="flex gap-4">
                <Link href="/dashboard" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  📊 Data Extractor
                </Link>
                <Link href="/financial-understanding" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  💡 Financial Understanding
                </Link>
                <Link href="/valuation" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  💰 Valuation
                </Link>
                <Link href="/sentiment" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  🎭 Sentiment & Tone
                </Link>
                <Link href="/report" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  📄 Report Composer
                </Link>
                <Link href="/supervisor" className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all">
                  🔍 Supervisor
                </Link>
              </nav>
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}
