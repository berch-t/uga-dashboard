"""Style de visualisation partagé (matplotlib), pour des graphiques homogènes."""

from __future__ import annotations

import matplotlib as mpl
import matplotlib.pyplot as plt

BRAND = "#2563eb"
ACCENT = "#10b981"
PALETTE = ["#2563eb", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"]

# Résolution élevée par défaut (figures nettes à l'écran ET à l'export PDF),
# appliquée dès l'import — quel que soit l'ordre d'appel à `apply_style`.
mpl.rcParams["figure.dpi"] = 150
mpl.rcParams["savefig.dpi"] = 150
mpl.rcParams["savefig.bbox"] = "tight"


def apply_style() -> None:
    """Applique un thème sobre et lisible, identité visuelle du dashboard."""
    mpl.rcParams.update(
        {
            "figure.figsize": (9, 4.5),
            "figure.dpi": 150,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.grid": True,
            "grid.alpha": 0.25,
            "grid.linestyle": "--",
            "axes.titleweight": "bold",
            "axes.titlesize": 13,
            "font.size": 11,
        }
    )


def community_palette(community: int) -> str:
    """Couleur stable pour une communauté (réseau de collaboration)."""
    return PALETTE[community % len(PALETTE)]


def new_axes(title: str = "", xlabel: str = "", ylabel: str = "") -> plt.Axes:
    apply_style()
    _, ax = plt.subplots()
    if title:
        ax.set_title(title)
    if xlabel:
        ax.set_xlabel(xlabel)
    if ylabel:
        ax.set_ylabel(ylabel)
    return ax
