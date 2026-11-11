"""Offline checks for curated portrait metadata and the search response contract."""

from datetime import date
import unittest
from unittest.mock import patch
from urllib.parse import parse_qs, urlparse

from fastapi import FastAPI
from fastapi.testclient import TestClient

from backend.provider_portraits import PORTRAITS, portrait_for
from backend.routers.doctors import router


class ProviderPortraitTests(unittest.TestCase):
    def test_registry_contains_reviewable_metadata_and_valid_npis(self):
        required = {
            "first_name",
            "last_name",
            "image_url",
            "source_url",
            "attribution",
            "verified_on",
            "verification",
            "npi_source_url",
        }
        for npi, entry in PORTRAITS.items():
            with self.subTest(npi=npi):
                self.assertRegex(npi, r"^[12]\d{9}$")
                # NPI check digits use Luhn with the health-industry prefix 80840.
                digits = [int(value) for value in reversed("80840" + npi)]
                checksum = sum(
                    value if index % 2 == 0 else (value * 2 // 10 + value * 2 % 10)
                    for index, value in enumerate(digits)
                )
                self.assertEqual(checksum % 10, 0)
                self.assertTrue(required.issubset(entry))
                for field in required:
                    self.assertIsInstance(entry[field], str)
                    self.assertTrue(entry[field].strip(), field)
                for field in ("image_url", "source_url", "npi_source_url"):
                    url = urlparse(entry[field])
                    self.assertEqual(url.scheme, "https")
                    self.assertTrue(url.hostname)
                    self.assertIsNone(url.username)
                    self.assertIsNone(url.password)
                self.assertNotEqual(entry["image_url"], entry["source_url"])
                self.assertNotRegex(
                    entry["image_url"].casefold(),
                    r"no[_-]?photo|default-provider|placeholder|icon-doctor",
                )
                self.assertLessEqual(
                    date.fromisoformat(entry["verified_on"]), date.today()
                )
                lookup = urlparse(entry["npi_source_url"])
                self.assertEqual(lookup.hostname, "npiregistry.cms.hhs.gov")
                self.assertEqual(parse_qs(lookup.query)["number"], [npi])

    def test_every_portrait_requires_its_exact_npi_and_both_names(self):
        for npi, entry in PORTRAITS.items():
            doctor = {
                "npi": npi,
                "first_name": entry["first_name"].upper(),
                "last_name": entry["last_name"].upper(),
            }
            with self.subTest(npi=npi):
                self.assertEqual(
                    portrait_for(doctor)["portrait_url"], entry["image_url"]
                )
                for field in ("first_name", "last_name"):
                    self.assertEqual(portrait_for({**doctor, field: "Different"}), {})
                    self.assertEqual(portrait_for({**doctor, field: None}), {})
                self.assertEqual(portrait_for({**doctor, "npi": "9999999999"}), {})
        self.assertEqual(portrait_for({}), {})

    def test_expanded_portraits_reach_search_without_new_response_fields(self):
        # Different publishers and matching methods exercise the mobile contract.
        identities = [
            "1437110418",
            "1043660178",
            "1457328403",
            "1588906986",
            "1700146586",
            "1144428319",
            "1003913674",
            "1750365839",
            "1225002298",
            "1386608370",
            "1124400031",
            "1669423281",
            "1326244724",
            "1033313671",
            "1548375827",
            "1053998492",
            "1346879681",
        ]
        records = []
        for npi in identities:
            entry = PORTRAITS[npi]
            records.append(
                {
                    "number": npi,
                    "basic": {
                        "first_name": entry["first_name"].upper(),
                        "last_name": entry["last_name"].upper(),
                    },
                    "addresses": [
                        {
                            "address_purpose": "LOCATION",
                            "address_1": "100 Main St",
                            "city": "Test",
                            "state": "TX",
                        }
                    ],
                    "taxonomies": [
                        {
                            "code": "207Q00000X",
                            "desc": "Family Medicine",
                            "primary": True,
                        }
                    ],
                }
            )
        # A reused NPI with the wrong name must never receive that person's face.
        records.append(
            {
                **records[0],
                "basic": {"first_name": "Another", "last_name": "Person"},
                "addresses": [
                    {**records[0]["addresses"][0], "address_1": "200 Main St"}
                ],
            }
        )
        app = FastAPI()
        app.include_router(router, prefix="/doctors")
        with (
            TestClient(app) as client,
            patch("backend.routers.doctors.httpx.get") as lookup,
        ):
            lookup.return_value.json.return_value = {"results": records}
            response = client.get("/doctors/search?city=Test&state=TX")
        self.assertEqual(response.status_code, 200, response.text)
        doctors = response.json()["doctors"]
        self.assertEqual(len(doctors), len(records))
        for doctor, npi in zip(doctors, identities):
            entry = PORTRAITS[npi]
            self.assertEqual(doctor["portrait_url"], entry["image_url"])
            self.assertEqual(doctor["portrait_source_url"], entry["source_url"])
            self.assertEqual(doctor["portrait_attribution"], entry["attribution"])
            self.assertNotIn("verification", doctor)
            self.assertNotIn("npi_source_url", doctor)
        self.assertNotIn("portrait_url", doctors[-1])

    def test_same_name_different_npi_never_reuses_verified_portrait(self):
        cardiologist = portrait_for(
            {
                "npi": "1053843672",
                "first_name": "Caitlin",
                "last_name": "Bell",
            }
        )
        endocrinologist = portrait_for(
            {
                "npi": "1841751765",
                "first_name": "Caitlin",
                "last_name": "Bell",
            }
        )
        self.assertTrue(cardiologist.get("portrait_url"))
        # The inspected official page identifies the cardiologist's NPI. A future
        # independently verified endocrinologist portrait must be a different asset.
        self.assertNotEqual(
            cardiologist["portrait_url"], endocrinologist.get("portrait_url")
        )

    def test_registry_never_shares_one_portrait_asset_between_different_npis(self):
        owners = {}
        for npi, entry in PORTRAITS.items():
            # Ignore cache/size parameters, but retain the image identity used by
            # HCA's file downloads and Novant's Next.js image proxy.
            image = urlparse(entry["image_url"])
            query = parse_qs(image.query)
            asset = (
                image.hostname.casefold(),
                image.path,
                tuple(
                    (key, tuple(query[key])) for key in ("file", "url") if key in query
                ),
            )
            self.assertNotIn(
                asset, owners, f"{npi} reuses {owners.get(asset)}'s portrait"
            )
            owners[asset] = npi
