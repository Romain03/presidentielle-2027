import Link from 'next/link';
import ChoixTheme from './ChoixTheme';
import NavigationPrincipale from './NavigationPrincipale';
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
    <header className="entete zone-sure-haut sticky top-0 z-40 border-b border-stone-900/8 bg-creme/85 backdrop-blur-md dark:border-nuit-bord dark:bg-nuit/85">
      <div className="gouttiere mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4 pb-1 pt-3 lg:pb-3">
          <Link href="/" className="whitespace-nowrap font-serif text-lg font-semibold tracking-tight">
            Présidentielle 2027
          </Link>

          {/*
            La navigation ne tient sur la même ligne qu'à partir de 1024 pixels :
            en dessous, six rubriques, le titre et la recherche débordaient.
          */}
          <NavigationPrincipale liens={liens} variante="ligne" />

          <div className="flex shrink-0 items-center gap-2">
            <RechercheGlobale />
            <ChoixTheme />
          </div>
        </div>

        {/*
          Sur mobile, la navigation défile horizontalement plutôt que de passer
          à la ligne : l'en-tête garde une hauteur constante.
        */}
        <NavigationPrincipale liens={liens} variante="defilante" />
      </div>
    </header>
  );
}
