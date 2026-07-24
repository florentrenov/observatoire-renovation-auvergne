# Rapport des corrections d'accessibilité P0.6

Date : 21 juillet 2026
Portée : blocages P0 identifiés, sans déclaration de conformité RGAA globale.

## Lien d'évitement

Les 59 pages publiques sources comportent désormais, avant l'en-tête, un lien `Aller au contenu principal` vers l'identifiant unique `contenu`. Il est le premier élément focusable, devient visible au focus, reste utilisable sans JavaScript et évite le recouvrement par l'en-tête. La 404 emploie le même mécanisme.

Les contrôles couvrent l'accueil, l'index et une fiche projet, l'index et une fiche acteur, la recherche, les sources et la 404. Le focus clavier, la visibilité du contour et l'activation de la cible ont été vérifiés ; le test automatique contrôle présence, ordre, unicité et validité de la cible sur toutes les pages applicables.

## Hiérarchie des titres

Les 23 sauts H1→H3 provenaient de titres visuels de cartes réutilisés. Ils ont été convertis en H2 et leur apparence conservée par la classe `card-heading` :

`a-propos/`, `acteurs-locaux/`, les 15 fiches sous `acteurs/`, `aides-locales/`, `analyses/`, `documentation/`, `methode/`, `sources/`, `techniques/` et `territoires/`.

Le contrôle automatisé refuse désormais l'absence de H1, plusieurs H1, un titre vide ou un saut de niveau. Aucune exception n'est nécessaire dans la candidate.

## Contraste ciblé

La variable Lave sur Basalte est passée de `#c65a30` sur `#1a1917` (environ 4,10:1) à `#d56b40` sur `#1a1917` (environ 5,03:1). La correction vise les usages fonctionnels de texte et de lien sans modifier le reste de la charte. Le focus dispose par ailleurs de son propre contour ocre.

Le test reproductible vérifie quatre couples fonctionnels, dont Lave/Basalte, le lien d'évitement et les états essentiels. Les badges, boutons, liens, alertes et grands textes ont été revus dans les trois dimensions interactives.

## Vérifications

- `npm run public:accessibility` : réussi ;
- contrôle sans JavaScript : contenu principal statique présent ;
- test structurel intégré à `npm run release:check` ;
- pas de changement des identités, des projets publiés ou du nombre de pages indexées.

Ces corrections ferment les défauts P0 ciblés ; elles ne constituent pas un audit exhaustif ni une attestation réglementaire.
