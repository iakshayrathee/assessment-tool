import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { AppLayout } from '@/components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Knowled - Special Education Management Platform',
  description: 'Comprehensive platform for managing special education programs, assessments, and student progress tracking.',
  keywords: ['special education', 'assessment', 'IEP', 'student management', 'education technology'],
  authors: [{ name: 'Knowled Team' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <AppLayout>
            {children}
          </AppLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
