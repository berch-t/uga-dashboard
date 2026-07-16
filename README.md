# Pilotage de la production scientifique — Université Grenoble Alpes

Tableau de bord décisionnel de la production scientifique du site Grenoble Alpes,
alimenté **exclusivement par des données réelles** issues des deux API ouvertes
citées dans l'offre : **HAL** et **OpenAlex**. Il intègre une brique de
**fiabilisation et de réconciliation** des deux sources et des **analyses
scientométriques reconnues**.

![Licence](https://img.shields.io/badge/licence-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-15-black)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6)
![Données](https://img.shields.io/badge/donn%C3%A9es-100%25%20r%C3%A9elles-success)

> Contexte : démonstration réalisée pour candidater au poste de data analyst de
> l'UGA. L'outil cible de l'établissement est **DigDash** (propriétaire). La
> démarche complète (connecteurs API, fiabilisation, modélisation, indicateurs,
> restitution dynamique, gestion des filtres) est ici reproduite sur une stack
> ouverte et équivalente. La logique métier est identique ; l'outil s'apprend.

---

## Sommaire

- [Aperçu](#aperçu)
- [Fonctionnalités clés](#fonctionnalités-clés)
- [Des données 100 % réelles](#des-données-100--réelles)
- [Architecture](#architecture)
- [Démarrage rapide](#démarrage-rapide)
- [Le pipeline d'ingestion](#le-pipeline-dingestion)
- [Analyses & justification scientifique](#analyses--justification-scientifique)
- [Extensibilité](#extensibilité)
- [Déploiement](#déploiement)
- [Tests & qualité](#tests--qualité)
- [Limites & honnêteté scientifique](#limites--honnêteté-scientifique)
- [Licence](#licence)

---

## Aperçu

Le tableau de bord couvre, sur le périmètre « production scientifique » de
l'offre, sept volets :

1. **Vue d'ensemble** : volume de publications, accès ouvert, h-index, et
   évolutions annuelles (corpus complet : ~144 000 publications OpenAlex,
   rafraîchi automatiquement).
2. **Composition de la production** : types de documents harmonisés, voies de
   l'accès ouvert, supports et auteurs les plus actifs.
3. **Impact** : indices bibliométriques (h, g, i10), distribution des citations,
   loi de Lotka.
4. **Signaux émergents** : détection de rafales sur les dynamiques thématiques.
5. **Réseau de collaboration** : communautés d'institutions partenaires.
6. **Qualité des données** : réconciliation HAL × OpenAlex.
7. **Explorateur d'articles** : navigation interactive en direct, fiche détaillée
   en pop-up.

## Fonctionnalités clés

- **Réconciliation HAL × OpenAlex** : appariement déterministe (DOI) puis
  probabiliste (blocking + similarité de Jaccard), avec rapport de recouvrement
  et écart de taxonomie. C'est le cœur « qualifier, fiabiliser, réconcilier »
  de la fiche de poste, rendu visible.
- **Détection de fronts émergents** par l'algorithme de rafales de Kleinberg,
  superposée à une heatmap topic × année. Rarement vu dans un outil opérationnel.
- **Réseau de collaboration** avec détection de communautés (Louvain) et
  disposition ForceAtlas2, le tout précalculé hors-ligne pour un rendu léger.
- **Explorateur d'articles en direct** : chaque filtre interroge l'API OpenAlex,
  chaque publication ouvre une pop-up avec résumé reconstruit, métadonnées et
  liens DOI / OpenAlex.
- **Indices bibliométriques reconnus** : h-index (Hirsch), g-index (Egghe),
  i10, loi de Lotka.
- **Connecteur de fichiers internes** (CSV) : ingestion d'un export de gestion
  comme 3ᵉ source, avec contrôle de cohérence (couverture DOI vs OpenAlex) et une
  section **Contrats de recherche financés** (financements compétitifs nationaux
  et européens) couvrant le périmètre valorisation.
- **Rafraîchissement automatique (ETL planifié)** : un job nocturne régénère
  l'entrepôt et redéploie ; les totaux du bandeau sont vérifiés en direct. Les
  données restent à jour sans intervention (voir
  [Fraîcheur des données](#fraîcheur-des-données-etl-planifié--totaux-en-direct)).

## Des données 100 % réelles

Aucune donnée fictive. Tout chiffre affiché provient de :

| Source | Rôle | Licence |
|---|---|---|
| [OpenAlex](https://openalex.org) | Volumétrie, citations, topics, collaborations, accès ouvert | CC0 1.0 |
| [HAL](https://hal.science) (CCSD) | Dépôts, types francophones (thèses, HDR, communications), DOI pour la réconciliation | — |
| Fichiers internes (CSV) | Export HAL (publications) + [scanR — financements de la recherche](https://data.gouv.fr) (contrats, MESR) ingérés via le `FileConnector` | CC-BY / Licence Ouverte |

Les « fichiers internes » de l'offre (exports de gestion confidentiels) sont
matérialisés par des fichiers réels publics équivalents : un export de
publications (HAL) et les contrats de recherche de l'UGA issus de l'export scanR
des financements (MESR, data.gouv.fr — ANR, PIA, H2020, Horizon Europe, FP7…,
2005-2025). Régénération : `npm run internal`.

Les indicateurs de tête sont calculés sur le **corpus complet** via les
agrégations `group_by` d'OpenAlex. Les analyses nécessitant les notices
individuelles (réseau, loi de Lotka, résumés) reposent sur un **échantillon
documenté** (voir [POC.md](./POC.md)).

## Architecture

Séparation stricte **ETL → data marts → restitution**, qui préfigure le modèle
d'un entrepôt décisionnel (le futur SID de l'établissement).

```
Connecteurs API  →  Fiabilisation        →  Modèle (data marts)  →  Restitution
(HAL + OpenAlex)     (dédup, taxonomie,       JSON versionnés        (dashboard
                      réconciliation)                                 Next.js)
```

```
pipeline/                 # ETL — exécuté par `npm run pipeline`
├── connectors/           # interface Connector + OpenAlex + HAL + client HTTP
├── transform/            # taxonomie, normalisation, réconciliation
├── analytics/            # bibliométrie, Lotka, Kleinberg, tendances, réseau
├── marts/                # schémas + builders purs + orchestrateur
data/marts/               # data marts JSON générés (données réelles)
src/
├── app/                  # page + routes API (drill-down live, santé)
├── components/           # KPI, charts, topics, network, quality, papers
└── lib/                  # types, formatage, couleurs, accès marts
```

**Principe de maintenabilité** : aucun fichier monolithique (tous < ~200 lignes),
une responsabilité par module, et deux points d'extension déclaratifs (registre
de KPI et interface `Connector`). Voir [docs/architecture.md](./docs/architecture.md).

### Fraîcheur des données (ETL planifié + totaux en direct)

Le dashboard n'est **pas un instantané figé du passé**. La fraîcheur repose sur
deux mécanismes complémentaires, calqués sur le fonctionnement réel d'un système
décisionnel :

- **ETL planifié (le cœur)** : un workflow GitHub Actions
  ([`.github/workflows/refresh-data.yml`](./.github/workflows/refresh-data.yml))
  **régénère tout l'entrepôt chaque nuit** (`npm run internal` puis
  `npm run pipeline`) et commite les marts rafraîchis ; Vercel redéploie
  automatiquement. La restitution reste **rapide** (lecture de marts versionnés,
  sans base de données) et **jamais vieille de plus de ~24 h**. C'est
  précisément la logique d'un SID : l'ETL rafraîchit l'entrepôt sur une
  planification, la couche de restitution lit l'entrepôt — et non l'inverse.
- **Totaux en direct** : les deux compteurs OpenAlex et HAL du bandeau sont en
  plus **revérifiés en temps réel à chaque consultation** (`src/lib/live-totals.ts`),
  avec repli sur la dernière valeur de l'entrepôt si une API est momentanément
  injoignable.

**Pourquoi pas un recalcul complet à chaque visite ?** Les analyses qui exigent
les notices individuelles — graphe de collaboration (Louvain + ForceAtlas2),
réconciliation par record linkage, loi de Lotka — nécessitent d'échantillonner
des milliers de notices puis plusieurs minutes de calcul. Les recalculer à
chaque affichage rendrait la page inutilisable (et dépasserait les limites d'une
fonction serverless). Le rafraîchissement planifié est la réponse d'ingénierie
correcte, et celle qu'emploient les vrais entrepôts décisionnels.

## Démarrage rapide

Prérequis : Node.js >= 20.

```bash
# 1. Dépendances
npm install

# 2. Configuration (optionnelle — tout fonctionne sans)
cp env.example .env.local

# 3. Générer les data marts à partir des API réelles (HAL + OpenAlex)
npm run pipeline           # ~2-3 min ; écrit data/marts/*.json
# npm run pipeline:dry     # vérifie seulement la connectivité des API

# 4. Lancer le tableau de bord
npm run dev                # http://localhost:3000
```

Autres commandes :

```bash
npm run build       # build de production
npm run typecheck   # vérification TypeScript stricte
npm run test        # tests unitaires (Vitest)
npm run lint        # lint Next.js / ESLint
```

> Note WSL2 / `/mnt/c` : sur un dossier monté Windows, npm ne crée pas toujours
> les liens dans `node_modules/.bin`. Lancer alors les binaires directement,
> ex. `node node_modules/next/dist/bin/next dev`, ou installer le projet sur le
> système de fichiers Linux. Sur Vercel, GCP, AWS, Azure ou macOS, `npm run …`
> fonctionne normalement.

## Le pipeline d'ingestion

Le pipeline est piloté par un unique fichier de configuration,
[`pipeline/config.ts`](./pipeline/config.ts). **Pour cibler un autre
établissement**, il suffit d'y changer l'identifiant OpenAlex et l'acronyme HAL
(ou de définir les variables d'environnement correspondantes), puis de relancer
`npm run pipeline`. Tout le tableau de bord se met à jour.

Stratégie d'appels :

- **Agrégats corpus complet** : `group_by` (volumétrie, types, accès ouvert,
  topics, journaux, auteurs).
- **Séries temporelles** : `group_by` répété par année (matrice topic × année).
- **Notices individuelles** : pagination par curseur (échantillon, top-cités,
  notices HAL avec DOI).

## Analyses & justification scientifique

| Analyse | Méthode | Référence |
|---|---|---|
| h-index | h tel que h publications ont >= h citations | Hirsch, *PNAS*, 2005 |
| g-index | g tel que le top g cumule >= g² citations | Egghe, *Scientometrics*, 2006 |
| Productivité des auteurs | Loi de Lotka, ajustement log-log | Lotka, *J. Wash. Acad. Sci.*, 1926 |
| Fronts émergents | Détection de rafales (automate 2 états, Viterbi) | Kleinberg, *KDD*, 2002 |
| Communautés de collaboration | Optimisation de modularité (Louvain) | Blondel et al., *J. Stat. Mech.*, 2008 |
| Disposition du réseau | ForceAtlas2 | Jacomy et al., *PLoS ONE*, 2014 |
| Réconciliation HAL/OpenAlex | Record linkage (blocking + similarité) | Fellegi & Sunter, 1969 ; Christen, 2012 |
| Tendances | CAGR, régression linéaire (MCO) | — |

Justification détaillée, hypothèses et limites : [POC.md](./POC.md) et
[docs/methodology.md](./docs/methodology.md).

## Extensibilité

Le projet est conçu pour évoluer sans réécriture :

- **Ajouter un indicateur de tête** : une entrée dans
  [`src/components/kpi/registry.ts`](./src/components/kpi/registry.ts).
- **Ajouter une source de données** (Crossref, ScanR, Scopus, fichiers internes
  du SID) : implémenter l'interface `Connector`
  ([`pipeline/connectors/types.ts`](./pipeline/connectors/types.ts)).
- **Harmoniser un nouveau type de document** : une ligne dans
  [`pipeline/transform/taxonomy.ts`](./pipeline/transform/taxonomy.ts).
- **Ajouter un mart / une analyse** : un builder pur dans `pipeline/marts/`.

## Déploiement

La cible recommandée est **Vercel** (éditeur de Next.js, déploiement en un clic).
Le projet reste un Next.js standard, déployable partout. Détails et commandes
pas-à-pas : [docs/deployment.md](./docs/deployment.md).

### Vercel (recommandé)

```bash
npm i -g vercel
vercel            # préversion
vercel --prod     # production
```

Définir si besoin les variables `OPENALEX_MAILTO`,
`NEXT_PUBLIC_INSTITUTION_OPENALEX_ID`, `HAL_STRUCT_ACRONYM`,
`NEXT_PUBLIC_INSTITUTION_NAME`. Les data marts étant versionnés, aucun service
externe n'est requis au runtime (hors explorateur live).

### Rafraîchissement automatique des données (GitHub Actions)

Le workflow [`.github/workflows/refresh-data.yml`](./.github/workflows/refresh-data.yml)
régénère l'entrepôt chaque nuit (cron) et à la demande (*Run workflow*), puis
commite les marts modifiés — ce qui déclenche un redéploiement Vercel. Prérequis :
activer GitHub Actions sur le dépôt (permission `contents: write` déjà déclarée
dans le workflow) ; les variables d'institution/mailto sont optionnelles
(défauts = UGA) et se règlent dans *Settings → Secrets and variables → Actions*.

### Google Cloud Platform (Cloud Run)

Conteneur autoscalé, idéal pour rester dans l'écosystème GCP.

```bash
gcloud artifacts repositories create uga --repository-format=docker --location=europe-west1
gcloud builds submit --tag europe-west1-docker.pkg.dev/PROJECT/uga/dashboard
gcloud run deploy uga-dashboard \
  --image europe-west1-docker.pkg.dev/PROJECT/uga/dashboard \
  --region europe-west1 --allow-unauthenticated
```

### Amazon Web Services

- **Le plus simple** : AWS Amplify Hosting (connecter le dépôt Git, build
  `npm run build`).
- **Conteneur** : pousser l'image sur ECR puis déployer sur ECS Fargate ou
  App Runner.
- **Statique + SSR** : adaptateur [OpenNext](https://open-next.js.org) vers
  Lambda + CloudFront + S3.

### Microsoft Azure

- **Azure Static Web Apps** (preset Next.js) pour un déploiement Git natif.
- **Azure Container Apps** : pousser l'image sur Azure Container Registry puis
  `az containerapp up`.

Toutes ces cibles consomment le `Dockerfile` standard d'une application Next.js
(voir [docs/deployment.md](./docs/deployment.md)).

## Tests & qualité

- **Tests unitaires** des algorithmes (Vitest) : h/g/i10, Lotka, Kleinberg,
  réconciliation, normalisation, taxonomie.
- **TypeScript strict** (`noUncheckedIndexedAccess`, pas de `any`).
- Build de production et `typecheck` propres.

```bash
npm run test && npm run typecheck && npm run build
```

## Limites & honnêteté scientifique

- Les indices h/g/i10 sont estimés sur les publications les plus citées de
  l'établissement ; la base est explicitement indiquée dans l'interface.
- Les analyses « notices » (réseau, Lotka, résumés) reposent sur un échantillon
  temporel borné et documenté, pas sur le corpus intégral.
- OpenAlex et HAL ont des périmètres et des taxonomies différents : c'est
  précisément ce que le volet réconciliation mesure et explicite.
- Aucune donnée n'est inventée ; en l'absence d'une information (par ex. résumé),
  l'interface l'indique.

## Licence

Code sous licence **MIT** (voir [LICENSE](./LICENSE)). Données : OpenAlex (CC0),
HAL (CCSD). Ce logiciel ne redistribue aucun texte intégral.

Auteur : **Thomas Berchet** — démonstration pour l'Université Grenoble Alpes.
