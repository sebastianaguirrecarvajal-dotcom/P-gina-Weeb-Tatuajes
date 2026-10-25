import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { getStudio, toPublicStudio } from "@/lib/studio";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const studio = await getStudio();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const name = studio?.artistName ?? "Estudio de Tatuaje";
  const studioName = studio?.studioName ?? "Estudio de Tatuaje";
  const description =
    studio?.tagline ??
    "Portafolio, reservas y novedades del estudio de tatuaje.";

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: `${name} · ${studioName}`,
      template: `%s · ${studioName}`,
    },
    description,
    openGraph: {
      title: `${name} · ${studioName}`,
      description,
      type: "website",
      locale: "es_ES",
      images: studio?.heroImageUrl ? [studio.heroImageUrl] : [],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${sans.variable} ${display.variable} dark`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
