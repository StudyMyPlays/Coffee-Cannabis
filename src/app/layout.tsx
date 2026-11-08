import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { MotionController } from "@/components/motion/MotionController";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { HideOnAdmin } from "@/components/HideOnAdmin";
import { SITE } from "@/lib/site";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Coffee & Cannabis Club · Find your people.",
    template: "%s · Coffee & Cannabis Club",
  },
  description: SITE.description,
  applicationName: SITE.name,
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_US",
    url: "/",
    title: "Coffee & Cannabis Club · Find your people.",
    description: SITE.description,
    images: [{ url: "/assets/og-share.jpg", width: 1200, height: 630, alt: "Coffee & Cannabis Club · Find your people." }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee & Cannabis Club · Find your people.",
    description: SITE.description,
    images: ["/assets/og-share.jpg"],
  },
  formatDetection: { telephone: false, address: false, email: false },
};

export const viewport: Viewport = {
  themeColor: "#145024",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Marks JS availability before first paint so reveal states never flash. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <HideOnAdmin>
          <SiteFooter />
        </HideOnAdmin>
        <MotionController />
        <Analytics />
      </body>
    </html>
  );
}
