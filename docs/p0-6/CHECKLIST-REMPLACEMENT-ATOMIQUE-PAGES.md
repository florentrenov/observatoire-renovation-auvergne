# Checklist de remplacement complet GitHub Pages

## Avant fusion ou push

- [ ] Revue visuelle humaine signée.
- [ ] Informations éditoriales nécessaires arbitrées.
- [ ] Manifeste P0.6 explicitement accepté.
- [ ] Hotfix cockpit traité séparément ou risque explicitement arbitré.
- [ ] `npm run release:check`, rollback et 10/10 tests négatifs réussis sur le commit exact.
- [ ] `dist/` contient 59 URL de sitemap, 59 entrées de recherche, 5 projets et une 404 utilitaire.
- [ ] PDD-006 à PDD-009, cockpit, `internal`, audits, chemins Windows et données indues absents.
- [ ] Sauvegarde/artefact public précédent et SHA conservés.

## Réglage administratif — impératif avant merge

- [ ] Dans Settings → Pages, capturer la source actuelle et son dossier.
- [ ] Choisir **GitHub Actions** comme source de publication.
- [ ] Confirmer que le build automatique Jekyll depuis `main` ne peut plus publier la racine.
- [ ] Vérifier l'environnement `github-pages`, ses protections et les personnes autorisées.
- [ ] Vérifier qu'aucun autre workflow ne déploie la racine.

## Déploiement autorisé

- [ ] Obtenir une autorisation humaine explicite écrite.
- [ ] Fusionner/pousser seulement le commit approuvé.
- [ ] Lancer manuellement `Deploy verified dist to GitHub Pages` sur ce commit.
- [ ] Vérifier que l'étape « Upload dist only » cible `./dist` et que le job de build est vert.
- [ ] Noter run ID, SHA, URL, heure et empreinte d'artefact.

## Contrôle après déploiement

- [ ] Accueil, recherche, PDD-001, PDD-002, sources et 404 corrects.
- [ ] Les 59 URL du sitemap répondent 200.
- [ ] Une URL inventée répond 404 avec la page personnalisée.
- [ ] `/cockpit/`, `/analyse-connaissances/` et `/veille-automatique/` répondent 404 et ne livrent aucun JSON interne.
- [ ] Sitemap et index de recherche comptent 59 entrées.
- [ ] Aucun fichier obsolète/internal n'est accessible.
- [ ] Comparer une sélection desktop/mobile et surveiller la console.

## Rollback

- [ ] En cas d'écart, arrêter la validation et relancer le workflow sur le dernier commit public approuvé.
- [ ] Refaire les contrôles HTTP, routes internes, sitemap et recherche.
- [ ] Documenter l'incident ; ne pas corriger directement sur l'hébergement.
