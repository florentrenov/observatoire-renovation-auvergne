# Rapport d'exécution P0.6

Date : 21 juillet 2026
Branche : `codex/cloture-p0-6`
Source publique candidate : `bead360af9dc2156a2ba4dae9967322adc68ab1a`

## Résultat

La candidate reçoit un **GO TECHNIQUE**, avec `human_approval_required`. Aucun push, merge ou déploiement n'a été effectué.

## Modifications réalisées

- ajout du lien d'évitement et de sa cible sur toutes les pages applicables ;
- correction de 23 hiérarchies H1→H3 et maintien visuel par classe CSS ;
- contraste Lave/Basalte porté d'environ 4,10:1 à 5,03:1 ;
- ajout d'un contrôle automatisé titres/lien/contrastes/contenu sans JavaScript ;
- création d'une 404 responsive, `noindex,follow`, sans redirection automatique ;
- ajout d'un serveur de prévisualisation capable de servir cette 404 sous le préfixe projet ;
- dates de vérification réelles ajoutées aux cinq projets et URL PDD-002 réparée ;
- vérificateur étendu aux liens absolus sous la racine du projet ;
- workflow Pages manuel construisant et téléversant uniquement `dist/` ;
- rapports, captures, inventaire juridique et paquet de revue conservés hors publication.

## Commits cohérents

| Commit | Objet | Portée et test principal |
|---|---|---|
| `6cc0f28` | accessibilité structurelle | 59 pages, test automatisé |
| `c618275` | 404 sûre | allowlist, serveur et routes retirées |
| `cca6ef9` | shell | conservation du lien Méthode dans les pieds de page multilignes |
| `00aa140` | données | cinq dates prouvées et source PDD-002 |
| `6916457` | Pages | workflow manuel `dist` uniquement |
| `bead360` | vérification | validation des URL absolues de racine projet |

Les identités et la sélection de publication n'ont pas changé.

## Cockpit public

La production actuelle expose encore un cockpit et son JSON en HTTP 200. Il contient pilotage, règles provisoires, suggestions, lacunes et décisions éditoriales non validées. Risque classé **élevé**. Un plan de hotfix distinct depuis `main` est fourni mais n'a pas été appliqué.

## Tests interactifs

Les 17 routes prioritaires ont réussi à 360×800, 390×844 et 768×1024 : aucun débordement horizontal, contenu principal présent, navigation visible, H1 cohérent et zéro erreur console. La recherche, la 404 et le focus du lien d'évitement sont fonctionnels. Le menu est statique (ouvrir/fermer non applicable) et aucune fiche technique dédiée n'existe dans le périmètre P0.

## 404

Les chemins `/cockpit/`, `/veille-automatique/`, `/analyse-connaissances/`, une route inventée et l'ancien slug testé reçoivent la page personnalisée avec statut 404. Le choix 404, plutôt que 410, correspond au comportement natif d'un hébergement statique GitHub Pages et n'affirme pas une suppression juridique définitive. Aucune redirection vers l'accueil n'est effectuée.

## GitHub Pages

Le déploiement public observé est un build Jekyll depuis `main` ; le réglage administratif exact n'est pas lisible sans droits. Fusionner avant passage de la source à GitHub Actions est interdit. Le workflow préparé est manuel, valide l'artefact et téléverse seulement `dist/`. Le remplacement complet et le rollback sont documentés.

## Résultats finaux

| Contrôle | Résultat |
|---|---|
| `site:check` / SEO / recherche | réussi, 2 avertissements documentés |
| registre d'identités | 9 identifiants, 4 gelés, réussi |
| build déterministe | réussi |
| artefact | 59 pages, 60 HTML dont 1 utilitaire, 5 projets |
| sitemap / recherche | 59 / 59 |
| accessibilité ciblée | 60 HTML et 4 couples, réussi |
| vérification allowlist/liens/manifeste | réussi |
| tests négatifs | 10/10 réussis |
| rollback local | réussi |
| empreinte publique | `10018bce954ae61b8b562a7ca6cc1d35bf68fcf41cc8f8bda8f7a6ac71c5763e` |

## Points restant à signer

- appréciation visuelle et exactitude éditoriale ;
- informations légales, contact, hébergeur, confidentialité et accessibilité ;
- manifeste candidat ;
- changement de source GitHub Pages ;
- hotfix production ;
- autorisation explicite de déploiement.
