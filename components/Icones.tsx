/**
 * Les trois icônes du site, en SVG.
 *
 * Elles étaient écrites en caractères Unicode - « ⌕ » pour la loupe, « ☾ » et
 * « ☀ » pour le thème. C'est tentant parce que c'est court, mais ces glyphes
 * appartiennent à des blocs que peu de polices couvrent : selon la machine, ils
 * tombaient sur une police de repli, changeaient d'épaisseur et de taille
 * optique, et « ⌕ » s'affichait parfois comme un rectangle vide. Un tracé
 * explicite rend le même dessin partout.
 *
 * `currentColor` et `stroke-width` relatif : les icônes suivent la couleur et
 * la graisse du texte qui les entoure, sans qu'on ait à les accorder à la main
 * dans le thème clair et dans le thème sombre.
 */

type Props = { className?: string; taille?: number };

function Svg({ children, className, taille = 18 }: Props & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={taille}
      height={taille}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

export function IconeLoupe(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" />
    </Svg>
  );
}

export function IconeLune(props: Props) {
  return (
    <Svg {...props}>
      <path d="M20 14.2A8.4 8.4 0 1 1 9.8 4a6.6 6.6 0 0 0 10.2 10.2Z" />
    </Svg>
  );
}

export function IconeSoleil(props: Props) {
  return (
    <Svg {...props}>
      <circle cx="12" cy="12" r="4.4" />
      <path d="M12 2.6v2.2M12 19.2v2.2M4.4 12H2.2M21.8 12h-2.2M6.6 6.6 5 5M19 19l-1.6-1.6M17.4 6.6 19 5M5 19l1.6-1.6" />
    </Svg>
  );
}
