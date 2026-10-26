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

0. `git pull --rebase origin main`. La veille de GitHub tourne de son côté et
   pousse sa mémoire : partir d'une copie en retard ferait échouer le `git push`
   de la fin.
1. `npm ci` puis `npm run veille -- --ecrire` - le rapport dit ce qui a bougé.
   **S'arrêter ici si `a_agir` vaut zéro**, et non si `evenements` vaut zéro :
   voir §7, la différence a déjà coûté six candidatures.
2. Traiter le rapport **section par section**, et pas seulement les changements
   d'état : une candidature annoncée par un nom inconnu, un nom relevé dans un
   panorama, une page de programme apparue sont autant de signaux distincts.
   Appliquer à chacun le test de véracité du §3.
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
| **Ajout d'un document** à `documents.json` | Fichier ouvert, daté, et postérieur au 1ᵉʳ janvier 2026 |
| **Précision factuelle** sur une fiche | Source lue |
| **`derniere_verification`** des entrées touchées | Toujours, à la date du jour |
| **`DONNEES_A_VERIFIER.md`** | Toujours, et c'est le réflexe par défaut |

**Interdit sans un humain, sans exception :**

- **créer une candidature ou un parti.** Une candidature nouvelle se signale et
  se consigne, elle ne s'enregistre pas seule : son étiquette est souvent
  contestée d'une rédaction à l'autre - trois versions pour Gilles Platret - et
  un mouvement récent n'a ni couleur ni famille établies, qui sont des
  conventions. Rassembler les deux sources, la date de déclaration et le nom
  exact du mouvement dans `DONNEES_A_VERIFIER.md` est le travail attendu : un
  humain n'a plus qu'à valider ;
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
- **Les PDF sans date, et c'est la règle.** Un document de programme n'affiche
  presque jamais sa date, vit à une adresse stable, et reste en ligne d'une
  campagne à l'autre. Le Rassemblement national publie toujours seize livrets
  thématiques sous le bouton « Découvrez le programme » : leurs fichiers ont été
  fabriqués **en janvier et février 2022**. Son bouton « le programme » mène au
  programme des **législatives de 2024**, et le PDF déposé sur le site de
  campagne de Jean-Luc Mélenchon est le contrat du Nouveau Front populaire de
  **juin 2024**. Avant de retenir un document : relever la date dans ses
  métadonnées (`/CreationDate`, `/ModDate`), vérifier qu'elle est postérieure à
  2026, et vérifier que le texte ne parle pas d'un autre scrutin. Sans date
  établie, le document se consigne, il ne se publie pas.
- **Le nombre de pages d'un PDF.** Compter les objets `/Type /Page` donne un
  chiffre faux quand le fichier contient des pages en double : deux documents de
  La Convention annonçaient ainsi le double de leur pagination réelle. C'est le
  `/Count` du nœud `/Type /Pages` qui fait foi.

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

## 7. Qui exécute ce protocole, et ce que ça coûte

Trois dispositifs, aux rôles différents, et aucun ne suffit seul.

**La veille**, dans `.github/workflows/veille.yml`, tourne chez GitHub deux fois
par jour, à 6 h et 18 h UTC. C'est un script Node : il n'appelle aucun modèle,
il ne coûte rien, et il tourne même machine éteinte. Il **signale** - il n'écrit
jamais dans `data/`.

**Ce protocole**, exécuté par une tâche planifiée de l'application Claude
(`presidentielle-veille`, **une fois par jour à 8 h 40 en heure locale**). Elle
tourne sur l'abonnement : **aucune facturation à l'usage, aucune clé API**. En
contrepartie elle ne s'exécute **que si l'application est ouverte** ; si elle
était fermée à l'heure prévue, la tâche part au lancement suivant.

Le passage du matin traite donc tout ce que la journée précédente a produit,
annonces de fin de soirée comprises - c'est ce que la veille de 18 h UTC a déjà
relevé de son côté.

**Le relais**, une routine cloud (`trig_01Y64gmf4Rf2ePqjxLdCsB8q`, 8 h 40 UTC,
soit une heure après la tâche locale), existe pour le cas où l'application
serait restée fermée. Elle tourne chez Anthropic, machine éteinte, clone le
dépôt, lit ce protocole et l'applique. Si la tâche locale a déjà fait le
travail, le relais ne trouve rien à faire et s'arrête tout de suite.

**Deux réglages restent à ouvrir pour que le relais serve.** Son premier essai,
le 26 octobre 2026, l'a montré sans ambiguïté :

1. **L'accès réseau sortant de l'environnement cloud est fermé.** Les sites de
   presse sont injoignables - `curl` renvoie un 403 sur le tunnel, `WebFetch`
   échoue en résolution DNS - et seuls `api.anthropic.com`, `registry.npmjs.org`
   et quelques dépôts de paquets passent. Conséquence : la veille a signalé
   `a_agir=76`, dont **55 faux liens morts et 21 faux documents injoignables**.
   À ouvrir dans les réglages de l'environnement (menu de l'environnement cloud
   dans la barre de titre de la session, puis *Edit*, puis *Network access*),
   au minimum pour les médias du §3 et les sites officiels des candidats.
2. **L'écriture sur les tickets GitHub est refusée** : `403 Resource not
   accessible by integration`. La lecture fonctionne. À corriger dans les
   droits de l'application GitHub installée sur le dépôt (*Issues: write*).

Tant que le premier point n'est pas levé, le relais ne peut rien vérifier. Il
ne fait pour autant aucun dégât, et son premier essai l'a prouvé : constatant
que les 76 signalements tombaient tous en échec de connexion, il a refusé de
les inscrire dans `DONNEES_A_VERIFIER.md` - « y inscrire ces 76 adresses aurait
fait passer une limite de cette session pour une vraie information » - et n'a
touché ni à `data/` ni au reste. C'est exactement la cinquième condition d'arrêt
du §5.

Cette asymétrie est voulue. Le signal doit être fiable même machine éteinte, et
c'est le rôle de la veille sur GitHub. La correction, elle, demande de lire des
articles et de juger : elle peut attendre que l'application soit ouverte.

`scripts/veille.ts` écrit deux compteurs sur sa sortie d'erreur, et **c'est
`a_agir` qui décide, jamais `evenements`**. `evenements` ne compte que les
changements d'état annoncés dans la presse sous un nom déjà présent dans les
données ; `a_agir` y ajoute les candidatures annoncées par un nom inconnu, les
noms relevés dans un panorama de rédaction et absents des données, les pages de
programme apparues, les documents injoignables ou réécrits et les liens morts.
C'est aussi `a_agir` qui fixe le code de sortie du script et déclenche
l'ouverture du ticket.

La distinction n'est pas théorique : le 26 octobre 2026, une exécution a
affiché `evenements=0` quand `a_agir=7` incluait **six candidatures absentes du
site**, dont celle de Natacha Polony, déclarée douze jours plus tôt et repérée
par un lecteur. S'arrêter sur `evenements` les aurait toutes manquées.

Si `a_agir` vaut zéro, le cycle s'arrête après l'étape 1 : inutile de lire quoi
que ce soit.

## 8. Arrêter l'automatisation

- **La correction locale** : supprimer la tâche `presidentielle-veille` dans la
  liste des tâches planifiées de l'application. La veille continue de signaler.
- **Le relais cloud** : le désactiver sur https://claude.ai/code/routines. Il
  consomme l'abonnement à chaque exécution, y compris quand il ne trouve rien.
- **Le signalement** : désactiver le workflow dans l'onglet *Actions* du dépôt.

Les modifications de données arrivent toutes par un commit préfixé `[auto]` sur
`main` : `git log --grep '\[auto\]'` les isole, `git revert` les annule.
