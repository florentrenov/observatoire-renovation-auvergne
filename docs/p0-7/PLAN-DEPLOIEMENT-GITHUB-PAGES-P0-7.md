# Plan de déploiement GitHub Pages P0.7

Statut : préparé localement, **non activé à distance**.

## État observé

Le 22 juillet 2026, `main`, `origin/main` et le dernier déploiement Pages public correspondent à `aaa7862b85c842345bf339f1d2e83af2d1f3402b`. Le mécanisme observé est le workflow dynamique Pages qui construit Jekyll depuis `main`. L'API publique ne permet pas de confirmer le réglage administratif ni le dossier source exact ; cette vérification reste humaine.

## Workflow cible

`.github/workflows/deploy-pages-dist.yml` utilise :

- déclenchement exclusivement manuel `workflow_dispatch` ;
- `actions/checkout@v6` ;
- Node 22 avec `actions/setup-node@v4` ;
- `npm ci --ignore-scripts` et `package-lock.json` ;
- `npm run release:check`, qui construit et vérifie l'allowlist, le manifeste, les identités, l'accessibilité ciblée, les contenus interdits et le déterminisme ;
- `actions/configure-pages@v5` ;
- `actions/upload-pages-artifact@v4` avec `path: ./dist` ;
- `actions/deploy-pages@v4` dans l'environnement `github-pages` ;
- un job de déploiement limité à `refs/heads/main`.

Sur une branche de revue, le build peut être lancé manuellement mais le job `deploy` est ignoré. La stratégie future reste manuelle afin qu'un merge ou un push ne publie rien automatiquement.

## Contenu exact destiné à Pages

Seul le contenu de `dist/` est téléversé : 60 URL de sitemap, 61 HTML dont une 404 utilitaire, 60 entrées de recherche, PDD-001 à PDD-005 et les seuls assets explicitement autorisés. La page supplémentaire est « Mentions légales et confidentialité ». `docs/`, `internal/`, scripts, registres, rapports, médias sans preuve et PDD-006 à PDD-009 ne sont pas dans l'artefact.

Les fichiers texte de l'artefact sont normalisés en LF. Le contrôle refuse tout CRLF résiduel, ce qui rend l'empreinte indépendante du checkout Windows/Linux. Après les corrections P0.8 éditoriales, juridiques, typographiques et l'option B médias, l'empreinte préparée est `9eb81cbb4e248b25644d5a36d6a39e27b5edc5d7f0971840d1372f78f1acf573`.

## Remplacement complet et fichiers obsolètes

La méthode officielle téléverse un artefact Pages puis déploie cet artefact ; elle ne demande aucune copie incrémentale de la racine. Il est donc raisonnable d'attendre le remplacement du site par le contenu complet de `dist/`. Cette conclusion reste une inférence technique à confirmer sur la production réelle par les contrôles HTTP suivants :

| Cible | Résultat attendu |
|---|---|
| `/` | 200 |
| `/recherche/` | 200 et recherche fonctionnelle |
| PDD-001 | 200, contenu statique et sources |
| `/cockpit/` | 404 personnalisée |
| `/veille-automatique/` | 404 personnalisée |
| `/analyse-connaissances/` | 404 personnalisée |
| JSON historique du cockpit | 404 |
| `/sitemap.xml` | 200, 60 URL |
| `/robots.txt` | 200 |
| URL inventée | 404 personnalisée |

Il faut aussi tester les anciennes ressources directes sous `/docs/`, `/scripts/`, `site.config.json`, `package.json`, README et maintenance. Toute réponse 200 sur un ancien fichier impose l'arrêt et le rollback.

## Séquence humaine obligatoire

1. Signer les revues visuelle, éditoriale, juridique et le manifeste.
2. Décider si le hotfix urgent doit être déployé avant P0.6.
3. Dans Settings → Pages, capturer le réglage actuel puis sélectionner **GitHub Actions** avant de fusionner P0.6.
4. Protéger l'environnement `github-pages` et exiger une approbation.
5. Autoriser séparément merge, push et déploiement.
6. Lancer manuellement le workflow sur le commit `main` approuvé.
7. Noter le run, le SHA, l'URL et l'empreinte ; exécuter tous les contrôles post-déploiement.

## Rollback

Conserver l'artefact complet de la dernière release approuvée. En cas d'écart, relancer le même workflow sur ce commit ou cet artefact, puis revérifier l'empreinte, les 60 URL et l'absence des anciennes routes. Ne jamais restaurer partiellement des fichiers dans Pages.

Références vérifiées le 22 juillet 2026 : documentation GitHub « Configuring a publishing source » et « Using custom workflows with GitHub Pages ».
