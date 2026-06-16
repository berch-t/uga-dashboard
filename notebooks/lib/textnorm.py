"""Normalisation et similarité de texte pour la réconciliation (record linkage).

Miroir Python de `pipeline/transform/normalize.ts` et `reconcile.ts` : mise en
forme canonique des DOI et des titres, puis similarité de Jaccard sur jetons.
"""

from __future__ import annotations

import re
import unicodedata

_DOI_PREFIX = re.compile(r"^https?://(dx\.)?doi\.org/", re.IGNORECASE)
_NON_WORD = re.compile(r"[^a-z0-9\s]")
_SPACES = re.compile(r"\s+")


def normalize_doi(doi: str | None) -> str:
    """DOI en forme canonique : minuscule, sans préfixe URL."""
    if not doi:
        return ""
    return _DOI_PREFIX.sub("", doi.strip().lower())


def normalize_title(title: str | None) -> str:
    """Titre nettoyé : minuscule, sans diacritiques, sans ponctuation."""
    if not title:
        return ""
    decomposed = unicodedata.normalize("NFKD", title.lower())
    ascii_str = "".join(c for c in decomposed if not unicodedata.combining(c))
    return _SPACES.sub(" ", _NON_WORD.sub(" ", ascii_str)).strip()


def token_set(title: str | None) -> set[str]:
    """Ensemble de jetons (mots de plus de 2 caractères) d'un titre normalisé."""
    return {tok for tok in normalize_title(title).split() if len(tok) > 2}


def jaccard(a: set[str], b: set[str]) -> float:
    """Similarité de Jaccard entre deux ensembles de jetons."""
    if not a or not b:
        return 0.0
    inter = len(a & b)
    return inter / (len(a) + len(b) - inter)
