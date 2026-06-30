import type { Metadata } from "next";
import { Saira_Condensed, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";
import InAppBrowserGuard from "../components/InAppBrowserGuard";
import ErrorBoundary from "../components/ErrorBoundary";

// "Hi-vis Industrial" canonical fonts:
// Saira Condensed (condensed grotesque, nameplate feel) for headings/display,
// Inter for body/UI text, Geist Mono for numbers/codes/dates.
const saira = Saira_Condensed({
  variable: "--font-saira",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
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
  openGraph: {
    siteName: 'Жолооч Монголиа',
    type: 'website',
    locale: 'mn_MN',
    url: 'https://jolooch.net',
    title: 'Хүнд Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Хүнд Механизмын Ажлын Нэгдсэн Систем | Жолооч Монголиа',
    description: 'Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.',
  },
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.location.hostname.includes('web.app') || window.location.hostname.includes('firebaseapp.com')) {
                window.location.replace('https://jolooch.net' + window.location.pathname + window.location.search + window.location.hash);
              }
            `,
          }}
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
