"""Best-effort distances for the returned directory subset; never logs user origins."""
import math
import time
from concurrent.futures import ThreadPoolExecutor, wait
from threading import Lock

import httpx

_cache = {}
_lock = Lock()
_pool = ThreadPoolExecutor(max_workers=4)
TTL = 24 * 60 * 60


def miles_between(origin, destination):
    lat1, lon1, lat2, lon2 = map(math.radians, (*origin, *destination))
    a = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 3958.7613 * 2 * math.asin(math.sqrt(min(1, a)))


def geocode(address):
    now = time.monotonic()
    with _lock:
        cached = _cache.get(address)
        if cached and cached[0] > now:
            return cached[1]
    try:
        response = httpx.get(
            "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress",
            params={"address": address, "benchmark": "Public_AR_Current", "format": "json"},
            timeout=2.0,
        )
        response.raise_for_status()
        matches = response.json()["result"]["addressMatches"]
        if not matches:
            return None
        coords = matches[0]["coordinates"]
        point = (float(coords["y"]), float(coords["x"]))
        if not all(math.isfinite(v) for v in point) or not (-90 <= point[0] <= 90 and -180 <= point[1] <= 180):
            return None
    except (httpx.HTTPError, ValueError, KeyError, TypeError, IndexError):
        return None
    with _lock:
        # Bound memory and remove expired entries without retaining user locations.
        if len(_cache) >= 2000:
            _cache.clear()
        _cache[address] = (time.monotonic() + TTL, point)
    return point


def add_distances(doctors, origin):
    addresses = {}
    for doctor in doctors:
        address = ", ".join(str(doctor.get(k) or "").strip() for k in ("address", "city", "state", "postal_code"))
        if doctor.get("address") and doctor.get("city") and doctor.get("state"):
            addresses[address] = None
        doctor["distance_miles"] = None
    pending = {_pool.submit(geocode, address): address for address in addresses}
    completed, unfinished = wait(pending, timeout=8)
    points = {pending[future]: future.result() for future in completed}
    for future in unfinished:
        future.cancel()
    for doctor in doctors:
        address = ", ".join(str(doctor.get(k) or "").strip() for k in ("address", "city", "state", "postal_code"))
        point = points.get(address)
        if point is not None:
            doctor["distance_miles"] = miles_between(origin, point)
    doctors.sort(key=lambda d: d["distance_miles"] if d["distance_miles"] is not None else math.inf)
    return any(d["distance_miles"] is None for d in doctors)
