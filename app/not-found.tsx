import Link from 'next/link';

export default function Introuvable() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Page introuvable</h1>
      <p className="text-stone-700 dark:text-stone-300">
        Cette page n’existe pas ou a été déplacée.
      </p>
      <Link href="/" className="underline underline-offset-2">
        Retour à l’accueil
      </Link>
    </div>
  );
}
