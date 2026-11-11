"""Patient search groups and portrait identity, with all directory calls mocked."""

import unittest
from unittest.mock import Mock, patch
import httpx
from fastapi import FastAPI
from fastapi.testclient import TestClient
from backend.routers.doctors import router
from backend import provider_specialties as specialties
from backend.provider_portraits import portrait_for


def provider(npi="1234567890", code="207Q00000X", primary=True):
    return {
        "number": npi,
        "basic": {"first_name": "Test", "last_name": "Doctor", "gender": "F"},
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
                "code": code,
                "desc": specialties.TAXONOMIES.get(code, "Unrelated specialty"),
                "primary": primary,
            }
        ],
    }


class ProviderSearchTests(unittest.TestCase):
    def setUp(self):
        app = FastAPI()
        app.include_router(router, prefix="/doctors")
        self.client = TestClient(app)
        self.addCleanup(self.client.close)

    def test_all_queries_six_classifications_and_excludes_unrelated_primary(self):
        secondary = provider("2222222222", "207RP1001X", False)
        secondary["taxonomies"].insert(
            0, {"code": "207N00000X", "desc": "Dermatology", "primary": True}
        )
        responses = [provider(), provider("1111111111", "207N00000X"), secondary]

        def fetch(url, params, **kwargs):
            response = Mock()
            response.json.return_value = {"results": responses}
            return response

        with patch.object(specialties.httpx, "get", side_effect=fetch) as get:
            result = self.client.get(
                "/doctors/search",
                params={"city": "Test", "state": "TX", "specialty_group": "all"},
            )
        self.assertEqual(result.status_code, 200, result.text)
        doctors = result.json()["doctors"]
        self.assertEqual([d["npi"] for d in doctors], ["1234567890", "2222222222"])
        self.assertEqual(doctors[1]["matched_specialty"], "Pulmonary Disease")
        self.assertFalse(doctors[1]["matched_specialty_is_primary"])
        self.assertEqual(doctors[1]["specialty"], "Dermatology")
        self.assertEqual(get.call_count, 6)
        self.assertEqual(
            {
                call.kwargs["params"]["taxonomy_description"]
                for call in get.call_args_list
            },
            set(specialties.TAXONOMIES.values()),
        )
        self.assertFalse(result.json()["search_incomplete"])

    def test_primary_care_and_individual_groups(self):
        for group, codes in specialties.GROUPS.items():
            results = [
                provider(str(index).zfill(10), code)
                for index, code in enumerate(specialties.TAXONOMIES)
            ]
            with patch.object(specialties, "lookup", return_value=results) as lookup:
                result = self.client.get(
                    "/doctors/search", params={"specialty_group": group}
                )
            self.assertEqual(result.status_code, 200)
            self.assertEqual(len(result.json()["doctors"]), len(codes))
            self.assertEqual(lookup.call_count, len(codes))

    def test_partial_and_total_failures(self):
        def lookup(params):
            if params["taxonomy_description"] == "Family Medicine":
                return [provider()]
            raise httpx.ReadTimeout("private directory error")

        with patch.object(specialties, "lookup", side_effect=lookup):
            result = self.client.get("/doctors/search?specialty_group=all")
            self.assertEqual(result.status_code, 200)
            self.assertTrue(result.json()["search_incomplete"])
        with patch.object(
            specialties, "lookup", side_effect=httpx.ReadTimeout("private")
        ):
            result = self.client.get("/doctors/search?specialty_group=all")
            self.assertEqual(result.status_code, 502)
            self.assertNotIn("private", result.text)

    def test_lookup_timeout_returns_completed_results(self):
        good, pending = Mock(), Mock()
        good.result.return_value = [provider()]
        with (
            patch.object(
                specialties._pool, "submit", side_effect=[good, pending, pending]
            ),
            patch.object(specialties, "wait", return_value=({good}, {pending})) as wait,
        ):
            records, partial, succeeded = specialties.search_group({}, "primary_care")
        self.assertEqual(len(records), 1)
        self.assertTrue(partial)
        self.assertEqual(succeeded, 1)
        self.assertEqual(wait.call_args.kwargs["timeout"], 13)
        pending.cancel.assert_called()

    def test_distance_sort_happens_before_limit(self):
        records = [provider(str(i).zfill(10)) for i in range(5)]

        def distance(doctors, origin):
            self.assertEqual(len(doctors), 5)
            for item in doctors:
                item["distance_miles"] = 5 - int(item["npi"])
            doctors.sort(key=lambda d: d["distance_miles"])
            return False

        with (
            patch.object(specialties, "lookup", return_value=records),
            patch("backend.routers.doctors.add_distances", side_effect=distance),
        ):
            result = self.client.get(
                "/doctors/search?specialty_group=all&latitude=0&longitude=0&limit=2"
            )
        self.assertEqual(result.status_code, 200)
        self.assertEqual(
            [d["npi"] for d in result.json()["doctors"]], ["0000000004", "0000000003"]
        )

    def test_legacy_callers_and_invalid_group(self):
        response = Mock()
        response.json.return_value = {"results": [provider(code="207N00000X")]}
        with patch("backend.routers.doctors.httpx.get", return_value=response) as get:
            result = self.client.get("/doctors/search?specialty=Dermatology")
            self.assertEqual(result.status_code, 200)
            self.assertEqual(len(result.json()["doctors"]), 1)
            self.assertEqual(
                get.call_args.kwargs["params"]["taxonomy_description"], "Dermatology"
            )
        for query in (
            "specialty_group=bad",
            "specialty_group=all&specialty=Dermatology",
        ):
            self.assertEqual(
                self.client.get("/doctors/search?" + query).status_code, 422
            )

    def test_portrait_requires_matching_identity(self):
        doctor = {
            "npi": "1669777850",
            "first_name": "MARIA RENELA",
            "last_name": "SULLER",
        }
        result = portrait_for(doctor)
        self.assertTrue(result["portrait_url"].endswith("1669777850"))
        self.assertTrue(
            result["portrait_source_url"].startswith("https://www.bswhealth.com/")
        )
        self.assertIn("Baylor Scott", result["portrait_attribution"])
        self.assertEqual(portrait_for({**doctor, "npi": "9999999999"}), {})
        self.assertEqual(portrait_for({**doctor, "last_name": "Another person"}), {})
