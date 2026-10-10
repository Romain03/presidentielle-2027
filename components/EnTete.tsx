import Link from 'next/link';
import RechercheGlobale from './RechercheGlobale';
import { etatDuTest } from '@/lib/test';

const LIENS = [
  { href: '/candidats/', libelle: 'Candidats' },
  { href: '/partis/', libelle: 'Partis' },
  { href: '/themes/', libelle: 'Thèmes' },
  { href: '/familles/', libelle: 'Familles' },
  { href: '/comparateur/', libelle: 'Comparateur' },
  { href: '/methodologie/', libelle: 'Méthodologie' },
];

export default function EnTete() {
  // Le test n'entre dans la navigation que lorsqu'il est réellement utilisable.
  const liens = etatDuTest().actif
    ? [...LIENS.slice(0, 4), { href: '/test/', libelle: 'Test' }, ...LIENS.slice(4)]
    : LIENS;

  return (
    <header className="zone-sure-haut sticky top-0 z-40 border-b border-stone-900/8 bg-creme/85 backdrop-blur-md dark:border-nuit-bord dark:bg-nuit/85">
      <div className="gouttiere mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4 pb-1 pt-3 lg:pb-3">
          <Link href="/" className="whitespace-nowrap font-serif text-lg font-semibold tracking-tight">
            Présidentielle 2027
          </Link>

          {/*
            La navigation ne tient sur la même ligne qu'à partir de 1024 pixels :
            en dessous, six rubriques, le titre et la recherche débordaient.
          */}
          <nav aria-label="Navigation principale" className="hidden lg:block">
            <ul className="flex items-center gap-5 text-sm">
              {liens.map((lien) => (
                <li key={lien.href}>
                  <Link
                    href={lien.href}
                    className="text-stone-600 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
                  >
                    {lien.libelle}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <RechercheGlobale />
        </div>

        {/*
          Sur mobile, la navigation défile horizontalement plutôt que de passer
          à la ligne : l'en-tête garde une hauteur constante.
        */}
        <nav aria-label="Navigation principale" className="lg:hidden">
          <ul className="sans-barre-defilement -mx-4 flex gap-1 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {liens.map((lien) => (
              <li key={lien.href} className="shrink-0">
                <Link
                  href={lien.href}
                  className="inline-flex min-h-10 items-center rounded-full px-3.5 text-sm text-stone-600 transition-colors hover:bg-creme-ombre hover:text-stone-900 dark:text-stone-400 dark:hover:bg-nuit-clair dark:hover:text-stone-100"
                >
                  {lien.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
