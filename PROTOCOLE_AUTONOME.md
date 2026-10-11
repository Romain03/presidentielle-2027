# Protocole de mise à jour autonome

Ce fichier est l'instruction d'une session qui tourne **sans personne devant
l'écran**. Elle démarre sans mémoire des conversations précédentes : tout ce
qu'elle doit savoir est ici.

Elle agit sur un site public consacré à une élection. Une erreur n'y est pas un
bug : c'est une fausse information sur une candidature réelle. Le protocole est
donc écrit pour qu'en cas de doute, **la session ne change rien et le signale** -
jamais l'inverse.

---

## 1. Le cycle

À chaque exécution, dans cet ordre :

1. `npm ci` puis `npm run veille` - le rapport dit ce qui a bougé.
2. Pour chaque **changement d'état annoncé dans la presse**, appliquer le test de
   véracité du §3.
3. Appliquer les modifications que le §2 autorise, et elles seules.
4. `npm run valider` puis `npm test`. **Si un seul test échoue, ne rien
   pousser** : committer le travail sur une branche, ouvrir un ticket, s'arrêter.
5. `python3 scripts/generer-journal.py`, committer, pousser sur `main`.
6. Rendre compte dans le ticket de veille : ce qui a été changé, ce qui a été
   écarté, et pourquoi.

---

## 2. Ce qui peut être modifié seul, et rien d'autre

| Autorisé | Condition |
|---|---|
| **Statut d'une candidature** (`statut`, `statut_date`, `statut_sources`) | Test de véracité réussi, §3 |
| **Processus de désignation** d'un parti | Test de véracité réussi |
| **Ajout** d'une proposition | Article lu en entier, §3 et §4 |
| **Ajout d'une source** à une proposition existante | Article lu, et il porte bien la mesure décrite |
| **Précision factuelle** sur une fiche | Source lue |
| **`derniere_verification`** des entrées touchées | Toujours, à la date du jour |
| **`DONNEES_A_VERIFIER.md`** | Toujours, et c'est le réflexe par défaut |

**Interdit sans un humain, sans exception :**

- **supprimer** une proposition, une candidature, un parti ou une source. Un
  retrait de données se demande, il ne se décide pas la nuit ;
- modifier un **résumé** ou un **détail** existant autrement qu'en y **ajoutant**
  ce qu'une nouvelle source atteste. Réécrire, c'est substituer son jugement à
  celui qui a lu l'article ;
- toucher à `lib/`, `app/`, `components/`, aux tests, aux schémas, aux workflows.
  Ce protocole porte sur les **données**, pas sur le code ;
- changer la **couleur**, la **famille politique** ou la **nuance** d'un parti :
  ce sont des conventions, et elles se discutent ;
- **créer une proposition à partir d'un article payant seul** (`HOTES_PAYANTS`
  dans `lib/schemas.ts`). Un test l'interdit déjà ; ne pas chercher à le
  contourner.

---

## 3. Le test de véracité

Un titre n'est pas une information. Avant de changer un statut :

1. **Ouvrir l'article et le lire.** Pas le titre, pas le résumé du moteur de
   recherche : l'article.
2. **Vérifier la date de publication**, et qu'elle concerne bien le scrutin de
   **2027**.
3. **Trouver une seconde source indépendante** qui dit la même chose, et la lire
   aussi. Deux rédactions, pas deux reprises de la même dépêche sur deux sites
   du même groupe.
4. **Relever les chiffres exacts** et les recouper entre les deux sources. S'ils
   diffèrent, voir §5.

Si l'un des quatre points échoue : **ne rien changer dans `data/`**, consigner
dans `DONNEES_A_VERIFIER.md` avec les adresses consultées, et le dire dans le
compte rendu.

### Médias dont la lecture est possible

`franceinfo.fr`, `la1ere.franceinfo.fr`, `publicsenat.fr`, `lcp.fr`,
`vie-publique.fr`, `france24.com`, `20minutes.fr`, `la-croix.com`,
`radiofrance.fr`, et les sites officiels des candidats et des partis.

`lemonde.fr`, `lefigaro.fr`, `liberation.fr`, `lesechos.fr` exigent un
abonnement : jamais source unique. `lesechos.fr` est derrière une détection de
robot qu'**il ne faut pas contourner**.

---

## 4. Les pièges déjà rencontrés

Ils ont tous failli faire écrire une fausseté. Les vérifier à chaque fois.

- **Les articles de 2022.** Les moteurs remontent en tête des panoramas de la
  campagne précédente, sans date visible. Signes : Pécresse, Hidalgo, Jadot,
  Poutou, Taubira présentés comme candidats. Cinq pièges évités en une seule
  journée le 10 octobre 2026. **Vérifier la date avant la source**, toujours.
- **Les horodatages cachés.** Une page de parti sans date visible porte souvent
  un horodatage dans son code (`1643789697` = février 2022).
- **Les titres interrogatifs.** « Glucksmann vainqueur dès le premier tour ? »
  publié six jours *avant* le scrutin est une émission de débat, pas un
  résultat. Un point d'interrogation n'annonce rien.
- **Les résumés de moteur de recherche.** Ils synthétisent plusieurs sources et
  plusieurs années. Pour Delphine Batho, le résumé annonçait une sortie du
  nucléaire et l'arrêt des EPR : cela venait de la primaire écologiste de
  **2021**, et l'article réel ne contenait qu'une phrase. **Ne jamais citer un
  article sur la foi de son résumé.**
- **Les sites agrégateurs.** `votons-2027.fr`, `elyseescope.com`,
  `monvote2027.fr`, `presi2027.fr` et semblables ne citent pas leurs sources et
  paraissent générés. L'un attribuait à Bruno Retailleau un âge de départ à
  64 ans quand il avait annoncé 63. **Écartés, sans exception.** Un site miroir
  attribuait aussi à 20 Minutes un panorama qui renvoie une 404 sur son propre
  site.
- **Le parti n'est pas le candidat.** Les propositions publiées par un parti ne
  sont pas celles de son candidat. Les lui attribuer est l'inférence que ce
  dépôt interdit.
- **Les pages vivantes.** Une page de programme n'a pas de date de publication
  et peut être réécrite sous une citation qui ne bouge pas. C'est ce que
  surveille `veille/empreintes.json`.

---

## 5. Quand s'arrêter

Ne rien changer, consigner, et le dire, dans ces cas :

- **deux sources se contredisent** sur un chiffre ou un statut ;
- **une seule source** existe pour un changement de statut ;
- le changement impliquerait de **supprimer** quelque chose ;
- une candidature semble **retirée sans déclaration explicite** : c'est le cas
  d'un battu de primaire, où c'est le règlement qui tranche et non l'intéressé.
  Le statut `retire` est alors acceptable, mais la précision affichée doit dire
  qu'aucun désistement n'a été relevé ;
- un **test échoue** après la modification ;
- le doute subsiste après lecture. **Le doute se consigne, il ne s'arbitre pas.**

---

## 6. Le compte rendu

Dans le ticket de veille, à chaque exécution, même sans changement :

```
## Mise à jour autonome du <date>

### Appliqué
- <quoi>, d'après <source 1> et <source 2>, lues le <date>

### Écarté
- <quoi> : <pourquoi> (piège de 2022, source unique, contradiction…)

### Consigné dans DONNEES_A_VERIFIER
- <quoi>
```

Écrire ce qui a été **écarté** autant que ce qui a été appliqué : c'est la seule
façon de vérifier que le protocole a été suivi.

---

## 7. Arrêter l'automatisation

Désactiver le workflow dans l'onglet *Actions* du dépôt, ou supprimer
`.github/workflows/mise-a-jour-autonome.yml`. Les modifications de données
arrivent toutes par un commit signé `[auto]` sur `main` : `git log` les isole,
`git revert` les annule.
