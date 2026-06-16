# Méthodologie des analyses

Toutes les méthodes sont implémentées en TypeScript pur, dans `pipeline/analytics/`
et `pipeline/transform/`, et couvertes par des tests unitaires. Synthèse ;
justification complète et résultats dans [POC.md](../POC.md).

## Indices bibliométriques (`analytics/bibliometrics.ts`)

- **h-index** (Hirsch, 2005) : plus grand h tel que h publications ont >= h
  citations.
- **g-index** (Egghe, 2006) : plus grand g tel que les g publications les plus
  citées cumulent >= g² citations.
- **i10-index** : nombre de publications avec >= 10 citations.
- **Distribution** : buckets log (`0`, `1–9`, `10–49`, `50–99`, `100–499`,
  `500+`), adaptés à la forte asymétrie des citations.

## Loi de Lotka (`analytics/lotka.ts`)

Modèle f(n) = C / nᵃ (nombre d'auteurs publiant n articles). On linéarise en
log-log et on estime a et C par moindres carrés. On reporte a, C, R² et le
spectre observé vs prédit. Une valeur a ≈ 2 est attendue.

## Détection de rafales (`analytics/burst.ts`)

Automate à deux états de Kleinberg (2002), version discrète :

- émission binomiale, taux de base `p0 = ΣR/ΣD`, taux de rafale `p1 = p0·s` ;
- coût de transition vers l'état élevé `γ·ln(n)` ;
- chemin de coût minimal par programmation dynamique (Viterbi) ;
- les périodes en état élevé forment les rafales, pondérées par le gain de
  vraisemblance.

Appliqué à la matrice topic × année (séries issues du corpus complet).

## Tendances (`analytics/trends.ts`)

- **CAGR** entre première et dernière valeur non nulle.
- **Régression linéaire** (MCO) avec pente, ordonnée et R².

## Réseau de collaboration (`analytics/network.ts`)

- Construction d'un graphe non orienté d'institutions co-publiantes (ego exclu),
  arêtes pondérées par co-occurrence.
- Réduction aux nœuds les plus collaboratifs pour la lisibilité ; arêtes
  faibles élaguées.
- **Louvain** (Blondel et al., 2008) pour les communautés ; **ForceAtlas2**
  (Jacomy et al., 2014) pour la disposition. Positions précalculées hors-ligne.

## Réconciliation

Voir [reconciliation.md](./reconciliation.md).

## Honnêteté scientifique

Chaque indicateur affiche sa base de calcul. Les analyses sur notices utilisent
un échantillon temporel borné et documenté. Aucune valeur n'est inventée.
