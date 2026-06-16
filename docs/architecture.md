# Architecture

## Vue d'ensemble

Le projet sépare strictement trois responsabilités, sur le modèle d'un entrepôt
décisionnel (préfiguration du futur SID de l'établissement) :

```
┌────────────────┐      ┌────────────────────┐       ┌──────────────────┐       ┌───────────────┐
│  Connecteurs   │ ───▶ │   Fiabilisation    │ ───▶ │   Data marts     │ ───▶ │  Restitution  │
│  (API HAL +    │      │   (normalisation,  │       │   (JSON          │       │  (dashboard   │
│   OpenAlex)    │      │   taxonomie,       │       │   versionnés)    │       │   Next.js)    │
│                │      │   réconciliation)  │       │                  │       │               │
└────────────────┘      └────────────────────┘       └──────────────────┘       └───────────────┘
        pipeline/  (exécuté par `npm run pipeline`)            data/marts/         src/
```

L'ETL est découplé de la restitution : il s'exécute hors-ligne et produit des
*data marts* JSON. Le tableau de bord lit ces marts (instantané rapide,
déploiement sans base de données), et n'appelle les API en direct que pour
l'explorateur d'articles.

## Couches

### `pipeline/` (ETL, TypeScript exécuté via tsx)

- `connectors/` : l'interface `Connector` et ses implémentations OpenAlex et
  HAL, plus un client HTTP avec *retry* et *backoff*.
- `transform/` : `taxonomy.ts` (correspondance des types), `normalize.ts`
  (DOI, titres, résumés), `reconcile.ts` (record linkage).
- `analytics/` : `bibliometrics.ts`, `lotka.ts`, `burst.ts`, `trends.ts`,
  `network.ts`. Fonctions pures, testées.
- `marts/` : `schema.ts` (contrat de données), `builders.ts` (transformations
  pures), `build-marts.ts` (orchestrateur + manifeste).

### `data/marts/` (modèle)

Neuf fichiers JSON + un manifeste de provenance. Voir `data/README.md`.

### `src/` (restitution, Next.js App Router)

- `app/` : la page unique et les routes API (`/api/papers`, `/api/health`).
- `components/` : un dossier par domaine (kpi, charts, topics, network,
  quality, papers, layout, ui).
- `lib/` : types (réexport du schéma des marts), formatage, couleurs, accès
  typé aux marts, client OpenAlex live.

## Contrat de données partagé

`pipeline/marts/schema.ts` définit la forme des marts. `src/lib/types.ts` la
réexporte. Les builders (côté ETL) et les composants (côté UI) sont donc
typés contre la même source : aucune dérive possible entre la donnée produite
et la donnée consommée.

## Deux points d'extension déclaratifs

1. **Registre de KPI** (`src/components/kpi/registry.ts`) : ajouter un indicateur
   de tête revient à ajouter une entrée ; la grille s'adapte.
2. **Interface `Connector`** (`pipeline/connectors/types.ts`) : ajouter une
   source (Crossref, ScanR, Scopus, fichiers internes) revient à implémenter
   trois méthodes, sans toucher au reste.

## Principes de code

- Aucun fichier monolithique (tous < ~200 lignes).
- Une responsabilité par module ; fonctions pures côté pipeline.
- TypeScript strict (`noUncheckedIndexedAccess`, pas de `any`).
- Rendu côté serveur pour les vues corpus ; composants client uniquement pour
  l'interactivité (graphiques, réseau, explorateur).
