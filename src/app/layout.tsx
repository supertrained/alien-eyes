import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { AccountNav } from '@/components/account/account-nav';
import { ThemeToggle } from '@/components/landing/theme-toggle';
import './globals.css';

export const metadata: Metadata = {
  title: 'Alien Eyes | Outside-in product audits',
  description: 'Alien Eyes audits the live product your users and agents actually touch, then returns paste-ready findings for the fix loop.',
  metadataBase: new URL('https://alieneyes.dev'),
  openGraph: {
    title: 'Alien Eyes | Outside-in product audits',
    description: 'Point Alien Eyes at a live URL and get celebration-first findings, agent-ready output, and an outside perspective on product quality.',
    url: 'https://alieneyes.dev',
    siteName: 'Alien Eyes',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Alien Eyes | Outside-in product audits',
    description: 'The outside perspective on what you build.'
  }
};

export default function RootLayout({ children }: { children: Readonly<ReactNode> }) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <header className="shell site-header">
          <div className="site-mark">
            <span className="eyebrow">Alien Eyes</span>
          </div>
          <div className="header-actions">
            <AccountNav />
            <ThemeToggle />
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
