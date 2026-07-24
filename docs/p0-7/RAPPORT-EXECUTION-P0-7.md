# Rapport d'exécution P0.7

Date : 22 juillet 2026

## Mise à jour corrective P0.8

Les empreintes P0.7 ci-dessous ont été supersédées après une autorisation humaine de correction, sans aucune publication distante :

- hotfix corrigé : commit `ee03091`, empreinte LF/CRLF `968d8e40e1681f6d4787652bbac9b49447cb069cddd26ca987fc8238aeebcd62` ;
- candidate publique P0.8 : commit `f12ed37`, empreinte LF/CRLF `9eb81cbb4e248b25644d5a36d6a39e27b5edc5d7f0971840d1372f78f1acf573` ;
- extraits de recherche tronqués corrigés, périmètre Techniques ramené aux cinq projets publiés et ancien vocabulaire de laboratoire retiré d'Analyses ;
- cartes de recherche réalignées sur la palette Basalte/Cendre/Lave, avec contraste AA et états de survol/focus visibles, sans changement fonctionnel ni éditorial ;
- libellés publics des fiches acteurs et de la méthode débarrassés du nom de fichier interne `observatoire.js`, sans modifier les projets, rôles, techniques ou territoires ;
- décisions éditoriales et juridiques de principe intégrées localement : NEBBAB Florent, contact dédié, objet indépendant et non institutionnel, responsabilité, liens externes et accessibilité ;
- trois médias sans preuve exclus de l'artefact selon l'option B et remplacés par des compositions CSS ;
- Fraunces et IBM Plex auto-hébergées depuis leurs dépôts officiels, licences OFL et empreintes conservées, sans appel public à Google Fonts ;
- revalidation visuelle desktop/mobile P0.8 Option B accordée par Florent pour les pages affectées, la nouvelle page légale et les pieds de page ;
- décision toujours inchangée : `human_approval_required`.

## Décisions

- **Hotfix : PRÊT SOUS CONDITIONS**, non déployé.
- **P0.6 : GO FINAL PRÊT À VALIDER**, mais non approuvé.
- Décision machine : `human_approval_required`.

Aucun push, merge, changement distant GitHub Pages ou déploiement n'a été effectué.

## 1. Correspondance `main` / production

`main`, `origin/main` et le dernier déploiement Pages public pointent vers `aaa7862b85c842345bf339f1d2e83af2d1f3402b`. Neuf fichiers représentatifs, dont le cockpit et son JSON, sont identiques octet pour octet entre Git et la production. `/analyse-connaissances/` et `/veille-automatique/` répondent 200 ; `/cockpit/` répond déjà 404. Des rapports, scripts et configurations répondent aussi 200 en accès direct.

## 2. Hotfix isolé

- branche : `codex/hotfix-retrait-routes-internes` ;
- base : `aaa7862…` ;
- commits : `bbfa16b` (retrait), `e7c5041` (contrôles et documentation), `ee03091` (reproductibilité P0.8) ;
- aucune fusion avec P0.6.

Routes supprimées : `analyse-connaissances/`, son JSON et `veille-automatique/`. Les ressources `veille-lab.js` et `veille.css`, exclusivement internes, sont supprimées. `_config.yml` empêche Jekyll de publier rapports, scripts, composants et fichiers de maintenance. `/cockpit/` reste une 404.

La seule modification d'une page publique retire de `analyses/` la référence PDD-006 à PDD-010 et au laboratoire ; l'index de recherche reste à 59 entrées. Les cinq pages projets et leurs données ont exactement les SHA de `main`.

Tests hotfix : 59/59 URL en HTTP 200, 10/10 ressources retirées en 404, zéro erreur console sur accueil/PDD-001, mobile 360 et tablette 768 sans débordement, build déterministe, test négatif cockpit réussi et rollback local réussi. Empreinte corrigée P0.8 : `968d8e40e1681f6d4787652bbac9b49447cb069cddd26ca987fc8238aeebcd62`.

Condition résiduelle : les fiches de l'ancienne production restent dépendantes de JavaScript. Cette limite existait avant et après ; la corriger dans le hotfix aurait violé la séparation. Le rollback restaure bien `main`, mais réexposerait le cockpit : il est réservé à un incident plus grave.

## 3. Candidate P0.6 et workflow Pages

La branche `codex/cloture-p0-6` a été retrouvée exactement au commit `1980ca1`. Le commit `c890dbe` ajoute seulement la préparation Pages et les contrôles associés :

- lockfile et `npm ci --ignore-scripts` ;
- checkout v6, Node 22 explicite ;
- build/test complet via `release:check` ;
- normalisation LF et refus des CRLF dans l'artefact ;
- upload exclusif de `./dist` ;
- déploiement manuel limité à `main` avec environnement `github-pages`.

La découverte d'une empreinte dépendante du checkout Windows/Linux constituait un défaut bloquant réel. La normalisation corrige ce défaut sans modifier le rendu. Après l'intégration éditoriale/juridique, l'auto-hébergement des polices et l'option B médias, la nouvelle empreinte stable est `9eb81cbb4e248b25644d5a36d6a39e27b5edc5d7f0971840d1372f78f1acf573`.

Le contenu exact destiné à Pages est désormais : 60 pages de sitemap, 61 HTML avec la 404, 60 entrées de recherche, PDD-001 à PDD-005, la page de mentions et les assets allowlistés. Aucun `docs/`, `internal/`, cockpit, chemin Windows, média sans preuve ou PDD-006 à PDD-009.

## 4. Remplacement complet et obsolescence

Le workflow téléverse un artefact Pages complet, pas une copie incrémentale. L'absence de fichiers obsolètes reste toutefois à confirmer après déploiement par des requêtes directes sur les trois routes internes, le JSON historique, les rapports/scripts autrefois accessibles, le sitemap, robots, accueil, recherche, PDD-001 et 404.

Avant tout merge P0.6, un administrateur doit basculer Settings → Pages vers **GitHub Actions**. Sans ce basculement, la racine du dépôt pourrait être reconstruite et la décision redevient NO-GO.

## 5. État humain et éditorial

Les décisions éditoriales et juridiques sont validées en principe par Florent et intégrées dans une candidate locale. Restent à vérifier extérieurement : la qualification de l'éditeur, la possibilité de ne pas publier d'adresse personnelle, les mentions exactes de GitHub Pages et la formulation définitive des conditions de réutilisation. La revalidation visuelle P0.8 Option B est signée pour les pages affectées, la nouvelle page légale et les pieds de page. La fiche technique reste non applicable.

PDD-003 et PDD-004 conservent leurs avertissements : les pages qualifient les valeurs comme contractuelles et indiquent explicitement que les résultats réels/mesurés ne sont pas publiés. Aucune cible n'est présentée comme un résultat constaté.

## 6. Actions humaines restantes

1. Valider ou déployer séparément le hotfix urgent.
2. Réaliser ou accepter le report des quatre vérifications juridiques ciblées, puis valider le manifeste P0.7.
3. Capturer puis basculer la source Pages vers GitHub Actions.
4. Protéger l'environnement `github-pages`.
5. Autoriser séparément merge, push et déploiement.
6. Après déploiement, prouver le remplacement complet et conserver les preuves/rollback.

Tant que ces étapes ne sont pas signées, le site est techniquement préparé mais **non autorisé à être publié**.
