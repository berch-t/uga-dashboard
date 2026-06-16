"""Graines déterministes, partagées par tous les notebooks."""

from __future__ import annotations

import os
import random

SEED = 42


def set_seeds(seed: int = SEED) -> None:
    """Fixe toutes les sources d'aléa pour une exécution reproductible."""
    os.environ["PYTHONHASHSEED"] = str(seed)
    random.seed(seed)
    try:
        import numpy as np

        np.random.seed(seed)
    except ImportError:  # numpy absent (improbable) : on dégrade proprement
        pass
