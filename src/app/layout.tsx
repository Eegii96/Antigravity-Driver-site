import type { Metadata } from "next";
import { Oswald, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";
import InAppBrowserGuard from "../components/InAppBrowserGuard";
import ErrorBoundary from "../components/ErrorBoundary";

// "Hi-vis Industrial" canonical fonts (AGENTS.md §4):
// Oswald (condensed grotesque, nameplate feel — the AGENTS.md-approved alternate
// to Saira Condensed) for headings/display, Inter for body/UI text, Geist Mono
// for numbers/codes/dates. Both display and body fonts load the "cyrillic"
// subset — the site's content is ~100% Mongolian Cyrillic, and Saira Condensed
// has no Cyrillic glyphs at all, which was silently falling back to the system
// font for every heading.
const saira = Oswald({
  variable: "--font-saira",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jolooch.net'),
  title: {
    default: 'Хүнд Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    template: '%s | Жолооч Монголиа',
  },
  description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    siteName: 'Жолооч Монголиа',
    type: 'website',
    locale: 'mn_MN',
    url: 'https://jolooch.net',
    title: 'Хүнд Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'Жолооч Монголиа — газар шорооны ажлын зах зээл',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Хүнд Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
    images: ['/og.jpg'],
  },
};

// Site-wide Organization + WebSite JSON-LD — previously no structured data
// described the site itself (only individual job postings had JobPosting
// JSON-LD). Helps Google attribute job listings to a real organization and
// enables a sitelinks search box.
const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Жолооч Монголиа',
  url: 'https://jolooch.net',
  logo: 'https://jolooch.net/logo.jpg',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+976-99106339',
    contactType: 'customer service',
    areaServed: 'MN',
    availableLanguage: 'mn',
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Жолооч Монголиа',
  url: 'https://jolooch.net',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${saira.variable} ${inter.variable} ${geistMono.variable} antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebaseinstallations.googleapis.com" />
        <script
          dangerouslySetInnerHTML={{
            __html: `if(location.hostname.includes('web.app')||location.hostname.includes('firebaseapp.com')){location.replace('https://jolooch.net'+location.pathname+location.search+location.hash)}`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen flex flex-col justify-between">
        <a href="#main-content" className="skip-link">Үндсэн агуулга руу очих</a>
        <ErrorBoundary>
          <AuthProvider>
            <InAppBrowserGuard />
            <main id="main-content" className="flex-grow flex flex-col">{children}</main>
            <Footer />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
