import type { Metadata, Viewport } from "next";
import { Outfit, Oswald } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { AppStateProvider } from "@/components/app-state-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const oswald = Oswald({
  subsets: ["latin", "latin-ext"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Training APP",
  description:
    "Dziennik siłowy: ciężar, powtórzenia, serie i progres względem poprzedniego dnia treningowego.",
  applicationName: "Training APP",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#161310" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pl"
      suppressHydrationWarning
      className={`${outfit.variable} ${oswald.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <ThemeProvider>
          <AppStateProvider>
            <AppShell>{children}</AppShell>
            <Toaster position="top-center" />
          </AppStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
