# Décision GO / NO-GO P0.6

Date : 21 juillet 2026

## Décision : GO TECHNIQUE

La candidate ferme les blocages techniques P0.5 : lien d'évitement, titres, contraste ciblé, dimensions 360×800/390×844/768×1024, cinq dates arbitrées, 404, exclusion interne, déterminisme, 10/10 tests négatifs et rollback. L'artefact reste à 59 pages de sitemap/recherche, 5 projets, sans PDD-006 à PDD-009.

Cette décision **n'est pas un GO FINAL**. Le manifeste conserve `human_approval_required` et aucune publication n'est autorisée.

## Conditions avant toute publication

1. L'utilisateur signe la revue visuelle et arbitre les éléments éditoriaux nécessaires.
2. L'inventaire juridique est complété/validé sans reprendre le brouillon comme texte acquis.
3. Un administrateur confirme puis remplace la source Pages par **GitHub Actions avant toute fusion sur `main`**.
4. Le workflow manuel `dist` uniquement est revu, autorisé et lancé sur le commit exact approuvé.
5. Le cockpit encore public fait l'objet du hotfix séparé ou d'une décision humaine explicite ; P0.6 ne l'a pas modifié.
6. La checklist de remplacement et de rollback est signée.

Si la source Pages reste une publication de branche/racine, la décision redevient **NO-GO**, car `internal/` pourrait être exposé. Si la revue révèle une incohérence majeure, elle redevient également NO-GO.

## Avertissements acceptables à ce stade

Les seuls avertissements automatiques restants concernent l'absence de résultats mesurés publiés pour PDD-003 et PDD-004. Les pages le disent explicitement et ne présentent pas les objectifs comme des résultats. Ils ne bloquent pas le GO technique.

## Signature humaine

- Revue visuelle : **non signée**
- Informations éditoriales/juridiques : **non validées**
- Manifeste : **non validé**
- Autorisation de déploiement : **absente**
