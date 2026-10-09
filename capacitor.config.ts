import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Coque native iOS.
 *
 * `webDir: 'out'` embarque le site statique dans le binaire : l'application
 * fonctionne hors ligne dès l'installation, sans aucun accès réseau. C'est la
 * différence principale avec le site, et l'argument principal face à la règle
 * 4.2 d'Apple sur les applications « simplement réempaquetées ».
 *
 * L'identifiant suit le domaine déjà contrôlé par l'auteur (romain03.github.io),
 * inversé selon la convention Apple.
 */
const config: CapacitorConfig = {
  appId: 'io.github.romain03.presidentielle2027',
  appName: 'Élection 2027',
  webDir: 'out',
  ios: {
    contentInset: 'never',
    backgroundColor: '#faf7f1',
  },
};

export default config;
