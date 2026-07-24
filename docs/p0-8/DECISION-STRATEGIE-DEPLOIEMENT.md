# Décision de stratégie de déploiement P0.8

Date du contrôle : 22 juillet 2026

Statut : **OPTION B INTÉGRÉE LOCALEMENT — REVALIDATION VISUELLE ACCORDÉE**

Décision de publication : `human_approval_required`

La stratégie Option B a été confirmée : les trois médias sans preuve documentaire suffisante sont exclus de l'artefact public et leurs usages visibles sont remplacés par des traitements CSS Basalte, Cendre et Lave. Les décisions éditoriales et juridiques de principe ont également été intégrées localement.

Aucun push, merge, pull request, changement GitHub Pages ou déploiement n'a été exécuté ni préparé.

## Candidate publique locale

- branche locale : `codex/cloture-p0-6` ;
- commit fonctionnel public : `f12ed37c011abaa77c84b6a56be35d30db5c04b6` ;
- empreinte de l'artefact : `9eb81cbb4e248b25644d5a36d6a39e27b5edc5d7f0971840d1372f78f1acf573` ;
- 60 URL dans le sitemap ;
- 61 fichiers HTML, page 404 incluse ;
- 60 entrées de recherche ;
- cinq projets publiés, PDD-001 à PDD-005 ;
- `release:check` réussi avec 0 erreur et deux avertissements documentés PDD-003/PDD-004 ;
- les trois médias sans preuve sont absents de `dist/` ;
- aucun appel à `fonts.googleapis.com` ou `fonts.gstatic.com` dans `dist/` ;
- cockpit, routes internes, rapports et scripts absents de `dist/`.

## Décisions éditoriales intégrées

- éditeur du site : **NEBBAB Florent** ;
- responsable de la publication : **NEBBAB Florent** ;
- contact public pour demandes, erreurs et accessibilité : **florentrenov@gmail.com** ;
- objet du site et absence d'affiliation institutionnelle explicités ;
- nouvelle page « Mentions légales et confidentialité » ;
- date de mise en ligne conservée sous la forme `[DATE DU FUTUR DÉPLOIEMENT VALIDÉ]` : elle ne sera renseignée qu'après autorisation de publication.

## Polices

- Fraunces provient du dépôt officiel `undercasetype/Fraunces`, commit épinglé `7ccdec31c6028118dce3e47fe864e3744460371d` ;
- IBM Plex provient du dépôt officiel `IBM/plex`, commit épinglé `2f9ba1b25957d958db71a849e85d72e3ecfb845a` ;
- les deux familles sont distribuées sous SIL Open Font License 1.1 ;
- les fichiers WOFF2, licences, URL, commits et empreintes SHA-256 sont documentés dans `assets/fonts/SOURCES.txt`.

## Médias Option B

Les fichiers suivants restent uniquement dans l'environnement local ou documentaire et ne sont ni allowlistés ni copiés dans `dist/` :

- `hero-basalte.png` ;
- `hero-puy-de-dome-green.png` ;
- `projets-auvergne-la-fayette.webp`.

Leur origine, auteur, licence et droit de reproduction n'étant pas suffisamment documentés, aucune réutilisation publique n'est déclarée.

## Vérifications juridiques extérieures encore recommandées

Les formulations sont factuelles et fondées sur les informations validées, mais aucune conformité juridique complète n'est déclarée. Avant le GO final, une vérification extérieure reste recommandée pour :

1. la qualification professionnelle ou non professionnelle de l'éditeur ;
2. la possibilité de ne pas publier d'adresse personnelle dans le contexte exact du site ;
3. la présentation exacte de GitHub Pages, de l'entité d'hébergement et de ses coordonnées ;
4. la portée des conditions de réutilisation des contenus, données et citations de sources tierces.

## Revalidation visuelle reçue

Florent a examiné en version desktop et mobile les préversions locales suivantes :

- Accueil ;
- Acteurs locaux ;
- Comprendre ;
- Habitat privé ;
- Méthode ;
- Observatoire ;
- Clermont Auvergne Métropole ;
- Puy-de-Dôme ;
- Mentions légales et confidentialité ;
- pied de page.

Décision : **tous les éléments sont validés ; revalidation visuelle P0.8 Option B accordée.**

Commentaire humain : **Les remplacements graphiques CSS sont cohérents avec la charte Basalte, Cendre et Lave. La page Mentions légales et confidentialité et le lien de pied de page sont lisibles et correctement intégrés. Les trois médias non documentés sont absents de l’artefact public et les polices sont auto-hébergées.**

## Décision courante

- stratégie : **OPTION B — intégrée localement** ;
- validation éditoriale de principe : **intégrée, relecture humaine finale requise** ;
- validation juridique : **informations intégrées, vérifications extérieures ciblées recommandées** ;
- revalidation visuelle après Option B : **VALIDÉE PAR FLORENT** ;
- publication : **NON AUTORISÉE** ;
- statut final : **`human_approval_required`**.

Une revalidation visuelle ou éditoriale ne constituera pas, à elle seule, une autorisation de push, fusion, changement Pages ou déploiement.
