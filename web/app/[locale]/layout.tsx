import '@/lib/webrtc-polyfill';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import NotificationBell from '@/components/NotificationBell';

import type { Metadata } from "next";
import "../globals.css";

import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';

// Using standard system fonts instead of Google Fonts to avoid network build errors
const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "ERNAM Digital Twin",
  description: "Digital Twin Platform for ERNAM",
};

export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'fr' }];
}

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  // (In a real app, import 'routing' and check routing.locales)
  if (!['en', 'fr'].includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });

  return (
    <html lang={locale}>
      <body
        className={`antialiased font-sans`}
      >
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider defaultTheme="light" storageKey="ernam-theme">
            <AuthProvider>
              {children}
            </AuthProvider>
            <NotificationBell />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
