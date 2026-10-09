import Link from 'next/link';
import RechercheGlobale from './RechercheGlobale';

const LIENS = [
  { href: '/candidats/', libelle: 'Candidats' },
  { href: '/partis/', libelle: 'Partis' },
  { href: '/themes/', libelle: 'Thèmes' },
  { href: '/comparateur/', libelle: 'Comparateur' },
  { href: '/methodologie/', libelle: 'Méthodologie' },
];

export default function EnTete() {
  return (
    <header className="zone-sure-haut sticky top-0 z-40 border-b border-slate-200 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="zone-sure-cotes mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <Link href="/" className="font-semibold tracking-tight">
          Présidentielle 2027
        </Link>
        <nav aria-label="Navigation principale" className="order-3 w-full sm:order-2 sm:w-auto">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {LIENS.map((lien) => (
              <li key={lien.href}>
                <Link
                  href={lien.href}
                  className="rounded text-slate-600 underline decoration-transparent underline-offset-4 hover:text-slate-900 hover:decoration-slate-400 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  {lien.libelle}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="order-2 ml-auto sm:order-3">
          <RechercheGlobale />
        </div>
      </div>
    </header>
  );
}
