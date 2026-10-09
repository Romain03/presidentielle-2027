import type { Metadata, Viewport } from 'next';
import './globals.css';
import EnTete from '@/components/EnTete';
import PiedDePage from '@/components/PiedDePage';
import ServiceWorker from '@/components/ServiceWorker';

// Next applique le basePath aux liens de navigation, mais pas aux URL
// déclarées dans les métadonnées : on les préfixe nous-mêmes.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: 'Présidentielle 2027 — candidats, partis et programmes',
    template: '%s — Présidentielle 2027',
  },
  description:
    'Explorer l’élection présidentielle française de 2027 : candidats, partis et positions par thème, avec la source et la date de chaque information.',
  applicationName: 'Élection 2027',
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/favicon.png`, sizes: '32x32', type: 'image/png' }],
    apple: [{ url: `${base}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
  },
  // Installable sur l’écran d’accueil iOS, ouverte sans la barre de Safari.
  appleWebApp: {
    capable: true,
    title: 'Élection 2027',
    statusBarStyle: 'default',
  },
  // Les données sont pleines de nombres (âges, montants, annuités) : sans
  // cela, iOS les transforme en liens d’appel téléphonique.
  formatDetection: { telephone: false },
  // Next.js n’émet que `mobile-web-app-capable` ; Safari sur iOS lit encore
  // la variante Apple pour ouvrir l’application sans la barre du navigateur.
  other: { 'apple-mobile-web-app-capable': 'yes' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-white dark:focus:text-slate-900"
        >
          Aller au contenu
        </a>
        <EnTete />
        <main
          id="contenu"
          className="zone-sure-cotes mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
        >
          {children}
        </main>
        <PiedDePage />
        <ServiceWorker />
      </body>
    </html>
  );
}
