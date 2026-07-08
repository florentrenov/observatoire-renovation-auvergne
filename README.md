# Observatoire rénovation Auvergne - prototype V2

Ce dossier est une itération visuelle séparée de `site-observatoire-v1` et du
vault Obsidian source. Il ne crée pas de nouveau contenu documentaire : il
travaille uniquement la couche UX, UI, direction artistique et composants.

## 1. Audit synthétique de la V1

### Cohérence avec la charte Basalte

La V1 respectait les fondamentaux :

- palette Basalte / Cendre / Lave globalement maîtrisée ;
- rouge lave rare ;
- typographies cohérentes avec la charte ;
- cartes sobres, sans ombres ni effets marketing ;
- navigation claire.

### Faiblesses visuelles

- Le héro ressemblait encore à un schéma CSS plutôt qu'à une image forte.
- La page d'accueil annonçait le projet mais ne créait pas de souvenir visuel.
- Les cartes avaient toutes le même poids et produisaient une sensation de
  grille fonctionnelle.
- Les sections étaient lisibles mais trop régulières : même rythme, mêmes
  espacements, même densité.
- La direction "roche / strates / observation" était présente mais pas encore
  incarnée.

### Ce qui donnait une impression technique

- Mention visible de "Prototype V1" et "couche visible Quartz".
- Parcours en six cases proche d'un composant de dashboard.
- Métadonnées très nombreuses en premier écran.
- Visuel abstrait trop systémique, pas assez matérialisé.

### Ce qui donnait une impression étudiante

- Formulations défensives comme "Un observatoire, pas une vitrine".
- Cartes d'entrée trop démonstratives.
- Page méthode encore très proche d'une explication de projet.
- Hiérarchie qui disait quoi regarder au lieu de le faire sentir.

### Ce qui donnait une impression prototype

- Héro sans asset réel.
- Footer explicitant le prototype.
- Plusieurs libellés "placeholder", "à connecter", "exemple".
- Pages internes très proches les unes des autres.

## 2. Direction V2

La V2 renforce trois idées :

1. **Territoire comme matière**  
   Le visuel héro devient une planche minérale et cartographique, inspirée du
   basalte, des strates et du relevé territorial.

2. **Observatoire comme instrument**  
   La mise en page devient plus éditoriale : grand premier écran, signes fins,
   routes de lecture, cartes comme fiches de relevé.

3. **Sobriété plus mature**  
   Le rouge lave reste très rare. L'identité vient surtout de la matière, des
   filets, de la typographie et de l'espace.

## 3. Changements implémentés

- Nouveau dossier autonome `site-observatoire-v2`.
- Nouveau visuel héro bitmap : `assets/hero-puy-de-dome-green.png`.
- Ancien visuel minéral conservé en archive de travail : `assets/hero-basalte.png`.
- Accueil reconstruit autour d'un héro plein écran.
- Hiérarchie typographique renforcée.
- Navigation plus discrète et plus institutionnelle.
- Cartes retravaillées avec des proportions différenciées.
- Pages internes harmonisées avec un système d'en-tête plus mature.
- Composants Quartz de départ :
  - `ObservationHero.tsx`
  - `ObservationCards.tsx`

## 4. Arborescence

```text
site-observatoire-v2/
  index.html
  assets/
    styles.css
    hero-basalte.png
    hero-puy-de-dome-green.png
  territoires/
    puy-de-dome/index.html
  documentation/
    index.html
    renovation-globale/index.html
  veille/index.html
  methode/index.html
  recherche/index.html
  quartz-components/
    ObservationHero.tsx
    ObservationCards.tsx
    types.ts
```

## 5. Pages

- Accueil : `index.html`
- Territoire exemple : `territoires/puy-de-dome/index.html`
- Documentation : `documentation/index.html`
- Fiche exemple : `documentation/renovation-globale/index.html`
- Veille : `veille/index.html`
- Méthode : `methode/index.html`
- Recherche : `recherche/index.html`

## 6. Intention UI

La V2 doit moins expliquer qu'elle est un observatoire, et davantage en donner
la sensation : un espace de consultation calme, précis, territorial, minéral.

Le site ne cherche pas l'effet spectaculaire. Il cherche une mémoire visuelle :
fond basalte, planche de relevé, filets fins, lecture en strates.
