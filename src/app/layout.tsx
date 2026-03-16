import type { Metadata, Viewport } from "next";
import { Inter, Orbitron } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  weight: ["400", "500", "600", "700", "800", "900"],
});

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
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body
        className={`${inter.variable} ${orbitron.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          <AppShell>{children}</AppShell>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: "#1e1e1e",
                border: "1px solid #2a2a2a",
                color: "#ededed",
                fontFamily: "var(--font-sans)",
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
