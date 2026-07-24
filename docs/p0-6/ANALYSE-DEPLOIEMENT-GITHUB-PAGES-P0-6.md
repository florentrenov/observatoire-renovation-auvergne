# Analyse du déploiement GitHub Pages P0.6

Date : 21 juillet 2026

## Mécanisme observé

La production est servie à l'adresse projet `florentrenov.github.io/observatoire-renovation-auvergne/`. L'API publique des déploiements expose le déploiement GitHub Pages `5489534706`, créé le 17 juillet 2026 depuis la branche `main` et le SHA `aaa7862…`. Le run Actions `29582397501` a réussi avec les étapes Checkout, Build with Jekyll, Upload artifact et Deploy to GitHub Pages.

Ces éléments indiquent fortement le mécanisme Pages automatique basé sur une branche, avec construction Jekyll du contenu de `main`. Le contenu en ligne correspond à cette génération ancienne. L'API publique `/pages` répond 404 sans authentification : le dossier source exact (`/` ou `/docs`) et le réglage administratif ne sont donc pas directement confirmés. Aucun fichier `CNAME` n'est présent dans la candidate.

## Risque

Copier ou construire la racine publie davantage que l'allowlist et pourrait exposer `internal/`. Une mise à jour incrémentale pourrait en outre conserver d'anciens chemins. Le retrait de fichiers n'est considéré sûr qu'avec un artefact complet et neuf. Avec la configuration observée, fusionner la candidate sur `main` avant changement du réglage Pages est **interdit**.

## Mécanisme préparé

Le workflow `.github/workflows/deploy-pages-dist.yml` :

- ne se déclenche que manuellement (`workflow_dispatch`) ;
- exécute `npm run release:check` ;
- téléverse uniquement `./dist` avec l'action Pages dédiée ;
- déploie cet artefact complet dans l'environnement `github-pages` ;
- ne copie jamais la racine du dépôt.

Les versions correspondent à la documentation GitHub consultée le 21 juillet 2026 : `configure-pages@v5`, `upload-pages-artifact@v4`, `deploy-pages@v4`.

## Action humaine obligatoire

Avant toute fusion ou publication, un administrateur doit ouvrir **Settings → Pages**, confirmer la source actuelle, puis sélectionner **GitHub Actions**. Il doit vérifier les règles de protection de l'environnement `github-pages`. Ce changement n'a pas été effectué pendant P0.6.

## Contrôle et rollback

Après un futur déploiement autorisé : vérifier le SHA/run, l'empreinte du manifeste, 59 URL attendues, la recherche, puis l'absence HTTP et textuelle des routes internes. Le rollback consiste à relancer le même workflow sur le commit public précédent validé ou à redéployer son artefact complet conservé ; une copie partielle est exclue.

Conclusion : le remplacement complet est techniquement préparé et reproductible, mais la configuration administrative reste à confirmer et à modifier humainement avant merge/push/déploiement.
