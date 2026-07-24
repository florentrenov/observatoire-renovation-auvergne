# Espace interne non publiable

Ce dossier contient les outils de pilotage et laboratoires conservés pour la recherche et la validation humaine.

- `cockpit/` : cockpit du graphe de connaissances ;
- `veille-automatique/` : laboratoire de veille.

Règles impératives :

- aucun fichier de `internal/` ne doit entrer dans `dist/` ;
- aucun index public, sitemap ou flux ne doit référencer ces chemins ;
- `noindex` n’est pas considéré comme une protection ;
- le build public échoue si un chemin ou une référence interne est détecté ;
- toute réouverture publique nécessite une décision humaine documentée.

