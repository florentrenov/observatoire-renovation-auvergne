# Baseline P0.6

Date : 21 juillet 2026
Branche de départ : `codex/securisation-p0`
Commit vérifié : `2987d79f928db49748510e0e115aeaffdb10b8d9`
Branche de travail : `codex/cloture-p0-6`

Avant modification, l'arbre était propre et le commit correspondait exactement au HEAD imposé. Les dix rapports P0.5 demandés ont été lus intégralement et confrontés au dépôt.

## Contrôles initiaux

- `npm run release:check` : réussi ;
- `npm run rollback:test` : réussi ;
- campagne négative P0.5 : 10/10 réussie ;
- 59 pages publiques, 59 URL de sitemap et 59 entrées de recherche ;
- PDD-001 à PDD-005 publiables ; PDD-006 à PDD-009 exclus ;
- aucun cockpit, dossier interne, chemin Windows ou donnée personnelle indue dans `dist/` ;
- build déterministe et rollback local valide ;
- empreinte de l'artefact initial : `1578e441…856f` (valeur enregistrée par le contrôle P0.5).

La sauvegarde de la production annoncée a été retrouvée et son SHA-256 correspond à `d79c42a5e85ed012b0861fce00ea8db5274a028015bce9d275722544d742156a`.

## Limite constatée

La production publique n'était pas modifiée par la candidate P0.5 et conservait des routes internes accessibles. Ce constat est traité séparément dans l'évaluation d'urgence.
