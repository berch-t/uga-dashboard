# ---
# jupyter:
#   jupytext:
#     text_representation:
#       extension: .py
#       format_name: percent
#   kernelspec:
#     display_name: Python 3
#     language: python
#     name: python3
# ---

# %% [markdown]
# # 09 — Pipeline reproductible & data contracts
#
# **Objectif (data engineering).** Formaliser un **contrat de données** (schéma,
# types, bornes, valeurs autorisées) validé automatiquement avec **pandera**, et
# montrer l'intérêt d'un pipeline reproductible avec **exports** standardisés
# (CSV / PDF / IPYNB). C'est la garantie qualité d'un entrepôt décisionnel : toute
# donnée non conforme est rejetée avant d'alimenter les indicateurs.
#
# On opère sur le jeu réel constitué au notebook 01.

# %%
from pathlib import Path

import pandera.pandas as pa

from lib import load_works, set_seeds

set_seeds()
df = load_works()
print(f"Jeu à valider : {len(df):,} lignes, {df.shape[1]} colonnes")

# %% [markdown]
# ## 1. Définition du contrat de données
#
# Le schéma décrit les attentes : types, nullabilité, bornes et domaines de
# valeurs. C'est la spécification exécutable de ce qu'est une donnée « valide ».

# %%
schema = pa.DataFrameSchema(
    {
        "id": pa.Column(str, nullable=False, unique=True),
        "year": pa.Column(int, pa.Check.in_range(2010, 2026)),
        "cited_by_count": pa.Column(int, pa.Check.ge(0)),
        "is_oa": pa.Column(bool),
        "oa_status": pa.Column(
            str, pa.Check.isin(["gold", "green", "hybrid", "bronze", "closed", "diamond"]), nullable=True
        ),
        "type": pa.Column(str, nullable=True),
        "n_authors": pa.Column(int, pa.Check.ge(0)),
        "abstract_len": pa.Column(int, pa.Check.ge(0)),
    },
    strict=False,
    coerce=True,
)
print("Contrat défini :", list(schema.columns))

# %% [markdown]
# ## 2. Validation du jeu réel
#
# La validation *lazy* collecte toutes les violations en une passe plutôt que de
# s'arrêter à la première.

# %%
try:
    validated = schema.validate(df, lazy=True)
    print(f"✔ Validation réussie : {len(validated):,} lignes conformes au contrat.")
except pa.errors.SchemaErrors as exc:
    print("Violations détectées :")
    print(exc.failure_cases[["column", "check", "failure_case"]].head())

# %% [markdown]
# ## 3. Détection d'une donnée non conforme
#
# On injecte volontairement une anomalie (année impossible) pour montrer que le
# contrat la **rejette** — exactement ce qui protège l'entrepôt en production.

# %%
corrupt = df.copy()
corrupt.loc[corrupt.index[0], "year"] = 1850
try:
    schema.validate(corrupt, lazy=True)
    print("Aucune anomalie détectée (inattendu).")
except pa.errors.SchemaErrors as exc:
    cases = exc.failure_cases[["column", "check", "failure_case"]]
    print(f"Anomalie correctement rejetée : {len(cases)} cas")
    print(cases.head())

# %% [markdown]
# ## 4. Exports standardisés (CSV / PDF / IPYNB)
#
# Un livrable d'analyse doit être exportable. On produit un agrégat propre en CSV
# (réutilisable dans un tableur ou un autre outil). Le notebook lui-même est
# exportable en **IPYNB** (téléchargement direct) et en **PDF** (impression) depuis
# l'interface du dashboard.

# %%
export_dir = Path("data/exports")
export_dir.mkdir(parents=True, exist_ok=True)

by_domain = (
    df.dropna(subset=["domain"])
    .groupby("domain")
    .agg(publications=("id", "size"), citations_moy=("cited_by_count", "mean"), taux_oa=("is_oa", "mean"))
    .round({"citations_moy": 1, "taux_oa": 3})
    .sort_values("publications", ascending=False)
)
csv_path = export_dir / "production_par_domaine.csv"
by_domain.to_csv(csv_path, encoding="utf-8")
print(f"Export CSV écrit : {csv_path} ({csv_path.stat().st_size} octets)")
by_domain

# %% [markdown]
# **Lecture.** Le contrat de données rend la qualité **exécutable et
# reproductible** : à chaque rafraîchissement, toute notice non conforme est
# détectée avant d'atteindre les indicateurs. Couplé aux exports standardisés
# (CSV / PDF / IPYNB), cela constitue la base d'un pipeline industrialisable,
# auditable et prêt à alimenter un SID.
