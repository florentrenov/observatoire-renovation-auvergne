# Hotfix P0.7 — routes internes

Document de synthèse recopié sur la branche de préparation finale. L'implémentation reste exclusivement sur `codex/hotfix-retrait-routes-internes`.

## Recommandation

**HOTFIX PRÊT SOUS CONDITIONS**, non fusionné, non poussé et non déployé.

- base réelle : `main` / `origin/main` / déploiement Pages `aaa7862b85c842345bf339f1d2e83af2d1f3402b` ;
- branche : `codex/hotfix-retrait-routes-internes` ;
- commits : `bbfa16b`, `e7c5041` et correction P0.8 `ee03091` ;
- empreinte normalisée : `968d8e40e1681f6d4787652bbac9b49447cb069cddd26ca987fc8238aeebcd62` ;
- rollback baseline normalisée : `0d09af1c926b02a4cd2224ab3ecfb4530524ae6b21a3f053d0f4cec11b8703e3`.

La correction P0.8 normalise les fichiers texte en LF, refuse les fins de ligne non canoniques et exclut explicitement le fichier administratif `.git` des worktrees liés. L'empreinte ci-dessus est identique dans des checkouts CRLF et LF.

La correspondance production/main est établie par le SHA du déploiement et neuf fichiers identiques octet pour octet.

| Route/ressource | Production actuelle | Artefact hotfix | Décision |
|---|---:|---:|---|
| `/cockpit/` | 404 | 404 | conserver |
| `/analyse-connaissances/` | 200 | 404 | retirer |
| JSON du cockpit | 200 | 404 | retirer |
| `/veille-automatique/` | 200 | 404 | retirer |
| rapports/scripts/configurations directs | plusieurs 200 | 404 | exclure par Jekyll |

Le hotfix supprime les six fichiers du cockpit, la veille automatique et ses deux assets exclusifs. `_config.yml` exclut de Pages les rapports, scripts et sources de maintenance. La mention PDD-006 à PDD-010 est retirée de `analyses/` et de la recherche ; les cinq fiches projets restent identiques à `main`.

## Contrôles

- 59 pages sitemap avant/après ; 59 entrées de recherche ; 5 projets ;
- 59/59 routes publiques locales en HTTP 200 ;
- 10/10 ressources retirées en 404 ;
- build déterministe et denylist réussis ;
- test négatif : une réintroduction de `/cockpit/` est rejetée ;
- accueil et PDD-001 sans erreur console ni débordement à 360×800 et 768×1024 ;
- rollback local avec empreinte baseline restaurée.

Condition : les cinq fiches de l'ancienne production restent dépendantes de JavaScript. Cette limite préexistante est inchangée ; la corriger aurait importé P0.6 dans le hotfix. Elle doit être acceptée pour un retrait urgent isolé ou disparaître lors du déploiement complet de P0.6.

## Déploiement et rollback futurs

Après signature humaine et sauvegarde, intégrer uniquement les deux commits hotfix à `main`, laisser le workflow Pages de branche reconstruire, puis contrôler toutes les routes retirées. Le rollback restaure le snapshot `aaa7862…` complet et son empreinte, mais réexpose le cockpit ; il est réservé à un incident plus grave.
