# Sécurité de publication

Ce dépôt est la seule base de travail destinée à devenir canonique. Le dossier `dist/` est un artefact local, ignoré par Git et construit exclusivement depuis `config/publication-allowlist.json`. Copier la racine du dépôt vers un hébergeur est interdit.

## Barrières P0

- `data/registry/project-identities.json` est le registre des identités. Un identifiant n'est jamais réattribué silencieusement.
- `PDD-006` à `PDD-009` sont gelés, ambigus et non publiables jusqu'à arbitrage humain documenté.
- `internal/` contient les outils d'analyse et de veille qui ne doivent jamais entrer dans l'artefact public.
- Le build échoue si une route, un contenu interne, un chemin Windows ou un identifiant gelé apparaît dans `dist/`.
- Les fiches publiques `PDD-001` à `PDD-005` sont pré-rendues en HTML et restent lisibles sans JavaScript.

## Commandes locales

```powershell
npm.cmd run identity:check
npm.cmd run public:build
npm.cmd run public:verify
npm.cmd run public:determinism
npm.cmd run rollback:test
npm.cmd run release:check
```

`npm.cmd run release:check` est la barrière minimale avant toute revue de publication. Elle ne déploie rien. Le fichier `dist/RELEASE-MANIFEST.json` enregistre le commit source, la branche, le hash de l'artefact, le nombre de pages, les identifiants publiés, les exclusions et l'état des contrôles.

## Publication et retour arrière

Une publication exige une revue humaine du diff depuis la dernière version approuvée, un `release:check` vert sur un commit propre, puis une sauvegarde immuable de l'artefact public précédent. Le déploiement doit prendre uniquement le contenu de `dist/`.

En cas d'incident, restaurer l'artefact précédent et son manifeste, vérifier son hash, puis republier cet artefact sans reconstruire depuis une branche mutable. Le test local `npm.cmd run rollback:test` simule cette restauration sans modifier les fichiers suivis par Git.

## Interdictions

- pas de publication depuis `main` sans branche de travail revue ;
- pas de `force push` ;
- pas de copie globale du dépôt ou d'un dossier local divergent ;
- pas d'arbitrage automatique des identités gelées ;
- pas de secret, d'audit interne ou d'outil de pilotage dans l'artefact public.
