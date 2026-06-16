"""Clients API légers (OpenAlex, HAL, scanR), miroirs Python des connecteurs TS.

Volontairement minimalistes et lisibles : ils montrent le savoir-faire
d'ingestion (pagination par curseur, échantillonnage aléatoire reproductible,
pool poli, reconstruction d'abstract) et illustrent l'ajout simple d'une
nouvelle source (il suffit d'écrire une classe analogue).
"""

from __future__ import annotations

import time
from typing import Any, Iterator

import httpx

from .config import CONFIG


class OpenAlexClient:
    """Accès à l'API OpenAlex (works d'une institution)."""

    BASE = "https://api.openalex.org"

    def __init__(self, mailto: str = CONFIG.mailto, delay: float = 0.12) -> None:
        self._client = httpx.Client(timeout=30.0, headers={"User-Agent": f"uga-notebooks ({mailto})"})
        self._mailto = mailto
        self._delay = delay

    def _params(self, **extra: Any) -> dict[str, Any]:
        return {"mailto": self._mailto, **extra}

    def institution_filter(self, **extra: str) -> str:
        parts = [f"institutions.id:{CONFIG.openalex_id}", *(f"{k}:{v}" for k, v in extra.items())]
        return ",".join(parts)

    def count(self, filter_: str | None = None) -> int:
        """Nombre total de works correspondant au filtre (lecture de `meta.count`)."""
        params = self._params(filter=filter_ or self.institution_filter())
        params["per-page"] = 1
        res = self._client.get(f"{self.BASE}/works", params=params)
        res.raise_for_status()
        return res.json().get("meta", {}).get("count", 0)

    def group_by(self, dimension: str, filter_: str | None = None) -> list[dict[str, Any]]:
        """Agrégat exhaustif (`group_by` plafonné à `per-page`, demandé à 200)."""
        params = self._params(filter=filter_ or self.institution_filter(), group_by=dimension)
        params["per-page"] = 200
        res = self._client.get(f"{self.BASE}/works", params=params)
        res.raise_for_status()
        return res.json().get("group_by", [])

    def iter_works(
        self, filter_: str, select: str, max_works: int, sort: str = "publication_date:desc"
    ) -> Iterator[dict[str, Any]]:
        """Pagination par curseur, bornée à `max_works`.

        Le tri est explicite : sans `sort`, OpenAlex trie par citations
        décroissantes, ce qui biaiserait tout échantillon « premières pages ».
        """
        cursor = "*"
        fetched = 0
        while cursor and fetched < max_works:
            params = self._params(filter=filter_, select=select, cursor=cursor, sort=sort)
            params["per-page"] = min(200, max_works - fetched)
            res = self._client.get(f"{self.BASE}/works", params=params)
            res.raise_for_status()
            payload = res.json()
            for work in payload.get("results", []):
                yield work
                fetched += 1
            cursor = payload.get("meta", {}).get("next_cursor")
            time.sleep(self._delay)

    def sample_works(self, filter_: str, select: str, n: int, seed: int = 42) -> Iterator[dict[str, Any]]:
        """Échantillon aléatoire **représentatif et reproductible**.

        Utilise l'échantillonnage natif d'OpenAlex (`sample` + `seed`), seule
        façon correcte d'obtenir un tirage non biaisé. La pagination se fait par
        `page` (le curseur n'est pas compatible avec `sample`), dans la limite
        des 10 000 résultats autorisés.
        """
        per_page = 200
        fetched = 0
        page = 1
        while fetched < n:
            params = self._params(filter=filter_, select=select, sample=n, seed=seed, page=page)
            params["per-page"] = min(per_page, n - fetched)
            res = self._client.get(f"{self.BASE}/works", params=params)
            res.raise_for_status()
            results = res.json().get("results", [])
            if not results:
                break
            for work in results:
                yield work
                fetched += 1
            page += 1
            time.sleep(self._delay)

    def find_existing_dois(self, dois: list[str]) -> set[str]:
        """Sous-ensemble des `dois` présents dans OpenAlex (filtre OR par lots)."""
        found: set[str] = set()
        for i in range(0, len(dois), 50):
            batch = [d for d in dois[i : i + 50] if d]
            if not batch:
                continue
            params = self._params(filter=f"doi:{'|'.join(batch)}", select="doi")
            params["per-page"] = 200
            try:
                res = self._client.get(f"{self.BASE}/works", params=params)
                res.raise_for_status()
                for w in res.json().get("results", []):
                    doi = (w.get("doi") or "").replace("https://doi.org/", "").lower()
                    if doi:
                        found.add(doi)
            except httpx.HTTPError:
                continue
            time.sleep(self._delay)
        return found

    @staticmethod
    def reconstruct_abstract(inverted_index: dict[str, list[int]] | None) -> str:
        """Reconstruit le résumé à partir de l'index inversé d'OpenAlex."""
        if not inverted_index:
            return ""
        positions: list[tuple[int, str]] = []
        for word, idxs in inverted_index.items():
            positions.extend((i, word) for i in idxs)
        positions.sort()
        return " ".join(word for _, word in positions)


class HalClient:
    """Accès à l'API HAL (CCSD), de style Solr."""

    BASE = "https://api.archives-ouvertes.fr/search"

    def __init__(self, delay: float = 0.12) -> None:
        self._client = httpx.Client(timeout=30.0)
        self._delay = delay

    def facet(self, field: str, fq: str = f"structAcronym_s:{CONFIG.hal_struct_acronym}") -> dict[str, int]:
        params = {"q": "*:*", "fq": fq, "rows": 0, "facet": "true", "facet.field": field, "facet.limit": 200, "wt": "json"}
        res = self._client.get(self.BASE, params=params)
        res.raise_for_status()
        raw = res.json()["facet_counts"]["facet_fields"][field]
        return {raw[i]: raw[i + 1] for i in range(0, len(raw), 2)}

    def iter_works(
        self, from_year: int, to_year: int, max_works: int, require_doi: bool = True
    ) -> Iterator[dict[str, Any]]:
        """Notices HAL paginées en profondeur (cursorMark), filtrées UGA + DOI."""
        fq = [f"structAcronym_s:{CONFIG.hal_struct_acronym}", f"publicationDateY_i:[{from_year} TO {to_year}]"]
        if require_doi:
            fq.append("doiId_s:*")
        fields = "halId_s,doiId_s,title_s,docType_s,publicationDateY_i,journalTitle_s"
        cursor = "*"
        fetched = 0
        while fetched < max_works:
            params = [
                ("q", "*:*"),
                ("rows", min(200, max_works - fetched)),
                ("fl", fields),
                ("sort", "docid asc"),
                ("cursorMark", cursor),
                ("wt", "json"),
                *[("fq", f) for f in fq],
            ]
            res = self._client.get(self.BASE, params=params)
            res.raise_for_status()
            payload = res.json()
            docs = payload["response"]["docs"]
            for doc in docs:
                yield doc
                fetched += 1
            next_cursor = payload.get("nextCursorMark")
            if not docs or next_cursor == cursor:
                break
            cursor = next_cursor
            time.sleep(self._delay)

    def find_existing_dois(self, dois: list[str]) -> set[str]:
        """Sous-ensemble des `dois` présents dans HAL (requête OR par lots)."""
        found: set[str] = set()
        for i in range(0, len(dois), 40):
            batch = [d for d in dois[i : i + 40] if d]
            if not batch:
                continue
            clause = " OR ".join(f'"{d}"' for d in batch)
            params = {"q": "*:*", "fq": f"doiId_s:({clause})", "rows": 200, "fl": "doiId_s", "wt": "json"}
            try:
                res = self._client.get(self.BASE, params=params)
                res.raise_for_status()
                for doc in res.json()["response"]["docs"]:
                    doi = (doc.get("doiId_s") or "").lower()
                    if doi:
                        found.add(doi)
            except (httpx.HTTPError, KeyError):
                continue
            time.sleep(self._delay)
        return found


class ScanrClient:
    """Accès à l'export scanR des financements de la recherche (MESR)."""

    BASE = (
        "https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/"
        "datasets/export-des-financements-exposes-dans-scanr/records"
    )

    def __init__(self, delay: float = 0.12) -> None:
        self._client = httpx.Client(timeout=30.0)
        self._delay = delay

    def iter_uga(self, max_rows: int = 2000) -> Iterator[dict[str, Any]]:
        where = 'search(participants, "Grenoble Alpes")'
        for offset in range(0, max_rows, 100):
            params = {"where": where, "limit": 100, "offset": offset, "order_by": "year desc"}
            res = self._client.get(self.BASE, params=params)
            res.raise_for_status()
            results = res.json().get("results", [])
            yield from results
            if len(results) < 100:
                break
            time.sleep(self._delay)
