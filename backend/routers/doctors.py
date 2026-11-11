from typing import Optional, Literal
import math
from backend.doctor_distances import add_distances
from backend.provider_portraits import portrait_for
from backend.provider_specialties import search_group, matched_taxonomy, TAXONOMIES

import httpx
from fastapi import APIRouter, HTTPException, Depends, Response, status
from backend.security import get_current_user
from backend.clinic_photos import lookup_photo

router = APIRouter()

NPI_REGISTRY_URL = "https://npiregistry.cms.hhs.gov/api/"


@router.get("/{npi}/clinic-photo")
def clinic_photo(npi: str, response: Response, current_user=Depends(get_current_user)):
    if len(npi) != 10 or not npi.isdigit():
        raise HTTPException(400, "Invalid provider NPI")
    response.headers["Cache-Control"] = "no-store"
    try:
        result = httpx.get(
            NPI_REGISTRY_URL, params={"version": "2.1", "number": npi}, timeout=10
        )
        result.raise_for_status()
    except httpx.HTTPError:
        raise HTTPException(502, "Provider directory unavailable")
    records = result.json().get("results", [])
    if not records:
        raise HTTPException(404, "Provider not found")
    provider = records[0]
    basic = provider.get("basic", {})
    address = next(
        (
            a
            for a in provider.get("addresses", [])
            if a.get("address_purpose") == "LOCATION"
        ),
        {},
    )
    return lookup_photo(
        {
            "npi": npi,
            "first_name": basic.get("first_name"),
            "last_name": basic.get("last_name"),
            "address": address.get("address_1"),
            "city": address.get("city"),
            "state": address.get("state"),
            "phone": address.get("telephone_number"),
        }
    )


@router.get("/search")
def search_doctors(
    specialty: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    gender: Optional[str] = None,
    limit: int = 20,
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    specialty_group: Optional[
        Literal["all", "primary_care", "cardiology", "pulmonology", "endocrinology"]
    ] = None,
):
    """
    Search individual provider listings in the CMS NPI Registry.

    `specialty` is passed through as NPPES's taxonomy_description filter, e.g.
    "Cardiovascular Disease", "Nephrology", "Pulmonary Disease". The optional
    `specialty_group` searches the agreed taxonomy codes across multiple queries.
    `gender` isn't
    a supported NPPES query param, so it's filtered client-side after fetching.
    """
    if (latitude is None) != (longitude is None):
        raise HTTPException(422, "Latitude and longitude must be provided together")
    if latitude is not None and (
        not math.isfinite(latitude)
        or not math.isfinite(longitude)
        or not -90 <= latitude <= 90
        or not -180 <= longitude <= 180
    ):
        raise HTTPException(422, "Invalid coordinates")
    params = {
        "version": "2.1",
        "enumeration_type": "NPI-1",  # individual providers only, not organizations
        "limit": max(1, min(limit, 20 if latitude is not None else 200)),
    }
    if specialty:
        params["taxonomy_description"] = specialty
    if city:
        params["city"] = city
    if state:
        params["state"] = state

    if specialty_group and specialty:
        raise HTTPException(422, "Choose specialty_group or specialty, not both")
    search_incomplete = False
    if specialty_group:
        records, search_incomplete, succeeded = search_group(params, specialty_group)
        if not succeeded:
            raise HTTPException(502, "Provider directory unavailable. Please retry.")
    else:
        try:
            response = httpx.get(NPI_REGISTRY_URL, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            if data.get("Errors"):
                raise ValueError("Invalid directory response")
            records = data.get("results", [])
        except (httpx.HTTPError, ValueError):
            raise HTTPException(502, "Provider directory unavailable. Please retry.")

    doctors = []

    seen = set()
    for result in records:
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

        matched = (
            matched_taxonomy(taxonomies, specialty_group) if specialty_group else None
        )
        if specialty_group and not matched:
            continue
        # A provider returned by several taxonomy queries should appear once at
        # each practice address, before distance lookup and the final result cap.
        key = (
            str(result.get("number")),
            *(
                str(practice_address.get(field, "")).strip().casefold()
                for field in ("address_1", "address_2", "city", "state", "postal_code")
            ),
        )
        if key in seen:
            continue
        seen.add(key)
        doctors.append(
            {
                "npi": result.get("number"),
                "first_name": basic.get("first_name"),
                "last_name": basic.get("last_name"),
                "gender": basic.get("gender"),
                "specialty": primary_taxonomy.get("desc"),
                **(
                    {
                        "matched_specialty": TAXONOMIES[matched["code"]],
                        "matched_specialty_is_primary": bool(matched.get("primary")),
                    }
                    if matched
                    else {}
                ),
                "city": practice_address.get("city"),
                "state": practice_address.get("state"),
                "phone": practice_address.get("telephone_number"),
                "address": practice_address.get("address_1"),
                "address_line_2": practice_address.get("address_2"),
                "postal_code": practice_address.get("postal_code"),
                "credential": basic.get("credential"),
                "fax": practice_address.get("fax_number"),
                "registry_status": basic.get("status"),
                "last_updated": basic.get("last_updated"),
                "taxonomies": [t.get("desc") for t in taxonomies if t.get("desc")],
                "registry_url": f"https://npiregistry.cms.hhs.gov/provider-view/{result.get('number')}",
            }
        )

    for doctor in doctors:
        doctor.update(portrait_for(doctor))

    incomplete = (
        add_distances(doctors, (latitude, longitude)) if latitude is not None else False
    )
    doctors = doctors[: params["limit"]]
    return {
        "count": len(doctors),
        "doctors": doctors,
        "distance_incomplete": incomplete,
        "search_incomplete": search_incomplete,
    }
