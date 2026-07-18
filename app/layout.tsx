import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "La Scommessa d’Amore", template: "%s · La Scommessa" },
  description: "Шуточный свадебный prediction market на свадебные лиры.",
  applicationName: "La Scommessa",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "La Scommessa" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#174b38", colorScheme: "light", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
