from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException, status

router = APIRouter()

NPI_REGISTRY_URL = "https://npiregistry.cms.hhs.gov/api/"


@router.get("/search")
def search_doctors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 20,
):
    """
    Search for real, verified healthcare providers via the CMS NPI Registry.

    `specialty` is passed through as NPPES's taxonomy_description filter, e.g.
    "Cardiovascular Disease", "Nephrology", "Pulmonary Disease". `gender` isn't
    a supported NPPES query param, so it's filtered client-side after fetching.
    """
    params = {
        "version": "2.1",
        "enumeration_type": "NPI-1",  # individual providers only, not organizations
        "limit": min(limit, 200),
    }
    if specialty:
        params["taxonomy_description"] = specialty
    if city:
        params["city"] = city
    if state:
        params["state"] = state

    try:
        response = httpx.get(NPI_REGISTRY_URL, params=params, timeout=10.0)
        response.raise_for_status()
    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"NPI Registry lookup failed: {e}",
        )

    data = response.json()
    doctors = []

    for result in data.get("results", []):
        basic = result.get("basic", {})

        if gender and basic.get("gender", "").upper() != gender.upper():
            continue

        addresses = result.get("addresses", [])
        practice_address = next(
            (a for a in addresses if a.get("address_purpose") == "LOCATION"),
            addresses[0] if addresses else {},
        )

        taxonomies = result.get("taxonomies", [])
        primary_taxonomy = next(
            (t for t in taxonomies if t.get("primary")),
            taxonomies[0] if taxonomies else {},
        )

        doctors.append({
            "npi": result.get("number"),
            "first_name": basic.get("first_name"),
            "last_name": basic.get("last_name"),
            "gender": basic.get("gender"),
            "specialty": primary_taxonomy.get("desc"),
            "city": practice_address.get("city"),
            "state": practice_address.get("state"),
            "phone": practice_address.get("telephone_number"),
            "address": practice_address.get("address_1"),
        })

    return {"count": len(doctors), "doctors": doctors}
