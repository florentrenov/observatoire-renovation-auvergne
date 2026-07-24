# Checklist GO FINAL P0.7

Une case est cochée uniquement après validation humaine explicite. Le GO FINAL reste interdit tant que toutes les validations requises ne sont pas signées.

## Hotfix

- [ ] Retrait du cockpit validé.
- [ ] `/analyse-connaissances/`, son JSON et `/veille-automatique/` retirés.
- [ ] Rapports, scripts et configurations de travail non accessibles.
- [ ] Rollback du hotfix prêt ou réalisé.
- [ ] Limite sans JavaScript de l'ancienne production explicitement acceptée si le hotfix est déployé seul.

## Revue visuelle

La validation précédente a été renouvelée par Florent après examen desktop/mobile de l'option B, des polices locales, de la nouvelle page légale et des pieds de page.

- [x] Pages affectées revalidées après l'option B.
- [x] Affichage desktop et mobile revalidé.
- [x] Nouvelle page légale et pieds de page revalidés.
- [x] Aucun bloc vide, lien incohérent ou texte tronqué signalé après correction.

## Éditorial et juridique

- [x] Identité de l'éditeur validée.
- [x] Responsable de publication validé.
- [ ] Hébergeur validé.
- [x] Contact validé.
- [ ] Propriété intellectuelle et réutilisation validées.
- [x] Absence de collecte directe, de traceur volontaire et d'outil d'audience vérifiée dans l'artefact.
- [x] Responsabilité et accessibilité arbitrées dans la formulation P0.8.

## Artefact

- [ ] Empreinte corrigée P0.8 `9eb81cbb4e248b25644d5a36d6a39e27b5edc5d7f0971840d1372f78f1acf573` vérifiée.
- [ ] 60 pages de sitemap et 61 HTML vérifiés.
- [ ] PDD-001 à PDD-005 vérifiés.
- [ ] PDD-006 à PDD-009 absents.
- [ ] Sitemap et 60 entrées de recherche vérifiés.
- [ ] Manifeste P0.7 vérifié et signé.
- [ ] 10/10 tests négatifs et rollback réussis sur le commit exact.

## GitHub Pages

- [ ] Source basculée vers GitHub Actions.
- [ ] Workflow manuel validé.
- [ ] Protection de l'environnement `github-pages` validée.
- [ ] `dist/` seul téléversé.
- [ ] Remplacement complet confirmé.
- [ ] Anciennes routes et ressources absentes.
- [ ] Domaine canonique `florentrenov.github.io/observatoire-renovation-auvergne/` confirmé.
- [ ] Rollback complet disponible.

## Autorisations

- [ ] Autorisation explicite de fusion.
- [ ] Autorisation explicite de push.
- [ ] Autorisation explicite de déploiement.

Décision humaine : **[À COMPLÉTER — `approved` interdit tant que toutes les validations requises ne sont pas signées]**
