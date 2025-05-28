import type { Metadata } from 'next';
import { Inter, Roboto_Mono } from 'next/font/google'; // Changed from Geist_Sans and Geist_Mono
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseProvider } from '@/components/providers/firebase-provider';

const inter = Inter({ // Changed from geistSans / Geist_Sans
  variable: '--font-sans', // Changed variable name
  subsets: ['latin'],
});

const robotoMono = Roboto_Mono({ // Changed from geistMono / Geist_Mono
  variable: '--font-mono', // Changed variable name
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ChronoStream',
  description: 'Real-time video streaming and patient management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable} antialiased font-sans`}>
        <FirebaseProvider>
          {children}
          <Toaster />
        </FirebaseProvider>
      </body>
    </html>
  );
}
