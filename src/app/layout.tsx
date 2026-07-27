import type { Metadata } from "next";
import "./globals.css";
import { SiteChrome } from "@/components/layout/site-chrome";
import { fontDisplay, fontBody } from "@/lib/fonts";
import { BRAND_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";
import { ensureAutomationInitialized } from "@/lib/services/automation/init";

ensureAutomationInitialized();

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${BRAND_NAME} — Thoughtfully wrapped gifts`,
    template: `%s · ${BRAND_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "gifts",
    "gift delivery",
    "luxury gifts",
    "flowers",
    "chocolate",
    "personalized gifts",
    "gift wrapping",
  ],
  authors: [{ name: BRAND_NAME }],
  openGraph: {
    type: "website",
    siteName: BRAND_NAME,
    title: `${BRAND_NAME} — Thoughtfully wrapped gifts`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND_NAME} — Thoughtfully wrapped gifts`,
    description: SITE_DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
