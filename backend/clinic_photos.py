"""On-demand Google Places lookup. No API key or photo names reach the app."""
import os
import re
import threading
from datetime import date

import httpx
from fastapi import HTTPException

_lock = threading.Lock()
_day = date.today()
_calls = 0


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
    address = normalized_address(provider.get('address') or '')
    candidate = normalized_address((place.get('formattedAddress') or '').split(',')[0])
    if not address or address != candidate:
        return False
    phone = re.sub(r'\D', '', provider.get('phone') or '')[-10:]
    candidate_phone = re.sub(r'\D', '', place.get('nationalPhoneNumber') or '')[-10:]
    last = (provider.get('last_name') or '').lower()
    name = (place.get('displayName') or {}).get('text', '').lower()
    return (len(phone) == 10 and phone == candidate_phone) or (bool(last) and last in re.findall(r'[a-z]+', name))


def lookup_photo(provider):
    key = os.getenv('GOOGLE_PLACES_API_KEY')
    if not key:
        raise HTTPException(503, 'Clinic photos are not configured yet.')
    reserve_lookup()
    query = ' '.join(str(provider.get(k) or '') for k in ['first_name','last_name','address','city','state'])
    try:
        with httpx.Client(timeout=12) as client:
            result = client.post('https://places.googleapis.com/v1/places:searchText',
                headers={'X-Goog-Api-Key':key, 'X-Goog-FieldMask':'places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.photos,places.googleMapsUri,places.websiteUri'},
                json={'textQuery':query, 'pageSize':3})
            result.raise_for_status()
            places = [p for p in result.json().get('places', []) if matches_practice(provider,p)]
            if len(places) != 1:
                return {'photo_url':None, 'message':'No unambiguous practice match found.'}
            place = places[0]
            photos = place.get('photos') or []
            if not photos:
                return {'photo_url':None, 'message':'This practice listing has no photos.'}
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
            return {'photo_url':uri,'place_name':place.get('displayName',{}).get('text'),
                    'maps_url':place.get('googleMapsUri'), 'website':place.get('websiteUri'),
                    'attributions':photo.get('authorAttributions',[]),
                    'message':'Photo from a practice listing matched by address and contact/name. It may show the building, interior, or another listing image.'}
    except httpx.HTTPStatusError as error:
        if error.response.status_code in (403,429):
            raise HTTPException(503, 'Clinic photos unavailable. Check Places API billing, key restrictions, and quota.')
        raise HTTPException(502, 'Clinic photo service is temporarily unavailable.')
    except httpx.HTTPError:
        raise HTTPException(502, 'Cannot reach the clinic photo service right now.')
