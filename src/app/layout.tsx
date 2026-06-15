import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "../components/Footer";
import { AuthProvider } from "../context/AuthContext";
import InAppBrowserGuard from "../components/InAppBrowserGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jolooch.net'),
  title: "Барилга, Механизмын Ажлын Нэгдсэн Систем",
  description: "Барилга, замын газар шорооны ажил, хүнд машин механизм түрээс ба жолооч нарын үнэлгээ, түүх бүхий нэгдсэн зарын систем.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="mn"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
        <AuthProvider>
          <InAppBrowserGuard />
          <div className="flex-grow flex flex-col">{children}</div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

