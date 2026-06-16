# Réconciliation HAL × OpenAlex

La réconciliation est le cœur « analyser, qualifier et fiabiliser les données »
de la fiche de poste. Elle répond à une question concrète : les deux sources
ouvertes décrivent-elles la même production, et comment les consolider ?

## Problème

HAL et OpenAlex donnent des comptes et des taxonomies différents. Choisir une
seule source perd de l'information ; les empiler naïvement crée des doublons. Il
faut donc **apparier** les notices et **harmoniser** les types.

## Algorithme (`pipeline/transform/reconcile.ts`)

Cadre classique du record linkage (Fellegi & Sunter, 1969 ; Christen, 2012),
en deux étapes :

1. **Appariement déterministe** sur DOI normalisé (minuscule, sans préfixe
   `https://doi.org/`). Fiable et sans ambiguïté.
2. **Appariement probabiliste** pour les notices sans DOI commun :
   - **Blocking** sur la clé (année, 4 premiers caractères du titre normalisé)
     pour réduire le nombre de comparaisons ;
   - **Similarité de Jaccard** sur les ensembles de jetons des titres ;
   - acceptation au-delà d'un seuil (0,6).

Sortie : un rapport quantifiant le recouvrement, la méthode d'appariement, les
notices propres à chaque source, et la comparaison des types harmonisés.

## Harmonisation des types

`pipeline/transform/taxonomy.ts` projette les deux taxonomies sur une taxonomie
canonique unique :

| Canonique | HAL | OpenAlex |
|---|---|---|
| Article | ART | article, review, letter |
| Communication | COMM, POSTER | (peu couvert) |
| Chapitre d'ouvrage | COUV | book-chapter |
| Ouvrage | OUV, DOUV | book, monograph |
| Thèse / HDR | THESE, HDR | dissertation |
| Rapport / Mémoire | MEM, REPORT | report |
| Preprint | PREPRINT | preprint |
| Jeu de données | — | dataset |
| Autre | UNDEFINED, … | other, paratext, … |

## Lecture des résultats

Sur la fenêtre 2022–2024 (échantillons de 6 000 notices par source) :

- une part des notices s'apparie (très majoritairement par DOI), confirmant un
  socle commun fiable ;
- chaque source conserve des notices propres : HAL pour les types francophones
  et la littérature grise, OpenAlex pour la couverture internationale ;
- l'écart de taxonomie est rendu visible par un histogramme comparatif.

Conclusion opérationnelle : les deux sources sont **complémentaires** et doivent
être **consolidées** dans l'entrepôt décisionnel, avec le DOI comme clé pivot et
un appariement de repli sur titre.
