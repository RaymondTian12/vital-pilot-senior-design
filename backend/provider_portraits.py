"""Curated official portraits, never a best-effort image search of a name."""

import json
from pathlib import Path

PORTRAITS = json.loads(Path(__file__).with_name("provider_portraits.json").read_text())


def portrait_for(provider):
    entry = PORTRAITS.get(str(provider.get("npi")))
    if not entry:
        return {}
    # Require both the stable NPI and matching names. Unknown or changed records
    # use initials rather than risk displaying another person's photograph.
    for field in ("first_name", "last_name"):
        if (
            " ".join(str(provider.get(field) or "").casefold().split())
            != entry[field].casefold()
        ):
            return {}
    return {
        "portrait_url": entry["image_url"],
        "portrait_source_url": entry["source_url"],
        "portrait_attribution": entry["attribution"],
    }
