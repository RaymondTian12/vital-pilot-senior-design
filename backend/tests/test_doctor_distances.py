import unittest
from unittest.mock import patch, Mock
import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend import doctor_distances as distances
from backend.routers.doctors import router


class DistanceTests(unittest.TestCase):
    def setUp(self):
        distances._cache.clear()

    def test_haversine(self):
        self.assertEqual(distances.miles_between((0, 0), (0, 0)), 0)
        self.assertAlmostEqual(distances.miles_between((0, 0), (0, 1)), 69.09, places=1)

    def test_dedup_sort_and_partial_failure(self):
        doctors = [dict(address=a, city='Test', state='TX') for a in ['far', 'missing', 'near', 'near']]
        with patch.object(distances, 'geocode', side_effect=lambda a: (0, 2) if a.startswith('far') else ((0, 1) if a.startswith('near') else None)) as lookup:
            self.assertTrue(distances.add_distances(doctors, (0, 0)))
        self.assertEqual(lookup.call_count, 3)
        self.assertEqual([d['address'] for d in doctors], ['near', 'near', 'far', 'missing'])
        self.assertIsNone(doctors[-1]['distance_miles'])

    def test_cache_expiry_and_timeout(self):
        response = Mock()
        response.json.return_value = {'result': {'addressMatches': [{'coordinates': {'x': -97, 'y': 32}}]}}
        with patch.object(distances.httpx, 'get', return_value=response) as get:
            distances.geocode('address')
            distances.geocode('address')
            self.assertEqual(get.call_count, 1)
            distances._cache['address'] = (0, (32, -97))
            distances.geocode('address')
            self.assertEqual(get.call_count, 2)
        with patch.object(distances.httpx, 'get', side_effect=httpx.ReadTimeout('timeout')):
            self.assertIsNone(distances.geocode('other'))

    def test_endpoint_validation_and_legacy_search(self):
        app = FastAPI()
        app.include_router(router, prefix='/doctors')
        client = TestClient(app)
        for query in ['latitude=1', 'latitude=91&longitude=0', 'latitude=nan&longitude=0', 'longitude=181&latitude=0']:
            self.assertEqual(client.get('/doctors/search?' + query).status_code, 422)
        response = Mock()
        response.json.return_value = {'results': []}
        with patch('backend.routers.doctors.httpx.get', return_value=response), patch('backend.routers.doctors.add_distances') as add:
            self.assertEqual(client.get('/doctors/search?city=Test&state=TX').json()['doctors'], [])
            add.assert_not_called()

    def test_lookup_budget_preserves_unknown_results(self):
        future = Mock()
        doctors = [dict(address='slow', city='Test', state='TX')]
        with patch.object(distances._pool, 'submit', return_value=future), patch.object(distances, 'wait', return_value=(set(), {future})) as wait:
            self.assertTrue(distances.add_distances(doctors, (0, 0)))
            wait.assert_called_once_with({future: 'slow, Test, TX, '}, timeout=8)
        future.cancel.assert_called_once()
        self.assertIsNone(doctors[0]['distance_miles'])
        self.assertFalse(distances.add_distances([], (0, 0)))

    def test_access_log_scope_redacts_coordinates(self):
        import asyncio
        from backend.app import CoordinatePrivacyMiddleware
        scope = {'path': '/doctors/search', 'query_string': b'latitude=32&longitude=-97&city=Test'}
        async def endpoint(scope, receive, send):
            self.assertIn(b'latitude=32', scope['query_string'])
            await send({'type': 'http.response.start', 'status': 200})
        async def send(message):
            self.assertNotIn(b'latitude=32', scope['query_string'])
            self.assertIn(b'city=Test', scope['query_string'])
        asyncio.run(CoordinatePrivacyMiddleware(endpoint)(scope, None, send))
