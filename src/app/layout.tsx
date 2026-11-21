import type { Metadata } from 'next';
import './globals.css';
import { SAFETY_DISCLAIMER } from '@/lib/pregnancy';

export const metadata: Metadata = {
  title: 'Enat Plus | Maternal Health Companion for Ethiopia',
  description: 'Every Week Matters. Every Mother Matters. Maternal health companion and clinic care coordination for Ethiopia.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-warm-50 text-stone-800 flex flex-col min-h-screen">
        <main className="flex-1 flex flex-col">
          {children}
        </main>

        <footer className="bg-stone-100 border-t border-stone-200 py-6 px-4 text-xs text-stone-600">
          <div className="max-w-4xl mx-auto space-y-2 text-center">
            <p className="font-semibold text-enat-800 tracking-wide">
              Enat Plus • Every Week Matters. Every Mother Matters.
            </p>
            <p className="text-stone-500 leading-relaxed max-w-2xl mx-auto">
              {SAFETY_DISCLAIMER}
            </p>
            <p className="text-[11px] text-stone-400">
              © {new Date().getFullYear()} Enat Plus Ethiopia. All rights reserved. No diagnosis or risk scoring provided.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
