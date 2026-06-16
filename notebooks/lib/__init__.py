"""Helpers partagés des notebooks scientométriques UGA.

Tout est conçu pour la reproductibilité : graines fixées, données réelles mises
en cache localement, lecture des mêmes marts que le dashboard.
"""

from .seeds import set_seeds
from .config import Config, CONFIG
from .dataset import load_works, load_mart, marts_dir
from .clients import OpenAlexClient, HalClient, ScanrClient

__all__ = [
    "set_seeds",
    "Config",
    "CONFIG",
    "load_works",
    "load_mart",
    "marts_dir",
    "OpenAlexClient",
    "HalClient",
    "ScanrClient",
]
