"""Read-only deployment contract check; never sends credentials or health data."""

import argparse
import json
from urllib.parse import urlparse
from urllib.request import urlopen


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("base_url")
    args = parser.parse_args()
    base = args.base_url.rstrip("/")
    if urlparse(base).scheme not in ("http", "https"):
        parser.error("Supply an HTTP(S) backend URL")
    try:
        with urlopen(f"{base}/openapi.json", timeout=60) as response:
            schema = json.load(response)
    except Exception as error:
        print(f"Could not read deployed API schema: {type(error).__name__}")
        return 1
    required = {
        "/reports": ("get", "post"),
        "/reports/capabilities": ("get",),
        "/reports/{report_id}/pdf": ("get",),
        "/chat/conversations": ("get",),
        "/chat/conversations/{conversation_id}/messages": ("get",),
    }
    missing = []
    for route, methods in required.items():
        for method in methods:
            if method not in schema.get("paths", {}).get(route, {}):
                missing.append(f"{method.upper()} {route}")
    if missing:
        print("Mobile API mismatch. Missing endpoints:")
        print("\n".join(f"  {route}" for route in missing))
        print("Deploy the reconciled backend before testing the release build.")
        return 1
    print("Mobile report and chat-history routes are present.")
    print(
        "Authenticated testing is still required to verify database migrations and PDF persistence."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
