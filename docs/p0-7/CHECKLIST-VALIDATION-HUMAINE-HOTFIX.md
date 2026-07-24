# Checklist humaine du hotfix P0.7

Codex laisse toutes les validations humaines à **non vérifié**.

## Avant autorisation

- [ ] Diff limité au retrait interne, aux exclusions, tests et documentation.
- [ ] Limite sans JavaScript de l'ancienne production comprise et acceptée.
- [ ] Sauvegarde et commit `aaa7862…` disponibles.
- [ ] Empreinte hotfix corrigée P0.8 `968d8e40e1681f6d4787652bbac9b49447cb069cddd26ca987fc8238aeebcd62` confirmée.
- [ ] Rollback et risque de réexposition compris.

## Après un éventuel déploiement autorisé

| Contrôle | Statut | Commentaire humain |
|---|---|---|
| Cockpit et JSON inaccessibles | non vérifié | |
| Veille automatique inaccessible | non vérifié | |
| Rapports/scripts/configurations non servis | non vérifié | |
| Accueil fonctionnel | non vérifié | |
| Index projets fonctionnel | non vérifié | |
| PDD-001 fonctionnel | non vérifié | |
| Recherche fonctionnelle | non vérifié | |
| Sitemap sans route interne | non vérifié | |
| Aucune donnée interne visible | non vérifié | |
| Erreur 404 compréhensible | non vérifié | |
| Rollback disponible | non vérifié | |

- [ ] Autorisation explicite de merge.
- [ ] Autorisation explicite de push.
- [ ] Autorisation explicite de déploiement.
