import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-raw", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Northwind CRM",
  description: "A simple CRM for tracking leads, deals and contacts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col text-[14px]">{children}</body>
    </html>
  );
}
