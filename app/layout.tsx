import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import Track from "@/components/Track";
import "./globals.css";

const serif = Instrument_Serif({ weight: "400", subsets: ["latin"], variable: "--font-serif" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3210"),
  title: "Umless: remove ums, stutters and retakes from your video",
  description:
    "Upload your demo or talking video. Umless cuts every um, stutter, retake and dead pause, and can re-record your script in your own voice. Sound like you nailed it in one take.",
  openGraph: { title: "Umless: sound like you nailed it in one take", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable}`}>
      <body>
        <Track />
        <header className="topbar">
          <nav>
            <a href="/" className="brand">
              um<span>less</span>
            </a>
            <div className="links">
              <a href="/#how">How it works</a>
              <a href="/#pricing">Pricing</a>
              <a href="/#open-source">Open source</a>
              <a href="/um-score">Free Um Score</a>
              <a href="/#waitlist" className="btn small-btn">Join waitlist</a>
            </div>
          </nav>
        </header>
        <main>
          {children}
          <footer>
            <span>
              um<b>less</b> · Your video, minus the ums.
            </span>
            <span>Files are deleted 24 hours after processing. Voice samples are never stored.</span>
          </footer>
        </main>
      </body>
    </html>
  );
}
