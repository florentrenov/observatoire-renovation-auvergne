# Plan de hotfix du cockpit de production

Statut : **proposition non appliquée — autorisation humaine requise**

## Portée minimale

1. Créer une branche de hotfix depuis le `main` public exact, sans fusionner P0/P0.6.
2. Supprimer uniquement les contenus servis sous `analyse-connaissances/` et `veille-automatique/`, ainsi que leurs ressources exclusivement internes.
3. Ne modifier ni les cinq projets publics, ni leurs identités, ni le contenu éditorial général.
4. Produire l'artefact avec une allowlist explicite et un remplacement complet, jamais par copie incrémentale.
5. Faire valider humainement le diff et l'artefact avant tout déploiement.

## Tests propres au hotfix

- les deux anciennes routes et leurs fichiers de données répondent 404 après publication ;
- sitemap, recherche et pages publiques existantes restent inchangés ;
- PDD-006 à PDD-009 restent absents ;
- aucune occurrence de `cockpit`, `analyse-connaissances`, `veille-automatique`, `internal`, chemin Windows ou donnée personnelle indue dans l'artefact ;
- build déterministe, vérification de liens et test de rollback réussis ;
- contrôle HTTP post-déploiement sur les anciennes routes.

## Réversibilité

Conserver le SHA déployé, l'artefact et la sauvegarde de production. Le rollback consiste à redéployer l'artefact public précédent complet, puis à recontrôler les URL critiques. La sauvegarde existante ne doit pas servir de prétexte à republier durablement le cockpit : elle est une preuve et un dernier recours.

## Condition de lancement

Le hotfix ne peut être appliqué, poussé ou déployé qu'après validation explicite de sa branche, du mécanisme Pages et de sa checklist post-déploiement.
