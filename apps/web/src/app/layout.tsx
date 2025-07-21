import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EnglishAI Master - Learn English with AI Conversation',
  description: 'Master English through AI-powered conversations with native-level tutors. Practice real-world scenarios and improve your fluency.',
  keywords: ['English learning', 'AI tutor', 'conversation practice', 'language learning', 'ESL'],
  authors: [{ name: 'EnglishAI Team' }],
  openGraph: {
    title: 'EnglishAI Master',
    description: 'Learn English through AI-powered conversations',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}