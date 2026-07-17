# Gouvernance de prépublication

## Dépôt canonique

- Dépôt public vérifié en lecture seule : `https://github.com/florentrenov/observatoire-renovation-auvergne`.
- Branche par défaut : `main`.
- Site public testé : `https://florentrenov.github.io/observatoire-renovation-auvergne/`.
- Le dossier local `site-observatoire-v2` reste non suivi dans le dépôt parent du vault.
- Aucune synchronisation automatique n'a été exécutée.

## Pages sensibles

| Page | Fonction actuelle | Risque | Recommandation | Décision requise |
|---|---|---|---|---|
| `observatoire/` | Synthèse secondaire de l'observatoire | doublon partiel avec accueil/projets | conserver temporairement, relier ou transformer en page manifeste courte | oui |
| `analyses/` | Lecture transversale | orpheline, contenu encore léger | conserver hors mise en avant ou enrichir avec données réelles | oui |
| `techniques/` | Couche technique | orpheline, risque page catalogue faible | relier depuis projets si enrichie, sinon conserver secondaire | oui |
| `territoires/` | Index territorial | orpheline mais utile | relier depuis Puy-de-Dôme ou accueil si contenu renforcé | oui |
| `recherche/` | Recherche publique | orpheline dans navigation principale | ajouter éventuellement au footer ou à À propos | oui |
| `veille-automatique/` | Laboratoire | exposition accidentelle | conserver `noindex`, exclure sitemap | non immédiate |
| `analyse-connaissances/` | Cockpit interne | application interne, structure H1 non standard | conserver `noindex,nofollow`, exclure sitemap | non immédiate |

## Orphelines

Orphelines volontaires internes :

- `veille-automatique/`
- `analyse-connaissances/`

Pages utiles à relier ou décider :

- `recherche/`
- `observatoire/`
- `analyses/`
- `techniques/`
- `territoires/`

## SEO

La base publique est centralisée dans `site.config.json`.

Les pages indexables disposent maintenant de :

- meta description ;
- canonical ;
- Open Graph minimal ;
- `WebSite` JSON-LD uniquement sur l'accueil.

Les laboratoires restent hors sitemap.

## Limite accessibilité connue

Les tests viewport réels et zoom 200 % passent. Une simulation CSS `zoom: 4` en navigateur headless provoque encore des scrollWidth artificiels sur certains blocs. Cette mesure est conservée comme signal de prudence, mais elle ne remplace pas un test manuel de zoom navigateur réel.

## Prochaines décisions

1. Confirmer si `recherche/` doit entrer dans le footer.
2. Décider du rôle de `observatoire/`.
3. Décider si `analyses/`, `techniques/` et `territoires/` restent indexables avant publication.
4. Vérifier les droits des images avant partage externe large.
