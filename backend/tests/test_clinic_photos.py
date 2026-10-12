import unittest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException
from backend.clinic_photos import matches_practice, lookup_photo

class ClinicPhotoTests(unittest.TestCase):
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
