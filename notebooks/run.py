"""Exécution déterministe des notebooks vers `public/notebooks/`.

Pour chaque source jupytext `NN_*.py` :
  1. conversion en `.ipynb` (jupytext) ;
  2. exécution avec papermill (kernel python3, cwd = ce dossier, graines fixées
     dans chaque notebook) ;
  3. écriture du `.ipynb` exécuté dans `public/notebooks/`.

Un `manifest.json` récapitule la provenance (date, ordre, statut). Les notebooks
sont ensuite servis statiquement et rendus par le visualiseur React du dashboard.

Usage : `uv run python run.py [--only 01]`
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import jupytext
import papermill as pm

HERE = Path(__file__).resolve().parent
OUT_DIR = HERE.parent / "public" / "notebooks"

# Catalogue : ordre, identifiant, titre et catégorie (pilote la sidebar React).
CATALOG: list[dict[str, str]] = [
    {"id": "01_eda_corpus", "title": "Analyse exploratoire du corpus", "category": "Data Science"},
    {"id": "02_ingestion_api", "title": "Ingestion d'API & nouvelle source", "category": "Data Engineering"},
    {"id": "03_reconciliation_qualite", "title": "Réconciliation & qualité", "category": "Data Engineering"},
    {"id": "04_topic_modeling", "title": "Topic modeling (embeddings)", "category": "Data Science"},
    {"id": "05_bibliometrie_impact", "title": "Bibliométrie & impact", "category": "Data Science"},
    {"id": "06_reseau_collaboration", "title": "Réseau de collaboration", "category": "Data Science"},
    {"id": "07_series_temporelles_prevision", "title": "Séries temporelles & prévision", "category": "Data Science"},
    {"id": "08_scaling_polars_duckdb", "title": "Montée à l'échelle (polars/duckdb)", "category": "Data Engineering"},
    {"id": "09_pipeline_data_contracts", "title": "Pipeline & data contracts", "category": "Data Engineering"},
]


def execute_one(entry: dict[str, str]) -> dict[str, str]:
    src = HERE / f"{entry['id']}.py"
    out = OUT_DIR / f"{entry['id']}.ipynb"
    print(f"[notebooks] {entry['id']} … ", end="", flush=True)

    nb = jupytext.read(src)
    tmp = OUT_DIR / f"_{entry['id']}.src.ipynb"
    jupytext.write(nb, tmp)
    try:
        pm.execute_notebook(str(tmp), str(out), cwd=str(HERE), progress_bar=False, kernel_name="python3")
        status = "ok"
        print("ok")
    except Exception as exc:  # on continue les autres, on remonte le statut
        status = f"error: {exc.__class__.__name__}"
        print(f"ECHEC ({exc.__class__.__name__})")
    finally:
        tmp.unlink(missing_ok=True)
    return {**entry, "file": f"{entry['id']}.ipynb", "status": status}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--only", help="préfixe d'identifiant à exécuter (ex. 01)")
    args = parser.parse_args()

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    to_run = [
        e
        for e in CATALOG
        if (not args.only or e["id"].startswith(args.only)) and (HERE / f"{e['id']}.py").exists()
    ]

    executed = {e["id"]: execute_one(e) for e in to_run}

    # Le manifeste couvre toujours l'ensemble du catalogue dont le notebook existe
    # dans `public/notebooks/`. Avec `--only`, on ré-exécute la cible et l'on
    # conserve les autres déjà exécutés (statut « ok ») au lieu de les effacer.
    results: list[dict[str, str]] = []
    for e in CATALOG:
        if e["id"] in executed:
            results.append(executed[e["id"]])
        elif (OUT_DIR / f"{e['id']}.ipynb").exists():
            results.append({**e, "file": f"{e['id']}.ipynb", "status": "ok"})

    manifest = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "notebooks": results,
    }
    (OUT_DIR / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")

    failed = [r for r in executed.values() if r["status"] != "ok"]
    print(f"[notebooks] {len(executed) - len(failed)}/{len(executed)} executes")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
