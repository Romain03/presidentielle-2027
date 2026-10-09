# Publier l'application sur l'App Store

Ce document décrit ce qui est prêt, ce qui manque, et les risques réels.

---

## 1. Ce qui est déjà fait

Une coque native iOS est en place (Capacitor 8, Swift Package Manager, pas de
CocoaPods) :

```
ios/App/App.xcodeproj      projet Xcode généré
ios/App/App/public/        le site entier, 96 pages, 8,8 Mo, embarqué
capacitor.config.ts        identifiant, nom, couleur de fond
scripts/generer-icones.py  icônes web et iOS, reproductibles
```

- **Identifiant** : `io.github.romain03.presidentielle2027`, dérivé du domaine
  déjà contrôlé.
- **Nom affiché** : « Élection 2027 ».
- **Icône** et **écran de lancement** installés, avec variante sombre.
- **Partage natif** sur les fiches candidat : feuille de partage iOS dans
  l'application, API du navigateur sur le web, copie du lien à défaut.
- Le service worker se désactive dans la coque : le contenu est déjà dans le
  binaire, un cache supplémentaire ne ferait que risquer de figer une version.

Pour régénérer la coque après une modification du site :

```bash
npm run ios          # construit le site et le recopie dans ios/
npm run ios:ouvrir   # ouvre le projet dans Xcode
```

---

## 2. Ce qu'il te reste à faire

### Xcode

La machine n'a que les Command Line Tools. Il faut Xcode complet, gratuit mais
volumineux (environ 10 Go), depuis le Mac App Store. Puis, une fois installé :

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
```

Cette commande demande ton mot de passe : je ne peux pas l'exécuter.

### Compte développeur Apple

**99 € par an**, avec vérification d'identité, sur
<https://developer.apple.com/programs/>. Sans adhésion, on peut installer
l'application sur son propre iPhone pour sept jours, mais rien publier.

---

## 3. Procédure

1. `npm run ios` puis `npm run ios:ouvrir`.
2. Dans Xcode, sélectionner la cible **App**, onglet **Signing & Capabilities**,
   choisir ton équipe de développement. Xcode gère le certificat et le profil.
3. Tester dans le simulateur, puis sur ton iPhone branché en USB.
4. Renseigner la version dans **General** : `MARKETING_VERSION` (1.0) et
   `CURRENT_PROJECT_VERSION` (1), à incrémenter à chaque envoi.
5. **Product → Archive**, puis **Distribute App → App Store Connect**.
6. Sur <https://appstoreconnect.apple.com>, créer la fiche, joindre le build,
   remplir les informations ci-dessous, et soumettre.

Compter deux à sept jours d'examen pour une première soumission.

---

## 4. Le risque principal : la règle 4.2

Apple refuse les applications qui ne sont « qu'un site web réempaqueté »
(*Minimum Functionality*). Une coque Capacitor autour d'un site statique est le
cas d'école. **C'est le risque de refus le plus probable, et il est sérieux.**

Ce que l'application apporte déjà et qu'un site ne peut pas apporter :

- **Fonctionnement intégralement hors ligne dès l'installation.** Les 96 pages
  et les données sont dans le binaire. Aucune requête réseau n'est nécessaire,
  jamais - y compris à la toute première ouverture, ce qu'une PWA ne sait pas
  faire. C'est l'argument central à mettre en avant dans les notes de
  soumission.
- Feuille de partage native.

C'est honnêtement **mince**. Si la première soumission est refusée, les ajouts
qui renforceraient le dossier, par ordre de rapport utilité / effort :

1. **Notifications locales** quand les données publiées changent - l'application
   compare la date de vérification distante à celle embarquée. Utile en soi :
   la primaire socialiste et la parution de L'Avenir en commun vont modifier les
   données sous peu.
2. **Widget d'écran d'accueil** (WidgetKit, code Swift) : compte à rebours vers
   le 18 avril 2027 et une proposition tirée au sort. Très visible, très
   « natif ».
3. **Indexation Spotlight** des candidats : chercher un nom dans la recherche
   iPhone ouvre sa fiche.
4. **Favoris locaux** : suivre quelques candidats, données stockées sur
   l'appareil.

### Contenu politique

Les applications liées à une élection font l'objet d'un examen renforcé, et
Apple exige dans certains cas que l'éditeur soit une entité vérifiée plutôt
qu'un particulier. **À vérifier avant de payer les 99 €** dans la version en
vigueur des *App Review Guidelines*, sections 1.1.1, 4.7 et 5.6. Si cette
exigence s'applique, une publication à titre personnel peut être bloquée quelle
que soit la qualité de l'application.

La page Méthodologie, le sourçage systématique et l'affichage explicite des
positions manquantes sont des atouts dans ce contexte : l'application ne prend
pas parti et le démontre.

---

## 5. Fiche App Store à préparer

**Nom** : Élection 2027
**Sous-titre** : Candidats, partis et programmes

**Catégorie** : Actualités, ou Références.

**Description** - points à couvrir : ce que fait l'application, le sourçage
systématique, l'affichage des positions non communiquées, l'ordre alphabétique
et l'absence de classement, le fonctionnement hors ligne, le lien vers la
méthodologie.

**Captures d'écran** obligatoires : iPhone 6,9 pouces et 6,5 pouces. À prendre
dans le simulateur une fois Xcode installé.

**Notes pour l'examinateur** : insister sur le fonctionnement hors ligne total
et sur la neutralité éditoriale. Indiquer que les données sont publiques et
sourcées, et que l'application n'est affiliée à aucun parti ni candidat.

**Confidentialité** : l'application **ne collecte rien**. Pas de compte, pas
d'analytique, pas de traceur, aucune requête réseau hors les liens de sources
que l'utilisateur choisit d'ouvrir. Dans le questionnaire de confidentialité
d'App Store Connect, répondre « Aucune donnée collectée ». C'est un point fort,
à mentionner dans la description.

**URL d'assistance** : <https://github.com/Romain03/presidentielle-2027>

---

## 6. L'alternative, en toute honnêteté

La PWA installée depuis Safari offre déjà presque la même expérience : icône
sur l'écran d'accueil, plein écran, hors ligne après la première visite. Elle
coûte zéro euro, ne subit aucun examen, et se met à jour instantanément à
chaque `git push`.

L'App Store apporte de la visibilité, de la légitimité, et un vrai mode hors
ligne dès l'installation. Il apporte aussi 99 € par an, un risque de refus réel
au titre de la règle 4.2, et un délai à chaque mise à jour des données - ce qui
compte pour un sujet qui bouge toutes les semaines.
