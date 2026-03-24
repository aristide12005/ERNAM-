import '@/lib/webrtc-polyfill';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import NotificationBell from '@/components/NotificationBell';
import { Toaster } from 'sonner';

import type { Metadata } from "next";
import "./globals.css";

// Using standard system fonts instead of Google Fonts to avoid network build errors
const geistSans = { variable: "font-sans" };
const geistMono = { variable: "font-mono" };

export const metadata: Metadata = {
  title: "ERNAM Digital Twin",
  description: "Digital Twin Platform for ERNAM",
  icons: {
    icon: "/diamond_logo.png?v=2"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`antialiased font-sans`}>
        <ThemeProvider defaultTheme="light" storageKey="ernam-theme">
          <AuthProvider>
            {children}
          </AuthProvider>
          <NotificationBell />
          <Toaster position="top-right" richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
