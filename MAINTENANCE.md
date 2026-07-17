# Maintenance du site Observatoire rénovation Auvergne

Ce dossier est la couche publique statique de VoltCity. Le vault Obsidian reste la source documentaire de travail ; ce site expose uniquement des contenus sélectionnés, structurés et vérifiés.

## Architecture

- `index.html` : accueil public.
- `assets/styles.css` : identité Basalte, responsive, composants communs.
- `assets/observatoire.js` : données et rendu des projets observés.
- `assets/veille-data.js` : export public de veille, vide tant qu'aucune publication n'est validée.
- `assets/veille.js` : rendu public de la veille.
- `assets/search-index.js` : index de recherche généré.
- `assets/search.js` : recherche côté client.
- `scripts/` : contrôles, inventaire, génération de l'index et synchronisation prudente header/footer.
- `docs/` : inventaire et contrats de données.

## Commandes

Exécuter les commandes depuis `site-observatoire-v2`.

```powershell
npm.cmd run site:check
npm.cmd run site:inventory
npm.cmd run site:search
npm.cmd run site:shell:check
```

Sous PowerShell, utiliser `npm.cmd` si `npm.ps1` est bloqué par la politique d'exécution.

## Contrôles avant publication

1. Générer l'index de recherche : `npm.cmd run site:search`.
2. Générer l'inventaire : `npm.cmd run site:inventory`.
3. Lancer le contrôle global : `npm.cmd run site:check`.
4. Vérifier le header/footer : `npm.cmd run site:shell:check`.
5. Tester visuellement l'accueil, les projets, la recherche, la veille, les acteurs, les sources, à propos, méthode et une fiche projet.

## Garde-fous encodage

- Tous les fichiers texte doivent rester en UTF-8 sans BOM.
- Chaque page HTML doit contenir exactement un `<meta charset="UTF-8">` très tôt dans `<head>`.
- Ne pas utiliser de conversion massive non vérifiée.
- Tout script d'écriture doit lire et écrire explicitement en `utf8`.
- En cas de motif suspect documenté par le contrôle (`U+00C3`, `U+00C2`, séquences de guillemets mojibake, `U+FFFD`), corriger d'abord sur une copie ou avec un script ciblé, puis relancer `site:check`.

## Header et footer

La navigation principale doit rester :

`Accueil · Projets d'Auvergne · Veille · Acteurs · Sources · À propos`

La page `methode/index.html` reste accessible depuis les footers, mais ne doit pas revenir dans le header.

`npm.cmd run site:shell:check` vérifie la conformité. `npm.cmd run site:shell:write` peut resynchroniser les zones communes, mais doit être utilisé seulement après examen du diff.

## Workflow éditorial

### Ajouter un projet

1. Documenter les sources dans le vault Obsidian.
2. Ajouter uniquement les informations vérifiées dans `assets/observatoire.js`.
3. Créer la page HTML de fiche uniquement si elle peut pointer vers une entrée réelle.
4. Distinguer objectifs, estimations et résultats mesurés.
5. Relancer `site:check`, `site:search` et les tests navigateur.

### Ajouter une veille

1. Conserver la collecte et les brouillons hors export public.
2. Publier uniquement un item validé humainement.
3. Distinguer `sourceUrl` et `targetUrl`.
4. Ne jamais créer de faux lien ou d'exemple fictif dans `assets/veille-data.js`.

## Déploiement

Le dépôt canonique GitHub Pages doit être identifié avant publication.

Procédure prudente :

1. Identifier le dépôt public réel.
2. Comparer les fichiers locaux au dépôt public.
3. Copier ou synchroniser seulement le dossier du site si nécessaire.
4. Examiner le diff.
5. Lancer toutes les commandes de contrôle.
6. Faire une validation visuelle humaine sur ordinateur et téléphone.
7. Commit ciblé, push, puis contrôle GitHub Pages.

Cette mission ne fait ni commit, ni push, ni déploiement.

## Comparaison avec le dépôt public

Le dépôt attendu est `florentrenov/observatoire-renovation-auvergne`, branche `main`.

Procédure de comparaison sans publication :

1. créer ou actualiser un clone d'audit hors du vault ;
2. exécuter `npm.cmd run site:public:compare` depuis `site-observatoire-v2` ;
3. lire `docs/public-compare.md` ;
4. ne copier aucun fichier tant que la comparaison n'a pas été validée humainement.

## Transfert en trois étapes

1. **Simulation** : comparaison locale/public, génération de l'inventaire, contrôle SEO, contrôle données et inspection du diff prévu.
2. **Copie contrôlée** : branche dédiée dans le dépôt canonique, copie ciblée des fichiers validés, exclusion de `.git`, secrets, fichiers temporaires et données non publiées.
3. **Validation** : `npm.cmd run site:check`, tests navigateur, validation visuelle humaine, commit ciblé, push seulement après décision explicite.

## Intégration continue

Un workflow de contrôle est préparé dans `.github/workflows/site-check.yml`.

Il est destiné au dépôt canonique et ne déploie rien. Il vérifie :

- génération recherche ;
- génération inventaire ;
- `site:check` ;
- header/footer ;
- SEO ;
- qualité projets ;
- relations ;
- contrat veille ;
- dry-run Obsidian ;
- inventaire médias.

## Checklist avant publication

- dépôt canonique confirmé ;
- branche de publication créée ;
- base URL confirmée ;
- `npm.cmd run site:check` vert ;
- `npm.cmd run site:seo:check` vert ;
- `npm.cmd run site:projects:quality` lu ;
- `npm.cmd run site:relations` lu ;
- `npm.cmd run site:veille:test` vert ;
- `npm.cmd run site:obsidian:dry-run` vert ;
- `npm.cmd run site:media` lu ;
- laboratoires exclus ou traités intentionnellement ;
- droits des images vérifiés ;
- validation visuelle humaine ordinateur et téléphone.

## Retour arrière

En cas de problème après publication :

1. identifier le commit publié ;
2. créer un commit de revert plutôt que réécrire l'historique ;
3. relancer les contrôles localement ;
4. pousser le revert après validation ;
5. vérifier GitHub Pages ;
6. documenter l'incident et la correction.
