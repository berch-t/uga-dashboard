"""Chargement des données réelles, avec cache local pour la reproductibilité.

`load_works` constitue (une fois) un échantillon record-level **aléatoire et
représentatif** depuis OpenAlex (échantillonnage natif `sample` + `seed`) et le
met en cache en Parquet ; tous les notebooks lisent ensuite ce même fichier, ce
qui garantit des sorties stables à la ré-exécution.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd

from .clients import OpenAlexClient
from .config import CONFIG

WORKS_SELECT = (
    "id,doi,title,publication_year,cited_by_count,type,open_access,"
    "authorships,primary_topic,primary_location,abstract_inverted_index"
)


def marts_dir() -> Path:
    return CONFIG.marts_dir


def load_mart(name: str) -> dict[str, Any]:
    """Lit un data mart JSON du dashboard (ex. `load_mart('overview')`)."""
    path = CONFIG.marts_dir / f"{name}.json"
    return json.loads(path.read_text(encoding="utf-8"))


def _flatten(work: dict[str, Any]) -> dict[str, Any]:
    oa = work.get("open_access") or {}
    topic = work.get("primary_topic") or {}
    loc = work.get("primary_location") or {}
    source = (loc or {}).get("source") or {}
    authorships = work.get("authorships") or []
    return {
        "id": work.get("id"),
        "doi": work.get("doi"),
        "title": work.get("title"),
        "year": work.get("publication_year"),
        "cited_by_count": work.get("cited_by_count", 0),
        "type": work.get("type"),
        "is_oa": bool(oa.get("is_oa")),
        "oa_status": oa.get("oa_status"),
        "topic": topic.get("display_name"),
        "field": ((topic.get("field") or {}).get("display_name")),
        "domain": ((topic.get("domain") or {}).get("display_name")),
        "venue": source.get("display_name"),
        "n_authors": len(authorships),
        "abstract_len": len(OpenAlexClient.reconstruct_abstract(work.get("abstract_inverted_index")).split()),
    }


def load_works(refresh: bool = False) -> pd.DataFrame:
    """Échantillon record-level OpenAlex de l'UGA, mis en cache en Parquet.

    Tirage **aléatoire représentatif** via l'échantillonnage natif d'OpenAlex
    (`sample` + `seed`), pour éviter tout biais (le tri par défaut privilégie les
    articles les plus cités).
    """
    cache = CONFIG.cache_dir / "works.parquet"
    if cache.exists() and not refresh:
        return pd.read_parquet(cache)

    client = OpenAlexClient()
    filter_ = client.institution_filter(
        **{"from_publication_date": f"{CONFIG.from_year}-01-01", "to_publication_date": f"{CONFIG.to_year}-12-31"}
    )
    rows = [_flatten(w) for w in client.sample_works(filter_, WORKS_SELECT, CONFIG.sample_size, seed=42)]
    df = pd.DataFrame(rows)

    cache.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(cache, index=False)
    return df
