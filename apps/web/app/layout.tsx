import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import Providers from '../context/Providers';
import './globals.css';
import { Toaster } from 'sonner';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial'],
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  display: 'swap',
  preload: true,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: 'SITA-BI',
  description: 'Sistem Informasi Tugas Akhir & Bimbingan',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL!),
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#991b1b',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* DNS Prefetch & Preconnect untuk faster API calls */}
        <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_API_URL} />
        <link
          rel="preconnect"
          href={process.env.NEXT_PUBLIC_API_URL}
          crossOrigin="anonymous"
        />
        {/* Inline critical CSS for faster FCP */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              :root {
                --background: #FFFFFF;
                --foreground: #800000;
                --primary: #800000;
              }
              html, body {
                max-width: 100vw;
                overflow-x: hidden;
                margin: 0;
                padding: 0;
              }
              body {
                color: var(--foreground);
                background: var(--background);
              }
              * {
                box-sizing: border-box;
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
        <Toaster position="top-right" richColors expand={true} />
      </body>
    </html>
  );
}
