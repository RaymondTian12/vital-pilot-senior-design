"""Read-only check for the report API used by the deployed mobile branch."""

import argparse
import json
from urllib.request import urlopen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    parser.add_argument("--require-consent", action="store_true")
    args = parser.parse_args()
    try:
        with urlopen(
            args.base_url.rstrip("/") + "/openapi.json", timeout=60
        ) as response:
            schema = json.load(response)
    except Exception as error:
        print(f"Cannot read the API schema ({type(error).__name__}).")
        return 1
    paths = schema.get("paths", {})
    expected = [
        "/reports/generate",
        "/reports/history",
        "/reports/{report_id}/preview",
        "/reports/{report_id}/download",
    ]
    missing = [route for route in expected if "get" not in paths.get(route, {})]
    if args.require_consent:
        if "get" not in paths.get("/reports/capabilities", {}):
            missing.append("/reports/capabilities")
        params = {
            parameter["name"]
            for parameter in paths.get("/reports/generate", {})
            .get("get", {})
            .get("parameters", [])
        }
        missing.extend(
            f"generation parameter: {name}"
            for name in ("include_ai", "ai_consent")
            if name not in params
        )
    if missing:
        print("Missing API support:\n" + "\n".join(missing))
        return 1
    print("Report routes match the deployed mobile implementation.")
    print("Authenticated generation, preview and download tests are still required.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
