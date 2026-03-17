import type { Metadata, Viewport } from "next";
import { Oswald, Permanent_Marker } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  weight: ["400", "500", "700"],
});

const permanentMarker = Permanent_Marker({
  subsets: ["latin"],
  variable: "--font-permanent-marker",
  weight: "400",
});

// All pages require auth — skip static prerendering
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "HADOUKEN TRACKER",
  description: "AI-powered macro tracking — hadouken your nutrition",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HADOUKEN",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1a2e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${oswald.variable} ${permanentMarker.variable} antialiased`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "rgba(30,24,24,0.95)",
                border: "2px solid #333",
                color: "#F0E8E0",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
