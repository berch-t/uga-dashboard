# Sources de données

Deux API ouvertes, conformément à l'offre. Aucune clé n'est requise.

## OpenAlex

- Base : `https://api.openalex.org`
- Institution UGA : `I899635006` (ROR `02rx3b187`).
- Licence : CC0 1.0 (domaine public).
- Étiquette : un courriel de contact (`OPENALEX_MAILTO`) active le pool « poli »,
  plus rapide et plus fiable.

### Points d'accès utilisés

| Besoin | Requête |
|---|---|
| Volume total | `works?filter=institutions.id:I899635006&per-page=1` (`meta.count`) |
| Agrégats | `works?filter=…&group_by=<dimension>&per-page=200` |
| Séries annuelles | idem, avec `publication_year:<an>` dans le filtre |
| Notices | `works?filter=…&select=…&cursor=*&per-page=200` |
| Top-cités | idem, `sort=cited_by_count:desc` |

Dimensions d'agrégation exploitées : `publication_year`, `type`,
`open_access.oa_status`, `open_access.is_oa`, `primary_topic.id`,
`primary_location.source.id`, `authorships.author.id`,
`institutions.country_code`.

### Pièges traités

- **Plafond `group_by`** : la taille du tableau `group_by` est plafonnée à la
  valeur de `per-page`. On demande donc `per-page=200`.
- **Clé de type** : `group_by=type` renvoie des IRI
  (`https://openalex.org/types/article`) alors que `select=type` renvoie le
  *slug* (`article`). La fonction `openAlexTypeToCanonical` accepte les deux.
- **Résumés** : fournis sous forme d'index inversé (`abstract_inverted_index`),
  reconstruits en texte par `reconstructAbstract`.

## HAL (CCSD)

- Base : `https://api.archives-ouvertes.fr/search`
- Portée UGA : `fq=structAcronym_s:UGA`.
- API de type Solr : `numFound`, facettes, `cursorMark` pour la pagination
  profonde.

### Points d'accès utilisés

| Besoin | Requête |
|---|---|
| Volume total | `?q=*:*&fq=structAcronym_s:UGA&rows=0` |
| Facettes | `…&facet=true&facet.field=docType_s` (ou `publicationDateY_i`, `domain_s`) |
| Notices avec DOI | `…&fq=doiId_s:*&fq=publicationDateY_i:[2022 TO 2024]&cursorMark=*&sort=docid asc` |

Champs récupérés : `halId_s`, `doiId_s`, `title_s`, `docType_s`,
`publicationDateY_i`, `authFullName_s`, `journalTitle_s`.

## Fichiers internes (3ᵉ source)

L'offre mentionne aussi des « fichiers internes » (exports d'outils de gestion).
Ces exports réels de l'UGA étant confidentiels, on matérialise des **fichiers
réels et publics équivalents**, ingérés par le `FileConnector` (CSV générique) :

| Fichier | Source réelle | Rôle |
|---|---|---|
| `data/internal/publications.csv` | Export HAL (liste de publications) | Contrôle de cohérence vs OpenAlex (couverture par DOI) |
| `data/internal/contracts.csv` | scanR — financements de la recherche (MESR, data.gouv.fr) | Contrats de recherche / valorisation (financeurs, montants, années) |

Régénération : `npm run internal`. La couverture du fichier de publications est
mesurée en interrogeant OpenAlex par lots de DOIs (`doi:a|b|…`), soit ~98 % des
notices retrouvées.

Les contrats proviennent de l'**export scanR des financements de la recherche**
(jeu `export-des-financements-exposes-dans-scanr`, MESR), filtré sur les projets
ayant un participant « Grenoble Alpes » (`search(participants, "Grenoble Alpes")`).
Ce jeu couvre les financements compétitifs **nationaux et européens** (ANR, PIA
ANR, H2020, Horizon Europe, FP7, INCa…) et reste à jour (jusqu'à l'année
courante), contrairement à l'ancien fichier ANR seul qui s'arrêtait en 2016.
Les champs `participants`, `acronym`, `label` sont des objets JSON encodés en
chaîne ; la part de financement attribuée à l'UGA est extraite du participant
correspondant lorsqu'elle est renseignée.

## Complémentarité

OpenAlex apporte la couverture internationale, les citations, l'accès ouvert et
les thématiques ; HAL apporte les types francophones (thèses, HDR,
communications, littérature grise) et l'ancrage national. Le volet
réconciliation mesure et exploite cette complémentarité (voir
`docs/reconciliation.md`).
