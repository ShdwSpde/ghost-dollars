import "./globals.css";
import { Anton, Public_Sans, Space_Mono } from "next/font/google";

const anton = Anton({ weight: "400", subsets: ["latin"], variable: "--font-anton", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const spaceMono = Space_Mono({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-space-mono", display: "swap" });

export const metadata = {
  title: "Ghost Dollars — what NYC's capital data leaves out",
  description:
    "A civic-data poster: the under-investment NYC's capital spending hides, and the 74% of published capital that names no neighborhood.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${anton.variable} ${publicSans.variable} ${spaceMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
