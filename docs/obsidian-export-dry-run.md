# Dry-run export Obsidian

Simulation sur fixtures séparées. Aucun fichier du vault Obsidian n'est lu, créé ou modifié.

| Fixture | Action | Erreurs |
|---|---|---|
| projet-valide | export simulé | aucune |
| identifiant-manquant | rejeté | id manquant |
| source-absente | rejeté | source absente |
| statut-prive | rejeté | statut non public |
| caracteres-francais | export simulé | aucune |

## Mapping cible

- `frontmatter.id` → `project.id`
- `frontmatter.titre` → `project.title`
- `frontmatter.territoire` → `project.place` ou territoire associé
- section `Sources` → `project.sources`
- `statut_publication: public` requis pour tout export
