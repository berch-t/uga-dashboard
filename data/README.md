# Data marts

Ce dossier contient les *data marts* JSON consommés par le tableau de bord. Ils
sont **générés à partir de données réelles** par `npm run pipeline` et
versionnés pour un déploiement sans base de données.

> Reproductibilité : relancer `npm run pipeline` régénère l'ensemble. Les
> chiffres peuvent évoluer légèrement avec les bases en amont (HAL, OpenAlex).
> La date de l'instantané est dans `manifest.json`.

## Provenance

- OpenAlex (CC0) : institution `I899635006`.
- HAL (CCSD) : portée `structAcronym_s:UGA`.

## Fichiers

| Fichier | Contenu | Base de calcul |
|---|---|---|
| `overview.json` | Total, accès ouvert, séries annuelles, types, voies OA | Corpus complet |
| `sources.json` | Principaux supports (revues, plateformes) | Corpus complet |
| `bibliometrics.json` | h / g / i10, stats et distribution des citations | Top-cités + échantillon |
| `topics.json` | Matrice topic × année, tendances, rafales | Corpus complet (séries) |
| `authors.json` | Auteurs prolifiques + ajustement de Lotka | Corpus + échantillon |
| `network.json` | Nœuds, arêtes, communautés, modularité | Échantillon |
| `reconciliation.json` | Rapport d'appariement HAL × OpenAlex | Échantillons HAL & OpenAlex |
| `papers.json` | Publications les plus citées (graine de l'explorateur) | Top-cités |
| `manifest.json` | Provenance, instantané, périmètres | — |

## Schéma

La forme exacte de chaque mart est définie, et typée, dans
`pipeline/marts/schema.ts`. Le tableau de bord la réexporte via `src/lib/types.ts` :
la donnée produite et la donnée consommée partagent un seul contrat de types.

## Régénération

```bash
npm run pipeline        # build complet (écrit *.json ici)
npm run pipeline:dry    # connectivité des API seulement, sans écriture
```

Pour cibler un autre établissement, modifier `pipeline/config.ts` (ou les
variables d'environnement) puis relancer la commande.
