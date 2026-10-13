"""On-demand Google Places lookup. No API key or photo names reach the app."""
import base64
import json
import os
import re
import threading
from urllib.parse import quote
from pathlib import Path
from datetime import date

import httpx
from fastapi import HTTPException

_lock = threading.Lock()
_day = date.today()
_calls = 0
REVIEWED_CLINICS = {
    row['npi']: row for row in json.loads(
        Path(__file__).with_name('reviewed_clinics.json').read_text()
    )
}


def reviewed_clinic(provider):
    row = REVIEWED_CLINICS.get(str(provider.get('npi')))
    if not row:
        return None
    for field in ('first_name', 'last_name', 'city', 'state'):
        if str(provider.get(field) or '').strip().lower() != row[field].strip().lower():
            return None
    if normalized_address(provider.get('address') or '') != normalized_address(row['address']):
        return None
    return row


def reserve_lookup():
    global _day, _calls
    with _lock:
        if _day != date.today():
            _day, _calls = date.today(), 0
        if _calls >= int(os.getenv('GOOGLE_PLACES_DAILY_LOOKUP_LIMIT', '20')):
            raise HTTPException(429, 'Clinic photo lookup limit reached for today.')
        _calls += 1


def normalized_address(value):
    value = re.sub(r'\b(suite|ste|unit|apt)\s+[\w-]+', '', value.lower())
    for full, short in [('street','st'),('avenue','ave'),('boulevard','blvd'),('road','rd'),('drive','dr'),('lane','ln'),('north','n'),('south','s'),('east','e'),('west','w')]:
        value = re.sub(r'\b'+full+r'\b', short, value)
    return re.sub(r'[^a-z0-9]', '', value)


def matches_practice(provider, place):
    parts = [part.strip() for part in (place.get('formattedAddress') or '').split(',')]
    address = normalized_address(provider.get('address') or '')
    candidate = normalized_address(parts[0])
    if not address or address != candidate:
        return False
    city = normalized_address(provider.get('city') or '')
    city_positions = [i for i in range(1, len(parts)) if normalized_address(parts[i]) == city]
    if city and not city_positions:
        return False
    state = str(provider.get('state') or '').strip().upper()
    state_parts = [parts[i + 1] for i in city_positions if i + 1 < len(parts)] if city else parts[1:]
    if state and not any(re.fullmatch(re.escape(state) + r'(?:\s+\d{5}(?:-\d{4})?)?', part, re.I) for part in state_parts):
        return False
    phone = re.sub(r'\D', '', provider.get('phone') or '')[-10:]
    candidate_phone = re.sub(r'\D', '', place.get('nationalPhoneNumber') or '')[-10:]
    last = (provider.get('last_name') or '').lower()
    name = (place.get('displayName') or {}).get('text', '').lower()
    return (len(phone) == 10 and phone == candidate_phone) or (bool(last) and last in re.findall(r'[a-z]+', name))


def street_view(provider, client, key):
    address = ' '.join(str(provider.get(k) or '') for k in ['address', 'city', 'state'])
    if not provider.get('address') or not provider.get('city') or not provider.get('state'):
        return {'photo_url':None, 'message':'A complete practice address is needed for Street View.'}
    params = {'location':address, 'key':key, 'source':'outdoor', 'radius':provider.get('radius', 50)}
    metadata = client.get('https://maps.googleapis.com/maps/api/streetview/metadata', params=params)
    metadata.raise_for_status()
    data = metadata.json()
    if data.get('status') in ('ZERO_RESULTS','NOT_FOUND'):
        return {'photo_url':None, 'message':'No nearby Street View imagery is available.'}
    if data.get('status') != 'OK':
        raise HTTPException(503, 'Street View is unavailable. Check API access, key restrictions, and quota.')
    reserve_lookup()
    image = client.get('https://maps.googleapis.com/maps/api/streetview', params={**params,
        'size':'640x320', 'fov':90, 'pitch':0, 'return_error_code':'true'})
    image.raise_for_status()
    mime = image.headers.get('content-type','').split(';')[0]
    if mime not in ('image/jpeg','image/png'):
        return {'photo_url':None, 'message':'Street View image could not be loaded.'}
    return {'photo_url':f'data:{mime};base64,' + base64.b64encode(image.content).decode('ascii'),
            'source':'street_view', 'image_date':data.get('date'),
            'website':provider.get('website'),
            'place_name':address, 'attributions':[],
            'maps_url':'https://www.google.com/maps/search/?api=1&query=' + quote(address),
            'message':'Street View near the practice address. The image may show surrounding buildings rather than the exact entrance.'}


def lookup_photo(provider):
    key = os.getenv('GOOGLE_PLACES_API_KEY')
    if not key:
        raise HTTPException(503, 'Clinic photos are not configured yet.')
    query = ' '.join(str(provider.get(k) or '') for k in ['first_name','last_name','address','city','state'])
    try:
        with httpx.Client(timeout=12) as client:
            reviewed = reviewed_clinic(provider)
            if reviewed:
                # This curated address has already been checked for outdoor
                # coverage. Metadata remains live; no panorama IDs or image
                # bytes are persisted. Only the image consumes the allowance.
                return street_view({**provider, 'radius':reviewed['radius'],
                                    'website':reviewed.get('website')}, client, key)
            reserve_lookup()
            def search(text):
                result = client.post('https://places.googleapis.com/v1/places:searchText',
                    headers={'X-Goog-Api-Key':key, 'X-Goog-FieldMask':'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.photos,places.googleMapsUri,places.websiteUri'},
                    json={'textQuery':text, 'pageSize':5})
                result.raise_for_status()
                return [p for p in result.json().get('places', []) if matches_practice(provider,p)]

            places = search(query)
            if len(places) > 1:
                return {'photo_url':None, 'message':'No unambiguous practice match found.'}
            if not places or not places[0].get('photos'):
                # Look up the medical practice itself rather than an individual
                # listing. Keep the same address and phone/name identity checks.
                reserve_lookup()
                clinic_query = 'medical clinic ' + ' '.join(str(provider.get(k) or '') for k in ['address','city','state'])
                places = search(clinic_query)
            if len(places) != 1:
                return street_view(provider, client, key)
            place = places[0]
            photos = place.get('photos') or []
            if not photos:
                return street_view(provider, client, key)
            photo = photos[0]
            name = photo.get('name','')
            if not re.fullmatch(r'places/[^/]+/photos/[^/]+', name):
                return {'photo_url':None, 'message':'Practice photo unavailable.'}
            media = client.get(f'https://places.googleapis.com/v1/{name}/media',
                headers={'X-Goog-Api-Key':key}, params={'maxWidthPx':800,'skipHttpRedirect':'true'})
            media.raise_for_status()
            uri = media.json().get('photoUri','')
            if not uri.startswith('https://') or key in uri:
                return {'photo_url':None, 'message':'Practice photo unavailable.'}
            return {'photo_url':uri,'source':'places','place_name':place.get('displayName',{}).get('text'),
                    'maps_url':place.get('googleMapsUri'), 'website':place.get('websiteUri'),
                    'attributions':photo.get('authorAttributions',[]),
                    'message':'Photo from a practice listing matched by address and contact/name. It may show the building, interior, or another listing image.'}
    except httpx.HTTPStatusError as error:
        try:
            details = error.response.json().get('error', {}).get('details', [])
            reasons = {item.get('reason') for item in details}
        except (ValueError, AttributeError, TypeError):
            reasons = set()
        if 'SERVICE_DISABLED' in reasons:
            raise HTTPException(503, 'Clinic photos are not enabled yet. The VitalPilot team must enable Places API (New) in the Google Cloud project that owns the backend API key.')
        if 'BILLING_DISABLED' in reasons:
            raise HTTPException(503, 'Clinic photos require billing to be enabled for the Google Cloud project.')
        if error.response.status_code in (403,429):
            raise HTTPException(503, 'Clinic photos unavailable. Check Places API billing, key restrictions, and quota.')
        raise HTTPException(502, 'Clinic photo service is temporarily unavailable.')
    except httpx.HTTPError:
        raise HTTPException(502, 'Cannot reach the clinic photo service right now.')
