# Présidentielle 2027

Application web statique pour explorer l'élection présidentielle française de
2027 : les candidats, leurs partis, et leurs positions thème par thème. Chaque
information affichée porte sa source et sa date ; l'absence d'information est
affichée comme telle et jamais comblée.

**État au 9 octobre 2026 :** 44 candidats, 33 partis, 57 propositions sourcées
sur 11 des 12 thèmes. La couverture est volontairement inégale : elle suit ce qui est
réellement sourçable, et la plupart des programmes ne sont pas encore publiés.
Les lacunes sont documentées dans [`DONNEES_A_VERIFIER.md`](DONNEES_A_VERIFIER.md).

---

## Lancement en local

```bash
npm install
npm run dev
```

Le site est servi sur <http://localhost:3000>.

| Commande | Effet |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run build` | Génération statique dans `out/` |
| `npm test` | Tests unitaires (Vitest) |
| `npm run valider` | Rapport de validation lisible des données |

Pour prévisualiser le site généré :

```bash
npm run build && npx serve out
```

---

## Utiliser l'application sur iPhone

Le site est une **application web installable** (PWA) : ajoutée à l'écran
d'accueil, elle s'ouvre en plein écran, sans la barre de Safari, avec sa propre
icône.

### Sur le réseau local

Depuis le Mac :

```bash
npm run mobile
```

Cela construit le site et le sert sur le réseau local, port 4321. Sur l'iPhone,
**connecté au même Wi-Fi**, ouvrir dans Safari :

```
http://<adresse-ip-du-mac>:4321
```

Pour trouver l'adresse IP du Mac : `ipconfig getifaddr en0`.

Puis, dans Safari : bouton **Partager** → **Sur l'écran d'accueil**. L'icône
« Élection 2027 » apparaît avec les autres applications.

Limite : le Mac doit être allumé et sur le même réseau. Pour un accès depuis
n'importe où, il faut déployer le site (voir ci-dessous).

### Déploiement

`npm run build` produit un site entièrement statique dans `out/`, sans serveur
ni base de données. Il se déploie tel quel sur n'importe quel hébergeur
statique. Une fois en ligne en HTTPS, l'installation sur l'écran d'accueil se
fait de la même manière, depuis n'importe quelle connexion - et le mode hors
ligne s'active.

**GitHub Pages** est préconfiguré : `.github/workflows/deploiement.yml`
construit le site et le publie à chaque `push` sur `main`. Le workflow exécute
les tests d'abord, donc une donnée malformée ou une proposition sans source
bloque le déploiement.

Un dépôt de projet est servi depuis un sous-chemin
(`https://<compte>.github.io/<dépôt>/`). Le workflow passe donc
`NEXT_PUBLIC_BASE_PATH=/<nom-du-dépôt>` à la construction ; en local la
variable est absente et le site reste à la racine. Il crée aussi un fichier
`.nojekyll`, sans lequel GitHub Pages ignorerait le dossier `_next` et ne
servirait rien.

Pour un autre hébergeur servant à la racine (Vercel, Netlify, Cloudflare
Pages), il n'y a aucune variable à définir : il suffit de publier `out/`.

### Application iOS native

Une coque Capacitor est en place dans `ios/`, avec le site entier embarqué dans
le binaire. Elle n'est pas publiée : il manque Xcode sur la machine et une
adhésion au programme développeur Apple. La procédure complète, les risques et
l'alternative sont décrits dans [`APPSTORE.md`](APPSTORE.md).

```bash
npm run ios          # construit le site et le recopie dans la coque
npm run ios:ouvrir   # ouvre le projet dans Xcode
```

### Mode hors ligne

Un service worker (`public/sw.js`) rend consultables hors connexion les pages
déjà visitées. Les actifs versionnés de `_next/static/` sont servis depuis le
cache ; les pages et les données passent par le réseau d'abord, le cache ne
servant que de secours - une mise à jour en ligne l'emporte donc toujours. Les
navigateurs refusent d'enregistrer un service worker hors HTTPS : il reste
inactif tant que le site n'est pas déployé.

### Ce qui a été prévu pour iOS

- Manifeste d'application, icônes 180/192/512 et icône *maskable*.
- Ouverture en mode autonome (`apple-mobile-web-app-capable`), car Safari lit
  encore cette balise en plus de la balise standard.
- Couleur de barre d'état adaptée au thème clair et au thème sombre.
- Marges pour l'encoche et la barre d'accueil (`env(safe-area-inset-*)`).
- Détection téléphonique désactivée : sans cela, iOS transforme les nombres
  affichés - âges, montants, annuités - en liens d'appel.
- Mise en page pensée pour mobile d'abord ; les tableaux larges défilent dans
  leur propre cadre, jamais la page.

---

## Architecture

```
app/          Pages (App Router, génération statique)
components/   Composants d'affichage
data/         Les quatre fichiers de données - la seule chose à éditer au quotidien
lib/
  schemas.ts  Schémas Zod : la source de vérité du format
  data.ts     Chargement, validation et intégrité référentielle
  comparateur.ts, recherche.ts, format.ts, vues.ts
scripts/      Rapport de validation
tests/        Tests de validation et de logique
```

Pile : Next.js (App Router), TypeScript, Tailwind CSS, Zod, Vitest.
`output: 'export'` : aucun serveur, aucune API. Filtres, comparateur et
recherche s'exécutent côté client sur un index construit au build.

### Garanties par construction

- **Pas de proposition sans source.** `source.url` et `source.date` sont
  obligatoires dans le schéma. Une proposition non sourcée fait échouer
  `npm run build`.
- **L'absence n'est pas une donnée.** Aucun enregistrement n'indique qu'un
  candidat ne s'est pas exprimé : « Position non communiquée » est calculé à
  l'affichage, à partir de l'absence de proposition.
- **La date de mise à jour est dérivée.** C'est le maximum des champs
  `derniere_verification` ; elle ne se saisit pas et ne peut donc pas mentir.
- **Les clés inconnues sont refusées.** Les schémas sont `strict()` : une faute
  de frappe dans un nom de champ arrête le build au lieu d'être ignorée.

---

## Mettre à jour les données

Tout se passe dans `data/`. Rien à modifier dans le code.

### 1. Trouver une source

Par ordre de préférence : programme officiel, site de campagne, site du parti,
Conseil constitutionnel, Journal officiel, livre, discours, interview,
communiqué, article de presse. Noter l'URL, le titre et la **date de
publication** de la source - pas la date de consultation.

Les sites agrégateurs de programmes sont écartés : voir la section 3 de
[`DONNEES_A_VERIFIER.md`](DONNEES_A_VERIFIER.md).

### 2. Ajouter un candidat

Dans `data/candidats.json` :

```jsonc
{
  "id": "prenom-nom",            // slug, minuscules et tirets
  "nom": "Nom",                  // le tri alphabétique se fait là-dessus
  "prenom": "Prénom",
  "parti_id": "un-parti",        // ou null si sans étiquette
  "statut": "declare",           // investi | declare | pressenti | retire
  "statut_date": "2026-07-07",   // ou null si la date n'est pas vérifiée
  "statut_source": { "url": "…", "titre": "…", "type": "…", "date": "…" },
  "parcours": [],                // jalons factuels, chacun avec sa source
  "soutiens": [],
  "precisions": [],              // faits complémentaires, source obligatoire
  "liens_officiels": [],
  "derniere_verification": "2026-10-09"
}
```

Si le parti n'existe pas encore, l'ajouter d'abord dans `data/partis.json`.

### 3. Ajouter une proposition

Dans `data/propositions.json` :

```jsonc
{
  "id": "candidat-theme",
  "candidat_id": "prenom-nom",
  "theme_id": "retraites",
  "resume": "…",                 // 260 caractères maximum, dans les termes du candidat
  "detail": "…",
  "citation": null,              // verbatim court, ou null
  "nature": "programme_officiel",// ou "declaration_publique"
  "indicateurs": [               // chiffres énoncés par le candidat ; facultatif
    { "libelle": "Âge légal de départ", "valeur": 63, "unite": "ans" }
  ],
  "source": { "url": "…", "titre": "…", "type": "…", "date": "…" },
  "derniere_verification": "2026-10-09"
}
```

Trois règles :

- **`nature`** distingue une mesure inscrite dans un programme publié d'une
  position exprimée oralement. Dans le doute, c'est une déclaration publique.
- **Si un candidat ne s'est pas exprimé, ne rien écrire.** Ne pas créer une
  proposition vide : le site affichera « Position non communiquée ».
- **Les `indicateurs` servent à la comparaison**, leurs libellés et unités sont
  donc harmonisés entre candidats. Le `resume` et le `detail` conservent les
  termes du candidat.

### 4. Vérifier

```bash
npm run valider   # erreurs bloquantes + avertissements de couverture
npm test          # schémas, intégrité, comparateur, recherche
npm run build     # échoue si une donnée est invalide
```

`npm run valider` liste toutes les erreurs d'un coup, là où le build s'arrête à
la première. Il signale aussi, sans bloquer, les candidats sans proposition, les
dates de statut non vérifiées et les propositions non revérifiées depuis plus de
six mois.

### 5. Consigner ce qui reste incertain

Toute information douteuse, contradictoire ou non sourçable va dans
[`DONNEES_A_VERIFIER.md`](DONNEES_A_VERIFIER.md), pas dans `data/`.

### Revérification périodique

Les positions évoluent. Reprendre chaque source, mettre `derniere_verification`
à la date du jour si l'information tient toujours, et corriger sinon. Les
échéances déjà identifiées sont listées dans `DONNEES_A_VERIFIER.md`.

---

## Test de proximité

`/test/` compare les réponses de l'utilisateur aux chiffres annoncés par les
candidats. C'est le seul endroit du site qui produit un pourcentage.

Le principe tient en une phrase : **aucune question n'est inventée**. Chacune
porte sur un indicateur chiffré qu'au moins quatre candidats ont énoncé
eux-mêmes, et leur position est reprise telle quelle - on ne cherche jamais à
deviner s'ils seraient « pour » ou « contre » une formulation abstraite.

Les questions vivent dans `data/questions.json` et désignent un indicateur par
son libellé. Les positions des candidats ne sont donc pas saisies à la main :
elles sont déduites du champ `valeur_comparable` des propositions, une
réduction numérique explicite de la valeur affichée. Ce champ vaut `null`
quand la comparaison serait trompeuse - « 2 000 euros bruts » contre
« 1 700 euros nets », « 3 % par an » contre « 20 % sur le quinquennat ».

**Le test reste éteint tant que les données ne suivent pas** : il faut au moins
huit questions retenues et six candidats ayant une position sur la moitié
d'entre elles. Ces seuils sont dans `lib/test.ts`. `npm run valider` affiche à
chaque exécution l'état du test et ce qui manque :

```
Test de proximité : éteint - 2/8 questions retenues, 12/6 candidats classables
```

Tant qu'il est éteint, la page explique la méthode et ce qui manque, et le lien
n'apparaît pas dans la navigation. Le calcul vit dans `lib/test-calcul.ts`,
volontairement sans dépendance aux données pour ne pas embarquer les
propositions dans le bundle client.

## Neutralité

Même structure, même niveau de détail et même ton factuel pour tous les
candidats ; ordre alphabétique partout ; aucun classement éditorial. Le
comparateur signale des divergences **structurelles** - positions renseignées
formulées différemment, valeurs chiffrées qui diffèrent - et ne calcule aucun
score de proximité ni aucun placement sur un axe. La page Méthodologie du site
expose ces règles, la correspondance entre nuances officielles et familles
politiques, et les limites connues.

Les couleurs de parti sont un repère : une forme et un libellé portent toujours
la même information. Les portraits viennent de Wikimedia Commons, librement
réutilisables, avec leur auteur et leur licence affichés ; ils sont choisis
mécaniquement - l'image principale de l'article Wikipédia - pour ne pas décider
quelle photographie avantage qui. `python3 scripts/recuperer-photos.py` les
régénère.
