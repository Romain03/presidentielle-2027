# Données à vérifier

Tout ce qui est incertain, contradictoire ou non sourçable est consigné ici
plutôt que publié sur le site. Rien de ce qui figure dans cette liste n'est
affiché comme un fait dans `/data`.

Dernière revue : **9 octobre 2026** - 33 partis, 44 candidats, 57 propositions.

---

## 1. Priorité haute : à reprendre dans les jours qui viennent

### Primaire présidentielle socialiste
Le premier tour se tenait les **9 et 10 octobre 2026** (de 8 h le vendredi à
20 h le samedi), un second tour éventuel les 16 et 17 octobre. Plus de 140 000
personnes étaient inscrites pour départager cinq candidats : Olivier Faure,
Raphaël Glucksmann, Jérôme Guedj, Emmanuel Maurel, Ségolène Royal. Tous sont
actuellement enregistrés comme « Candidature déclarée ».

**Aucun résultat n'était connu au moment de cette revue.** La plateforme de vote
en ligne a par ailleurs été visée par une cyberattaque de type saturation (afflux
massif de connexions par bots) depuis son ouverture ; selon la commission
d'organisation, le scrutin n'a pas été interrompu et l'intégrité des votes n'est
pas compromise, mais la capacité à voter d'une partie des électeurs a été
entravée. Un contentieux sur la participation n'est donc pas à exclure.

**À reprendre dès la proclamation** : le ou la gagnante passe en « Investi », les
autres en « Retiré » s'ils se retirent effectivement.

### Primaire de la gauche unitaire
François Ruffin et Marine Tondelier s'y inscrivent. Ruffin a annoncé qu'il
resterait candidat si la primaire n'avait pas lieu. L'état d'avancement de ce
processus n'est pas documenté dans les sources consultées : le champ
`processus_designation` de Debout ! est vide.

### Programmes annoncés mais non publiés
- **Jean-Luc Mélenchon** : l'édition 2027 de « L'Avenir en commun » est annoncée
  en librairie le **6 novembre 2026**. Les pages de chapitres du site de
  campagne renvoyaient une erreur 404 au 9 octobre, et le chemin des URL en
  ligne est `programme2025`. À reprendre après publication, en remplaçant les
  sources de presse par la source primaire.
- **Marine Le Pen** : son programme n'était pas public au 11 septembre 2026.
  Toutes ses positions sont donc enregistrées comme déclarations publiques.
- **Bruno Retailleau** : il indique que son projet pour l'écologie « sera
  dévoilé » ultérieurement.

### Propositions adossées à des programmes antérieurs
Deux propositions sur l'éducation reposent sur des mesures qui ne datent pas de
la campagne de 2027. Le fait est écrit dans le détail affiché sur le site, mais
il appelle une reprise :

- **Marine Le Pen** : sa politique éducative est reconstituée à partir des
  propositions portées par le RN aux **élections législatives de 2024** et de ses
  interventions télévisées, faute de programme 2027 publié. Enregistrée comme
  déclaration publique.
- **Jean-Luc Mélenchon** : son volet éducation est « en cours d'actualisation
  pour 2027, mais ses principales mesures existaient déjà pour la campagne de
  **2022** ». À revérifier à la parution du 6 novembre.

---

## 2. Contradictions entre sources

### Marine Le Pen - durée de cotisation
Devant le Medef le 27 août 2026, elle évoque « progressivement on arrivera à
**42 ans** de cotisations et un âge légal de 62 ans ». Un article du 3 octobre
2026 retient **40 annuités** pour un départ anticipé à 60 ans. Les données
retiennent la valeur la plus récente (40). **À trancher** sur une source
primaire.

### Marine Le Pen - montant des économies
Annoncé à **125 milliards d'euros** devant le Medef le 27 août, puis à
**140 milliards d'euros nets d'ici 2032** lors de la conférence de presse du
6 octobre. Les données retiennent la valeur la plus récente. Il s'agit
probablement d'une évolution du chiffrage, pas d'une contradiction, mais ce
n'est pas établi.

### Xavier Bertrand - rattachement partisan
Les sources le rattachent à la fois à **Nous France**, mouvement qu'il a fondé,
et aux **Républicains**. Les données retiennent Nous France et signalent le
double rattachement dans ses précisions. À clarifier.

---

## 3. Sources à remplacer

### Le roster vient d'une encyclopédie
Les statuts et dates de candidature de la plupart des candidats sont sourcés à
la page Wikipédia « Candidatures à l'élection présidentielle française de
2027 », affichée comme telle (type de source : *Encyclopédie*). Cette page
porte elle-même un avertissement sur le caractère possiblement spéculatif de
son contenu. **Chaque statut devrait être re-sourcé sur la déclaration
d'origine** - Wikipédia les référence toutes.

Exceptions déjà sourcées à la presse : Marine Le Pen, Bruno Retailleau.

### Les parcours viennent de Wikidata
Les 183 jalons de parcours, les dates de naissance, les études et les métiers
sont repris de Wikidata (type de source : *Encyclopédie*), par le script
`scripts/recuperer-parcours.py`. C'est une source secondaire, et elle est
inégale :

- les dates les plus anciennes sont souvent réduites à l'année ;
- quelques dates sont visiblement incomplètes. **Dominique de Villepin**
  apparaît ministre des Affaires étrangères « 2002-2002 » alors qu'il l'a été
  jusqu'en 2004 : la revendication Wikidata porte une date de fin erronée ;
- trois fonctions sont écartées faute de date de début : un mandat de
  conseillère régionale de **Ségolène Royal**, et les mandats de conseiller
  municipal de **Xavier Bertrand** (Saint-Quentin) et **Édouard Philippe**
  (Le Havre) ;
- une fonction de **Raphaël Glucksmann** (« conseiller », 2005) est écartée :
  son intitulé Wikidata ne dit ni de quoi ni auprès de qui.

**Les mandats parlementaires devraient être re-sourcés** aux fiches de
l'Assemblée nationale et du Sénat, les fonctions gouvernementales au Journal
officiel. Le script relancé écrasera ces corrections : il faudra alors les
porter dans une table de saisie manuelle, comme pour les partis.

### Un site officiel erroné, corrigé
L'adresse enregistrée pour **Place publique** était `placepublique.eu`, un
domaine stationné qui n'appartient plus au parti. Le site réel porte un trait
d'union : `place-publique.eu`. Les autres adresses mériteraient une
vérification du même ordre.

### Quatre candidats sans fiche Wikidata
**Selma Labib**, **Mira Markovic**, **Benoît Mathieu** et **Manolo Mlekuz**
n'ont aucune entité Wikidata correspondante. Leurs quatre repères
biographiques s'affichent « Non renseigné ». Seule leur fonction du moment,
saisie à la main, est connue. Trois autres candidats - **Sylvain Durif**,
**Anasse Kazib**, **Francis Lalanne** - ont une fiche mais n'ont jamais exercé
de mandat : leur parcours est vide, ce qui est exact.

### Les soutiens aussi
Les 121 soutiens enregistrés proviennent de la même page. Wikipédia renvoie une
référence distincte pour chaque nom : **chacune devrait remplacer la source
encyclopédique**. Les listes concernent surtout Olivier Faure (54) et Raphaël
Glucksmann (47).

### Le site de campagne d'Édouard Philippe
Plusieurs de ses propositions - sécurité, défense, immigration - sont décrites
par la presse comme figurant « sur son site de campagne ». **L'URL de ce site
n'a pas été relevée** et les propositions sont donc sourcées via la presse. À
remplacer par la source primaire, qui existe.

### Sites agrégateurs écartés
Écartés : `votons-2027.fr`, `elyseescope.com`, `monvote2027.fr`,
`france-vote.fr`, `candidats-presidentielle-2027.fr`,
`candidatspresidentielles2027.fr`, `testpolitique.fr`, `politograph.fr`,
`sondages-presidentielle2027.fr`, `electionpresidentielle2027.com`,
`elections2027.com`.

Ces sites se présentent comme des synthèses de programmes mais ne citent pas
leurs sources et paraissent générés automatiquement. **Contre-exemple
vérifié** : plusieurs attribuaient à Bruno Retailleau un âge légal de départ à
**64 ans**, alors qu'il a annoncé le 22 septembre 2026 un âge minimal à
**63 ans** avec taux plein à 65 ans.

### Piège des articles de 2022
Plusieurs recherches remontent des articles de la campagne de 2022 sans que la
date soit visible dans les résultats - on y trouve Yannick Jadot, Anne Hidalgo
ou Valérie Pécresse présentés comme candidats. **Aucune source non datée de
2026 n'a été retenue.** Vérifier systématiquement la date de publication avant
d'ajouter une proposition.

### Sources inaccessibles
`lemonde.fr`, `lefigaro.fr`, `liberation.fr` et `lesechos.fr` bloquent la
récupération automatique. Les déclarations qu'ils rapportent ne peuvent être
reprises que via une autre source les citant, ou par consultation manuelle.
C'est le cas de l'interview fondatrice de Bruno Retailleau au Figaro
(13 février 2026), citée via Europe 1.

---

## 4. Conventions à faire valider

### Famille politique
Le regroupement en huit familles est une convention du site, publiée sur la
page Méthodologie. Deux choix méritent une relecture :

- **DSV (droite souverainiste) est classée « Droite »**, et non « Extrême
  droite ». Debout la France et le mouvement de Philippe de Villiers sont
  concernés. Le classement retenu est celui qui formule la revendication la
  plus faible, mais il est discutable dans les deux sens.
- **Le RN est classé « Extrême droite »** et **LFI « Gauche »**, conformément à
  la nomenclature usuelle.

### Nuances du ministère de l'Intérieur
Renseignées uniquement lorsque le code officiel est certain : EXG, FI, COM,
SOC, VEC, LR, RN, REC, REG, DIV, DSV. Les autres partis affichent « Non
renseignée » - notamment Horizons, Renaissance, Place publique, le MoDem et la
plupart des petites formations. **À compléter** depuis la nomenclature publiée
par le ministère.

### Couleurs des partis
Elles suivent les conventions habituelles de la presse et n'ont aucun caractère
officiel. Pour les petites formations, faute de convention établie, une teinte
neutre a été retenue. Le site n'utilise jamais la couleur comme seul vecteur
d'information, mais ces valeurs restent à valider.

### Critère d'inclusion des « pressentis »
Un candidat pressenti n'est recensé que s'il exerce ou a exercé un mandat
électif ou une fonction gouvernementale. Dix personnalités répondent à ce
critère. **Écartés** faute de mandat et de prise de position publique, bien que
cités par les sources : Matthieu Pigasse, Natacha Polony, Teddy Riner. Le
critère est factuel mais reste une décision du site.

---

## 5. Lacunes connues

### Couverture thématique
57 propositions pour 528 couples candidat × thème possibles, soit **11 %**.

Un seul thème n'a **aucune** proposition : la **santé**. Une recherche ciblée n'a
ramené que des articles de la campagne de **2022** (Pécresse, Hidalgo, Jadot,
Poutou, Macron) ; aucune synthèse datée de 2026 n'a été trouvée. Plutôt que de
reprendre des positions vieilles de cinq ans, le thème reste vide. **À retenter**
- c'est le premier sujet à traiter quand une source paraîtra.

Les thèmes **Europe** et **logement** n'ont qu'une seule proposition chacun, et
la **sécurité** deux. 26 candidats sur 44 n'ont aucune proposition sourcée et
sont masqués par le filtre par défaut.

Cette couverture reflète autant l'état de la collecte que celui des programmes :
à six mois du scrutin, la plupart des candidats n'ont pas publié de projet.

### Candidats sans aucune proposition
Arthaud et Hollande mis à part, aucun des candidats de petite formation n'est
documenté : Asselineau, Batho, Becht, Bertrand, Bouamrane, Cazeneuve, Durif,
Kazib, Labib, Lalanne, Markovic, Mathieu, Mlekuz, Philippot, ainsi que tous les
pressentis sauf Hollande, et les trois candidatures retirées.

### Ce qui débloquerait le test de proximité
Le test a besoin de **8 questions** portant chacune sur un chiffre annoncé par
au moins 4 candidats. Il en existe **2** : âge légal de départ (12 candidats) et
durée de cotisation (6).

Quatre questions sont déjà écrites mais écartées faute de candidats : élèves par
classe (3), départ anticipé pour pénibilité (2), capital à la naissance (2),
revalorisation mensuelle des enseignants (2). Il suffirait de deux candidats de
plus sur chacune pour les retenir.

Les indicateurs les plus prometteurs à compléter, parce qu'ils sont chiffrés par
nature : SMIC visé, nombre d'enseignants recrutés, part d'énergies fossiles,
objectifs de déficit, places de prison, quotas migratoires. Deux valeurs sont
par ailleurs volontairement non comparables et le resteront tant qu'elles seront
exprimées ainsi : le SMIC (brut contre net) et la revalorisation des enseignants
(horizons différents).

### Portraits
40 candidats sur 44 ont un portrait libre, repris de Wikimedia Commons avec son
auteur et sa licence. Quatre n'en ont aucun, faute d'image sur leur article
Wikipédia, et gardent un monogramme : **Selma Labib, Mira Markovic, Benoît
Mathieu, Manolo Mlekuz**.

Trois points à garder en tête :

- **Le choix est mécanique** : on prend l'image principale de l'article
  Wikipédia en français, sans la regarder. C'est délibéré - choisir
  soi-même reviendrait à décider quelle photographie avantage ou dessert qui.
- **La qualité est donc inégale.** Plusieurs portraits sont des prises de vue
  en tribune, micro à la bouche ou de profil ; celui de Sylvain Durif le montre
  en train de jouer d'une flûte. C'est ce que Commons propose.
- **Le recadrage est automatique** : carré pris au ras du haut de l'image. Le
  résultat est correct dans l'ensemble, quelques cadrages restent perfectibles.

Si l'image principale d'un article change, le portrait change au prochain
`python3 scripts/recuperer-photos.py`. Les licences sont relevées à chaque
exécution, donc une requalification serait détectée.

### Champs non renseignés
- `soutiens` est renseigné pour **11 candidats sur 44** (121 noms). Les 33 autres
  n'en ont aucun : soit aucun soutien n'est documenté, soit il n'a pas été relevé.
- `positionnement_declare` est renseigné pour **26 partis sur 33**, relevé à la
  main sur leur site officiel. Les sept autres - Droite souverainiste, Elvita,
  France Libre, La France humaniste, NPA - Révolutionnaires, Nous France,
  Trajectoire - n'ont pas de site officiel identifié.
- Ces pages de présentation ne portent **aucune date de publication** : la date
  enregistrée est celle de la consultation, comme pour les relevés Wikidata.
  C'est un écart assumé au sens du champ `date`, qui désigne ailleurs la date
  de publication.
- Les extraits sont relevés à la main et devront être **revérifiés
  périodiquement** : un parti qui refond son site rendra le lien caduc sans
  que rien ne le signale.
- `processus_designation` n'est renseigné que pour LR, le PCF, Les Écologistes
  et le PS.
- `liens_officiels` n'est renseigné que pour trois candidats ; les sites de
  campagne des autres n'ont pas été vérifiés un par un.
- `biographie.naissance` est `null` pour **4 candidats sur 44**, et
  `biographie.metiers` est vide pour ceux dont Wikidata ne liste que des
  catégories statistiques ou des fonctions politiques.

### Dates de statut manquantes
`statut_date` est `null` pour les dix pressentis - par construction, ils n'ont
pas déclaré - et pour **Manolo Mlekuz**, dont la candidature est située « début
2026 » sans date précise.

### Dates de déclaration anciennes
Deux candidatures reposent sur des déclarations antérieures à 2026 :
**François Asselineau** (31 août 2023) et **Édouard Philippe** (3 septembre
2024). Elles sont valides mais mériteraient une confirmation récente.

---

## 6. Points résolus depuis la revue précédente

- **Bruno Retailleau** : la date d'investiture est confirmée au **19 avril
  2026** (consultation interne des adhérents LR).
- **Jean-Luc Mélenchon** : date de déclaration trouvée - **3 mai 2026**, au
  Journal de 20 heures de TF1.
