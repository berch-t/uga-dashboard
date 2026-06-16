"""Configuration centrale des notebooks (miroir de `pipeline/config.ts`).

Une seule source de vérité pour l'institution, les fenêtres temporelles et les
chemins, afin que les notebooks restent cohérents avec le pipeline du dashboard.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# notebooks/lib/config.py -> remonte à la racine du dépôt.
REPO_ROOT = Path(__file__).resolve().parents[2]


@dataclass(frozen=True)
class Config:
    # Institution (identique au pipeline TS).
    openalex_id: str = "I899635006"
    hal_struct_acronym: str = "UGA"
    institution_name: str = "Universite Grenoble Alpes"

    # Fenêtre d'analyse pour les notebooks (échantillon raisonnable, reproductible).
    from_year: int = 2019
    to_year: int = 2024
    sample_size: int = 4000

    # Pool poli OpenAlex.
    mailto: str = "tonton.ia85@gmail.com"

    # Chemins.
    repo_root: Path = REPO_ROOT
    marts_dir: Path = field(default_factory=lambda: REPO_ROOT / "data" / "marts")
    cache_dir: Path = field(default_factory=lambda: REPO_ROOT / "notebooks" / "data")


CONFIG = Config()
