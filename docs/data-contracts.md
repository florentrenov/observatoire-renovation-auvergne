# Contrats de données

## Projets observés

Source actuelle : `assets/observatoire.js`.

Chaque projet doit décrire une opération réelle documentée par des sources publiques ou par une note Obsidian vérifiée avant export.

Champs requis :

- `id` : identifiant stable, par exemple `PDD-001`.
- `slug` : dossier de la fiche projet.
- `title` : titre public.
- `place` : localisation.
- `owner` : porteur ou maître d'ouvrage mentionné par les sources.
- `status` : état documentaire public.
- `buildingType` : type de bâtiment.
- `category` : catégorie utilisée pour les filtres.
- `period` : période publiée ou mention explicite de lacune.
- `surface` : surface publiée ou mention explicite de lacune.
- `amount` : montant publié ou mention explicite de lacune.
- `documentStatus` : niveau de documentation.
- `confidence` : nature des sources.
- `verificationDate` : date de vérification, à renseigner lorsque le contrôle documentaire est fait.
- `summary` : résumé factuel.
- `metrics` : indicateurs publiés, objectifs ou lacunes, sans résultats inventés.
- `takeaways` : trois points maximum, strictement dérivés des sources.
- `context`, `project`, `tech`, `badges`, `actors`, `performance`, `lesson`, `similar`, `sources`.

Règles :

- Ne pas confondre objectif annoncé, estimation et résultat mesuré.
- Ne pas inventer de surface, montant, performance, acteur ou date.
- Une lacune doit rester explicite.
- Les liens acteurs doivent pointer uniquement vers des acteurs réellement présents dans les projets.

## Acteurs

Les acteurs sont dérivés des projets présents dans `assets/observatoire.js`.

Un acteur peut être affiché si :

- il est nommé dans un projet ;
- son rôle est explicitement associé au projet ;
- la page acteur ne déduit pas un rôle non publié.

Les techniques listées pour un acteur sont celles des projets auxquels il est associé. Elles ne doivent pas être présentées comme des techniques directement réalisées par cet acteur sans preuve.

## Veille publique

Source actuelle : `assets/veille-data.js`.

État actuel attendu :

```js
window.watchItems = []
```

Un item publié devra distinguer :

- `sourceUrl` : URL de la source consultée.
- `targetUrl` : URL interne publique vers la synthèse ou la page associée.
- `status` ou `statut` : seulement `published` ou `publie` pour l'export public.
- `title`, `date`, `sourceName`, `category`, `territory`, `summary`, `verificationDate`.

Règles :

- Aucun brouillon dans l'export public.
- Aucun faux lien.
- Aucun contenu fictif de démonstration.
- Publication seulement après sélection, vérification et validation humaine.

Champs bloquants pour un export public :

- identifiant unique ;
- statut `published` ou `publie` ;
- titre ;
- date valide et non future ;
- catégorie autorisée ;
- source clairement identifiée ;
- URL de source valide ;
- résumé ;
- date de vérification ;
- validation humaine dans le corpus interne.

Sources prioritaires de niveau 1 :

- ANAH ;
- France Rénov' ;
- ADEME ;
- Légifrance ;
- Service-Public ;
- ministères ;
- DREAL ;
- collectivités territoriales ;
- Clermont Auvergne Métropole ;
- Région Auvergne-Rhône-Alpes.

Le fichier livré au navigateur ne doit contenir que les éléments publiés. Les brouillons, doublons, rejets, archives et validations internes restent hors export public.

## Obsidian vers site public

Chaîne cible proposée :

`note ou export éditorial → parsing → normalisation → validation → aperçu du diff → export public`

Le mode par défaut doit rester `--check` ou `--dry-run`. Il ne doit jamais modifier le vault Obsidian.

Mapping minimal :

- `frontmatter.id` → `project.id` ;
- `frontmatter.titre` → `project.title` ;
- `frontmatter.territoire` → `project.place` ou territoire associé ;
- section `Sources` → `project.sources` ;
- `statut_publication: public` requis pour tout export.

## Recherche

Source générée : `assets/search-index.js`.

Commande :

```powershell
npm.cmd run site:search
```

L'index exclut les laboratoires internes et les pages `noindex`.

## Inventaire

Sources générées :

- `docs/site-inventory.json`
- `docs/site-inventory.md`

Commande :

```powershell
npm.cmd run site:inventory
```

L'inventaire sert à repérer les pages utiles, secondaires, laboratoires, orphelines ou à examiner.
