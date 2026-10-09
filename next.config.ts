import type { NextConfig } from 'next';

/**
 * GitHub Pages sert un dépôt de projet depuis un sous-chemin
 * (`/nom-du-depot/`). La variable permet de construire pour ce sous-chemin
 * sans changer le comportement en local, où le site reste à la racine.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};

export default nextConfig;
