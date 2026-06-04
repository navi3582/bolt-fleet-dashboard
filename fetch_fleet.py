#!/usr/bin/env python3
"""
fetch_fleet.py — Fetch Berlin fleet counts directly via the Bolt admin API.
No browser needed.  Token is fetched from Apps Script (saved there by the
iOS Shortcut on iPad), or you can pass it as the first argument.

Usage:
  python3 fetch_fleet.py                       # fetches token from Apps Script
  python3 fetch_fleet.py <bearer_token>        # explicit token

Output: JSON to stdout + pretty table to stderr.
"""

import json, sys, time, urllib.request, urllib.error, urllib.parse
from pathlib import Path

# ── config ────────────────────────────────────────────────────────────────────

API_URL    = "https://admin-panel.bolt.eu/backend/rental-car-vehicle-fleet/adminPanel/vehicle/getList"
SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyAqFMhAyssm9sZ1RrB_hFPmlV_hJlfao1LSKu1ghlYXRxI4Q0nVKoesV39bnmcDphv/exec"
SECRET     = "BoltFleet-Berlin-2026"
CITY_ID    = 329   # Berlin

STATES = [
    ("hidden",            "Hidden"),
    ("in_service_shop",   "In Service Shop"),
    ("in_maintenance",    "In Maintenance"),
    ("lost",              "Lost"),
    ("deactivated",       "Deactivated"),
    ("waiting_for_order", "Waiting for Order"),
    ("reserved",          "Reserved"),
    ("on_trip",           "On Trip"),
]

HEADERS = {
    "Accept":          "application/json",
    "Content-Type":    "application/json",
    "Origin":          "https://admin-panel.bolt.eu",
    "Referer":         "https://admin-panel.bolt.eu/rentals-carsharing/vehicles/list",
    "User-Agent":      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
}

# ── helpers ───────────────────────────────────────────────────────────────────

def load_token() -> str:
    if len(sys.argv) > 1:
        return sys.argv[1].strip()

    # Try local cache first (faster)
    p = Path(__file__).parent / ".captured_token"
    if p.exists():
        return p.read_text().strip()

    # Fetch from Apps Script (saved there by iOS Shortcut on iPad)
    print("Fetching token from Apps Script…", file=sys.stderr)
    url = SCRIPT_URL + "?" + urllib.parse.urlencode({"action": "getToken", "secret": SECRET})
    with urllib.request.urlopen(url, timeout=15) as r:
        body = json.loads(r.read())
    if not body.get("success") or not body.get("token"):
        raise SystemExit("No token in Apps Script. Run the iOS Shortcut on iPad first.")
    token = body["token"]
    p.write_text(token)   # cache locally
    return token

def fetch_count(token: str, state_key: str) -> dict:
    payload = json.dumps({
        "filter": {
            "vehicle_states": [state_key],
            "city_ids": [CITY_ID],
        },
        "items_per_page": 1,
        "page_number": 0,
    }).encode()

    headers = {**HEADERS, "Authorization": f"Bearer {token}"}
    req = urllib.request.Request(API_URL, data=payload, headers=headers, method="POST")

    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            body = json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = json.loads(e.read())

    code = body.get("code")
    msg  = body.get("message", "")

    if code == 503 or msg == "NOT_AUTHORIZED":
        raise SystemExit("Token rejected (NOT_AUTHORIZED). Renew it with sniff_api.py.")

    total_rows = (
        body.get("data", {}).get("pages", {}).get("total_rows", 0)
        if isinstance(body.get("data"), dict) else 0
    )
    return {"count": total_rows, "raw": body}

# ── main ──────────────────────────────────────────────────────────────────────

def run():
    token = load_token()
    print(f"Token: {token[:30]}…\n", file=sys.stderr)

    results = {}
    total   = 0
    now     = time.strftime("%d.%m.%Y %H:%M", time.localtime())

    for key, label in STATES:
        r = fetch_count(token, key)
        n = r["count"]
        results[label] = n
        total += n
        bar = "█" * min(n // 5, 30)
        print(f"  {label:<22}  {n:>4}  {bar}", file=sys.stderr)

    results["Total"]     = total
    results["Timestamp"] = now

    print(f"\n  {'TOTAL':<22}  {total:>4}\n", file=sys.stderr)
    print(f"  Fetched at {now} (Berlin)\n", file=sys.stderr)

    # JSON output for piping / Apps Script integration
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    run()
