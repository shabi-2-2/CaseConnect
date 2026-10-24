import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'AICTE Integrated Complaint Monitoring & Status Dashboard',
  description:
    'Executive oversight dashboard for AICTE senior management monitoring complaints across Public Grievance Redressal Cell (PGRC) and Regulation Bureau (RB).',
  keywords: ['AICTE', 'PGRC', 'Regulation Bureau', 'Complaint Dashboard', 'Technical Education', 'Grievance Redressal'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        {children}
      </body>
    </html>
  );
}
