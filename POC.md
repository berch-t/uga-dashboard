# Preuve de concept (POC) — Tableau de bord scientométrique UGA

Ce document justifie, de façon scientifique et reproductible, **ce qui a été
réalisé et comment**. Il accompagne le code et le tableau de bord, et s'adresse
à un lecteur technique de l'établissement.

## 1. Objet

Démontrer la faisabilité d'un pilotage de la production scientifique du site
Grenoble Alpes à partir des deux API ouvertes de l'offre (HAL et OpenAlex), en
couvrant l'intégralité de la chaîne : recueil, fiabilisation, modélisation,
analyse et restitution. La contrainte forte est l'usage **exclusif de données
réelles**.

## 2. Données et périmètre

### 2.1 Sources

- **OpenAlex** (`https://api.openalex.org`), institution
  `I899635006` (Université Grenoble Alpes), licence CC0. Pool « poli » activé
  via un courriel de contact.
- **HAL** (`https://api.archives-ouvertes.fr/search`), portée
  `structAcronym_s:UGA`.

### 2.2 Corpus définis (reproductibilité)

Trois périmètres distincts, tous paramétrés dans `pipeline/config.ts` :

| Corpus | Définition | Usage |
|---|---|---|
| Complet | Toutes les publications OpenAlex de l'établissement (140 638) | Indicateurs de tête, agrégats, séries |
| Top-cités | 1 000 publications les plus citées | Indices h / g / i10 |
| Échantillon | Publications 2022–2024 (jusqu'à 6 000) | Réseau, loi de Lotka, distribution |

La réconciliation compare un échantillon OpenAlex et un échantillon HAL sur la
même fenêtre (2022–2024). L'instantané est daté dans
`data/marts/manifest.json` ; relancer `npm run pipeline` régénère l'ensemble de
façon déterministe (hors évolution naturelle des bases en amont).

### 2.3 Stratégie d'appels

Les agrégats utilisent `group_by` (exhaustif sur le corpus complet, sans
téléchargement des notices). Les séries temporelles sont obtenues par
`group_by` répété par année. Les notices individuelles sont paginées par
curseur. Un détail important a été identifié et traité : OpenAlex plafonne la
taille du tableau `group_by` à la valeur de `per-page` (corrigé à 200).

## 3. Chaîne de fiabilisation

1. **Normalisation** : DOI mis en forme canonique (minuscule, sans préfixe),
   titres nettoyés (HTML, diacritiques, ponctuation), reconstruction des résumés
   à partir de l'index inversé d'OpenAlex.
2. **Harmonisation des types** : projection des taxonomies HAL (`docType_s`) et
   OpenAlex (`type`) sur une taxonomie canonique unique (table de correspondance
   unique dans `taxonomy.ts`).
3. **Réconciliation** : appariement des deux sources (section 4.6).

## 4. Méthodes

### 4.1 h-index (Hirsch, 2005)

Plus grand entier h tel que h publications possèdent chacune au moins h
citations. Calculé sur le corpus top-cités. **Résultat : h = 495.**

### 4.2 g-index (Egghe, 2006)

Plus grand g tel que les g publications les plus citées cumulent au moins g²
citations ; plus sensible aux travaux très cités. **Résultat : g = 858.**

### 4.3 i10-index

Nombre de publications avec au moins 10 citations. **Résultat : i10 = 1 000**
(plancher de l'échantillon top-cités, donc minorant).

### 4.4 Loi de Lotka (1926)

Le nombre d'auteurs publiant n articles décroît en 1/nᵃ. On estime l'exposant a
par régression linéaire (moindres carrés) sur le spectre log-log de
productivité. **Résultat : a = 2,73 ; R² = 0,95** sur 31 664 auteurs distincts.
Une valeur proche de 2 et un R² élevé confirment l'adéquation du corpus à la loi
classique, ce qui valide à la fois la donnée et l'implémentation.

### 4.5 Détection de rafales (Kleinberg, 2002)

Pour chaque thématique, on modélise le nombre de publications annuelles par un
automate à deux états (taux de base vs taux élevé), avec une émission binomiale
et un coût de transition `γ·ln(n)`. Le chemin optimal est trouvé par
programmation dynamique (Viterbi). Les périodes en état « élevé » sont les
rafales. Cela révèle **quand** un front de recherche accélère, signal bien plus
riche qu'un simple comptage. Exemple détecté : « Advancements in Battery
Materials » en rafale sur 2024–2025.

### 4.6 Réseau de collaboration : Louvain + ForceAtlas2

Le graphe relie les institutions co-publiant avec l'UGA (l'ego est exclu pour
faire émerger la structure entre partenaires) ; le poids des arêtes est la
co-occurrence sur une même publication. On applique l'optimisation de modularité
de **Louvain** (Blondel et al., 2008) pour détecter les communautés, puis
**ForceAtlas2** (Jacomy et al., 2014) pour la disposition, le tout précalculé
hors-ligne. **Résultat : 120 institutions, 2 600 arêtes, 4 communautés**
(modularité 0,18, cohérente avec un réseau dense fortement interconnecté).

### 4.7 Réconciliation HAL × OpenAlex (record linkage)

Deux étapes, dans le cadre classique du record linkage (Fellegi & Sunter, 1969 ;
Christen, 2012) :

1. **Déterministe** : appariement exact sur DOI normalisé.
2. **Probabiliste** : pour les notices sans DOI, *blocking* sur (année, préfixe
   de titre) afin de réduire l'espace de comparaison, puis similarité de Jaccard
   sur les ensembles de jetons du titre, au-delà d'un seuil (0,6).

**Résultats** (échantillons 2022–2024, 6 000 notices par source) :
- 2 092 appariements, dont **2 016 par DOI** et **76 par titre**.
- 3 908 notices propres à OpenAlex, 3 908 propres à HAL.
- Indice de recouvrement (Jaccard des ensembles) : ~0,21.

Lecture métier : les deux sources sont **complémentaires** (HAL est riche en
types francophones et littérature grise, OpenAlex en couverture internationale,
citations et accès ouvert). Cela justifie leur consolidation dans l'entrepôt
décisionnel plutôt que le choix d'une source unique.

## 5. Validation

- **Tests unitaires** (Vitest, 16 tests) : valeurs connues pour h/g/i10,
  récupération de l'exposant de Lotka sur données synthétiques 1/n² (a ∈ [1,6 ;
  2,4], R² > 0,9), détection de rafale sur série à pic, appariement DOI et flou.
- **Contrôles de cohérence** : l'exposant de Lotka réel (2,73) et l'ajustement
  (R² = 0,95) sont conformes à la littérature, ce qui constitue une validation
  croisée donnée × méthode.
- **TypeScript strict** de bout en bout, build de production vérifié.

## 6. Limites et travaux futurs

- Les indices bibliométriques dépendent du périmètre top-cités ; un calcul
  exhaustif nécessiterait l'ensemble des citations.
- Les analyses « notices » sont bornées à une fenêtre temporelle documentée.
- La normalisation FWCI complète exige un référentiel disciplinaire externe
  (hors périmètre du MVP).
- Extensions naturelles : brique valorisation / contrats (connecteur fichiers
  internes du SID), connecteurs Crossref / ScanR via l'interface `Connector`,
  indice de disruption CD (Funk & Owen-Smith, 2017) sur graphe de citations.

## 7. Phase 2 — Data science, navigation d'API et génération déterministe de livrables

### 7.1 Notebooks reproductibles (data science / data engineering)

Une suite de notebooks Python matérialise le **craft** d'analyste (au-delà du
résultat restitué par le dashboard) : EDA approfondie, ingestion d'API et ajout
d'une nouvelle source, recoupements, topic modeling, bibliométrie, réseau,
séries temporelles et montée à l'échelle. Choix de reproductibilité :

- **Source jupytext** au format *percent* (`.py`, cellules `# %% [markdown]`) :
  diff-able et versionnable, contrairement au JSON `.ipynb`.
- **Exécution déterministe** via **papermill** avec graines fixées
  (`numpy`, `random`, hash seeds) ; les `.ipynb` exécutés sont commités et servis
  statiquement, accompagnés d'un `manifest.json` de provenance.
- **Données réelles** uniquement (HAL / OpenAlex / scanR), cohérentes avec les
  marts du dashboard.
- Rendu in-app par un visualiseur React (look Google Colab) lisant le JSON
  `.ipynb` ; aucun kernel live, le déploiement reste statique.

### 7.2 Topic modeling (embeddings + clustering)

Les thématiques sont extraites des résumés par **embeddings de phrases**
(*sentence-transformers*) projetés puis regroupés (**UMAP** pour la réduction de
dimension, **HDBSCAN** pour le clustering basé densité, orchestrés par
**BERTopic**). Cette approche, état de l'art pour le *topic modeling* court et
multilingue, complète la taxonomie native d'OpenAlex par une structure
thématique émergente, non supervisée et dérivée du texte réel.

### 7.3 Génération déterministe de livrables (squelette + LLM narrateur contraint)

Exigence : *même entrée → même sortie*, **sans hallucination**. Un LLM seul ne
garantit ni l'un ni l'autre. Le design retenu sépare strictement les
responsabilités :

1. **Faits (déterministe, zéro LLM)** : un extracteur calcule `facts.json`
   (KPIs, variations, top-listes, spécifications de graphiques) depuis les marts.
2. **Graphiques (déterministe)** : images statiques rendues depuis les faits,
   style et graines fixés.
3. **Narration (LLM contraint)** : Ollama + dernier **Gemma** open (vérifié sur
   HuggingFace au moment de l'implémentation), **sortie structurée par JSON
   schema**, `temperature = 0` et graine fixe (décodage glouton). Le modèle ne
   *rédige* que la prose de liaison autour des faits ; il ne calcule rien.
4. **Garde-fou** : tout token numérique de la sortie doit appartenir à
   `facts.json` ; sinon la génération est rejetée. L'hallucination de chiffres
   est ainsi impossible *par construction*.
5. **Assemblage** : `python-pptx` (PPTX) et **weasyprint** (HTML → PDF),
   gabarits bilingues FR / EN.

**Limite assumée et documentée** : le déterminisme d'un LLM local
(llama.cpp / Ollama) n'est garanti qu'à *matériel, build et quantization
constants* ; la reproductibilité inter-machines n'est pas strictement garantie.
La partie chiffrée du livrable, elle, est **strictement déterministe** car
calculée hors LLM. La fonctionnalité est **locale** (Ollama n'est pas hébergeable
sur Vercel) ; des livrables exemples pré-générés sont commités pour que la démo
en ligne expose les sorties.

### 7.4 Navigation et requêtage d'API

Un constructeur de requêtes interactif s'appuie sur le registre `Connector`
(OpenAlex, HAL, scanR) pour cibler une source, composer des filtres et exécuter
la requête côté serveur (route handler, pool poli, pas de CORS). La réponse est
présentée sous forme tabulaire, de facettes et de JSON brut, exportable en CSV.
L'ajout d'une nouvelle API se fait en implémentant l'interface `Connector`.

## 8. Références

- J. E. Hirsch (2005). *An index to quantify an individual's scientific research
  output*. PNAS.
- L. Egghe (2006). *Theory and practise of the g-index*. Scientometrics.
- A. J. Lotka (1926). *The frequency distribution of scientific productivity*.
- J. Kleinberg (2002). *Bursty and hierarchical structure in streams*. KDD.
- V. Blondel et al. (2008). *Fast unfolding of communities in large networks*.
- M. Jacomy et al. (2014). *ForceAtlas2, a continuous graph layout algorithm*.
- I. Fellegi, A. Sunter (1969). *A theory for record linkage*. JASA.
- P. Christen (2012). *Data Matching*. Springer.
- N. Reimers, I. Gurevych (2019). *Sentence-BERT: Sentence Embeddings using
  Siamese BERT-Networks*. EMNLP.
- L. McInnes, J. Healy, J. Melville (2018). *UMAP: Uniform Manifold Approximation
  and Projection*. arXiv:1802.03426.
- R. Campello, D. Moulavi, J. Sander (2013). *Density-Based Clustering Based on
  Hierarchical Density Estimates* (HDBSCAN). PAKDD.
- M. Grootendorst (2022). *BERTopic: Neural topic modeling with a class-based
  TF-IDF procedure*. arXiv:2203.05794.
