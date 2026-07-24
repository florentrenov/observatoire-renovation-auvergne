# Rapport des tests interactifs P0.6

Date : 21 juillet 2026
Navigateur : navigateur intégré Codex, moteur Chromium
Environnement : serveur local préfixé `/observatoire-renovation-auvergne/`

## Matrice exécutée

Les 17 routes ci-dessous ont été testées à **360×800**, **390×844** et **768×1024** : accueil, recherche, index projets, PDD-001, PDD-002, index acteurs, fiche SPL OSER, index techniques, index territoires, fiche Puy-de-Dôme, veille, sources, à propos, 404 inventée, `/cockpit/`, `/veille-automatique/` et `/analyse-connaissances/`.

| Dimension | Débordement horizontal | H1/contenu | Navigation | Console | Résultat |
|---|---:|---:|---:|---:|---|
| 360×800 | 0 | conforme | visible | 0 erreur | réussi |
| 390×844 | 0 | conforme | visible | 0 erreur | réussi |
| 768×1024 | 0 | conforme | visible | 0 erreur | réussi |

La recherche a renvoyé 6 résultats pour « SPL OSER » à 360 px, 19 pour « photovoltaïque » à 390 px et 18 pour « Clermont-Ferrand » à 768 px, sans débordement.

## Points particuliers

- le menu principal est statique et toujours visible : aucune commande ouvrir/fermer n'existe, donc ce geste est non applicable ;
- aucune fiche technique dédiée n'existe dans la candidate ; seul l'index a été testé, conformément à l'interdiction de créer des pages P1 ;
- les liens textuels intégrés aux paragraphes ne sont pas traités comme de grands boutons ; les zones de navigation et cartes sont reconnaissables ;
- le lien d'évitement est visible au focus sur huit routes prioritaires dans les trois dimensions ; sa cible a été activée et vérifiée ;
- les pages contiennent leur contenu principal dans le HTML, sans dépendre de JavaScript ;
- la 404 est servie avec le statut HTTP 404 et propose accueil, recherche, projets et retour navigateur optionnel ;
- aucune redirection automatique ne masque les anciennes routes internes.

## Preuves

Les captures sont conservées sous `docs/p0-6/preuves/captures/` et inventoriées dans le dossier de revue visuelle. Aucun défaut bloquant n'a été observé. La validation esthétique et éditoriale reste humaine.
