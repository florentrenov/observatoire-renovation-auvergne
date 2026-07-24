# Évaluation urgente du cockpit en production

Date d'observation : 21 juillet 2026
URL principale : `https://florentrenov.github.io/observatoire-renovation-auvergne/analyse-connaissances/`
Décision : **risque élevé**

## Constat

La route publique répond en HTTP 200 et présente un « Cockpit des connaissances » qualifié d'interne. Son fichier de données JSON est lui aussi accessible directement. L'interface affiche notamment 65 entités, 55 relations, 18 assertions, 14 sources, 66 éléments à vérifier, 132 suggestions en attente et 15 alias ambigus.

| Question | Réponse factuelle |
|---|---|
| Démonstration publique inoffensive uniquement | Non |
| Données de pilotage | Oui : états, lacunes, priorités et suggestions |
| Règles internes | Oui : règles et critères provisoires |
| Brouillons | Oui : propositions et éléments « à vérifier » |
| Décisions éditoriales | Oui : champs de décision et de statut |
| Chemins locaux ou données personnelles indues | Aucun trouvé dans les fichiers inspectés |
| Données non validées | Oui, explicitement signalées comme provisoires ou à vérifier |
| Accès facilité à d'autres ressources internes | Oui, au moins par les routes et ressources statiques associées |
| Indexation possible | Limitée par `noindex,nofollow`, mais l'accès direct et le partage d'URL restent possibles |
| Présence dans sitemap ou recherche publique | Non |
| Liens entrants dans les pages publiques | Aucun trouvé |

Le HTML public et le JSON correspondent aux sauvegardes locales inspectées. Le cockpit ne publie pas PDD-006 à PDD-009, ni chemin Windows, mais expose suffisamment de logique de pilotage et de contenu non validé pour justifier le niveau **élevé**.

## Décision

Un hotfix séparé est nécessaire. Il ne doit pas reprendre la candidate P0.6 : il part de `main`, retire seulement les anciennes routes internes, est testé puis soumis à autorisation humaine. Aucun changement n'a été appliqué à la production pendant cette mission.
