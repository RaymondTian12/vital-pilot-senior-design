import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from backend.clinic_photos import matches_practice, lookup_photo, street_view, reviewed_clinic, REVIEWED_CLINICS

class ClinicPhotoTests(unittest.TestCase):
    def test_reviewed_location_requires_current_identity_and_address(self):
        row = REVIEWED_CLINICS['1578523122']
        self.assertEqual(reviewed_clinic(row), row)
        self.assertIsNone(reviewed_clinic({**row, 'address':'999 Different Street'}))
        self.assertIsNone(reviewed_clinic({**row, 'city':'Dallas'}))
        self.assertIsNone(reviewed_clinic({**row, 'last_name':'Someone Else'}))

    def test_reviewed_location_skips_places_and_counts_one_image(self):
        client=MagicMock();metadata=MagicMock();metadata.json.return_value={'status':'OK'}
        image=MagicMock();image.headers={'content-type':'image/jpeg'};image.content=b'image'
        client.get.side_effect=[metadata,image]
        with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY':'test-key'}), patch('backend.clinic_photos.reserve_lookup') as budget, patch('backend.clinic_photos.httpx.Client') as factory:
            factory.return_value.__enter__.return_value=client
            result=lookup_photo(REVIEWED_CLINICS['1578523122'])
        self.assertEqual(result['source'],'street_view')
        client.post.assert_not_called()
        budget.assert_called_once()
    def test_missing_streetview_does_not_request_paid_image(self):
        client=MagicMock();client.get.return_value.json.return_value={'status':'ZERO_RESULTS'}
        result=street_view({'address':'100 Main St','city':'Arlington','state':'TX'},client,'private-test-key')
        self.assertIsNone(result['photo_url'])
        self.assertEqual(client.get.call_count,1)

    def test_streetview_keeps_key_private_and_preserves_image_bytes(self):
        client=MagicMock();metadata=MagicMock();metadata.json.return_value={'status':'OK','date':'2024-06'}
        image=MagicMock();image.headers={'content-type':'image/jpeg'};image.content=b'jpeg-image-bytes'
        client.get.side_effect=[metadata,image]
        with patch('backend.clinic_photos.reserve_lookup') as budget:
            result=street_view({'address':'100 Main St','city':'Arlington','state':'TX'},client,'private-test-key')
        self.assertEqual(result['source'],'street_view')
        self.assertEqual(result['image_date'],'2024-06')
        self.assertNotIn('private-test-key',str(result))
        self.assertTrue(result['photo_url'].startswith('data:image/jpeg;base64,'))
        budget.assert_called_once()
    provider = {'address':'100 Main Street','phone':'8175550100','last_name':'Smith'}
    def test_requires_address_and_identity(self):
        self.assertTrue(matches_practice(self.provider, {'formattedAddress':'100 Main St, Arlington, TX','nationalPhoneNumber':'(817) 555-0100'}))
        self.assertFalse(matches_practice(self.provider, {'formattedAddress':'200 Main St, Arlington, TX','nationalPhoneNumber':'8175550100'}))
        self.assertFalse(matches_practice(self.provider, {'formattedAddress':'100 Main St, Arlington, TX','displayName':{'text':'Unrelated Clinic'}}))
    def test_no_configuration_makes_no_paid_requests(self):
        with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY':''}), patch('backend.clinic_photos.httpx.Client') as client:
            with self.assertRaises(HTTPException): lookup_photo(self.provider)
            client.assert_not_called()
    def test_ambiguous_matches_do_not_fetch_photo(self):
        place={'formattedAddress':'100 Main St, Arlington, TX','nationalPhoneNumber':'8175550100'}
        client=MagicMock();client.post.return_value.json.return_value={'places':[place,place]}
        with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY':'test-key'}), patch('backend.clinic_photos.reserve_lookup'), patch('backend.clinic_photos.httpx.Client') as factory:
            factory.return_value.__enter__.return_value=client
            self.assertIsNone(lookup_photo(self.provider)['photo_url']);client.get.assert_not_called()
    def test_photo_has_attribution_and_no_key_in_result(self):
        client=MagicMock();client.post.return_value.json.return_value={'places':[{'formattedAddress':'100 Main St, Arlington, TX','nationalPhoneNumber':'8175550100','displayName':{'text':'Clinic'},'photos':[{'name':'places/abc/photos/xyz','authorAttributions':[{'displayName':'Photographer'}]}]}]}
        client.get.return_value.json.return_value={'photoUri':'https://lh3.googleusercontent.com/example'}
        with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY':'test-key'}), patch('backend.clinic_photos.reserve_lookup'), patch('backend.clinic_photos.httpx.Client') as factory:
            factory.return_value.__enter__.return_value=client
            result=lookup_photo(self.provider)
            self.assertEqual(result['attributions'][0]['displayName'],'Photographer');self.assertNotIn('test-key',str(result))

    def test_clinic_fallback_finds_photo_using_address_and_shared_phone(self):
        doctor = {'formattedAddress':'100 Main St, Arlington, TX','nationalPhoneNumber':'8175550100'}
        clinic = {**doctor, 'displayName':{'text':'Family Health Center'}, 'photos':[{'name':'places/clinic/photos/exterior','authorAttributions':[]}]}
        client=MagicMock()
        first=MagicMock();first.json.return_value={'places':[doctor]}
        second=MagicMock();second.json.return_value={'places':[clinic]}
        client.post.side_effect=[first,second]
        client.get.return_value.json.return_value={'photoUri':'https://lh3.googleusercontent.com/clinic'}
        with patch.dict('os.environ', {'GOOGLE_PLACES_API_KEY':'test-key'}), patch('backend.clinic_photos.reserve_lookup') as budget, patch('backend.clinic_photos.httpx.Client') as factory:
            factory.return_value.__enter__.return_value=client
            result=lookup_photo(self.provider)
            self.assertEqual(result['place_name'],'Family Health Center')
            self.assertEqual(budget.call_count,2)
            self.assertIn('medical clinic',client.post.call_args_list[1].kwargs['json']['textQuery'])

    def test_same_street_in_other_city_is_not_a_match(self):
        self.assertFalse(matches_practice({**self.provider,'city':'Arlington'}, {'formattedAddress':'100 Main St, Dallas, TX','nationalPhoneNumber':'8175550100'}))

    def test_city_name_must_match_exactly(self):
        provider = {**self.provider, 'city':'Arlington', 'state':'TX'}
        self.assertFalse(matches_practice(provider, {'formattedAddress':'100 Main St, Arlington Heights, IL 60004, USA','nationalPhoneNumber':'8175550100'}))

    def test_same_city_in_other_state_is_not_a_match(self):
        provider = {**self.provider, 'city':'Arlington', 'state':'TX'}
        self.assertFalse(matches_practice(provider, {'formattedAddress':'100 Main St, Arlington, VA 22201, USA','nationalPhoneNumber':'8175550100'}))

    def test_exact_city_and_state_allow_postal_code(self):
        provider = {**self.provider, 'city':'Arlington', 'state':'TX'}
        for address in ('100 Main St, Arlington, TX', '100 Main St, Arlington, TX 76014, USA', '100 Main St, Arlington, TX 76014-1234, USA'):
            with self.subTest(address=address):
                self.assertTrue(matches_practice(provider, {'formattedAddress':address,'nationalPhoneNumber':'8175550100'}))
