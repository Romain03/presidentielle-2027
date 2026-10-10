import type { Metadata, Viewport } from 'next';
import './globals.css';
import ApparitionPage from '@/components/ApparitionPage';
import { SCRIPT_AVANT_PEINTURE } from '@/components/ChoixTheme';
import EnTete from '@/components/EnTete';
import PiedDePage from '@/components/PiedDePage';
import RetourEnHaut from '@/components/RetourEnHaut';
import ServiceWorker from '@/components/ServiceWorker';

// Next applique le basePath aux liens de navigation, mais pas aux URL
// déclarées dans les métadonnées : on les préfixe nous-mêmes.
const base = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const metadata: Metadata = {
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  title: {
    default: 'Présidentielle 2027 - candidats, partis et programmes',
    template: '%s - Présidentielle 2027',
  },
  description:
    'Explorer l’élection présidentielle française de 2027 : candidats, partis et positions par thème, avec la source et la date de chaque information.',
  applicationName: 'Élection 2027',
  manifest: `${base}/manifest.webmanifest`,
  icons: {
    icon: [{ url: `${base}/favicon.png`, sizes: '32x32', type: 'image/png' }],
    apple: [{ url: `${base}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' }],
  },
  /*
   * Les liens du comparateur sont faits pour être partagés : sans image, ils
   * apparaissaient comme une vignette vide dans les messageries.
   *
   * Pas de préfixe `base` ici, contrairement au manifeste et aux icônes :
   * les URL d'Open Graph sont résolues contre `metadataBase`, qui contient
   * déjà le chemin de base. Les préfixer le doublait.
   */
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'Présidentielle 2027',
    images: [{ url: '/partage.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/partage.png'],
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
  themeColor: '#faf7f1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/*
          Le thème est appliqué avant la première peinture : sans cela, un
          lecteur ayant choisi le sombre verrait le fond crème clignoter à
          chaque chargement.
        */}
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_AVANT_PEINTURE }} />
      </head>
      <body className="min-h-screen bg-creme font-sans text-stone-900 antialiased dark:bg-nuit dark:text-stone-100">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-stone-900 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white dark:focus:bg-white dark:focus:text-stone-900"
        >
          Aller au contenu
        </a>
        <EnTete />
        <main
          id="contenu"
          className="gouttiere mx-auto w-full max-w-6xl py-8 sm:py-10"
        >
          <ApparitionPage>{children}</ApparitionPage>
        </main>
        <PiedDePage />
        <RetourEnHaut />
        <ServiceWorker />
      </body>
    </html>
  );
}
