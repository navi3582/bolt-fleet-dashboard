#!/usr/bin/env python3
"""
sniff_api.py — Open Bolt admin panel in a real browser, watch ALL network
requests while you filter vehicles by status, then print a tidy summary.

Usage:
  python3 sniff_api.py

The script will:
  1. Launch Chromium with a persistent profile so you stay logged in.
  2. Navigate to the vehicles list page.
  3. Record every request/response for 90 seconds while you click around.
  4. Print a deduped summary of endpoints, payloads, and response shapes.
  5. Save full log to sniff_log.json.
"""

import json, time, re
from pathlib import Path
from playwright.sync_api import sync_playwright

TARGET_URL  = "https://admin-panel.bolt.eu/rentals-carsharing/vehicles/list"
PROFILE_DIR = str(Path.home() / "Library/Application Support/BoltFleetSniff")
CAPTURE_SEC = 90   # seconds to record after page load

# ── helpers ──────────────────────────────────────────────────────────────────

def is_api(url: str) -> bool:
    return "bolt.eu/backend" in url or "bolt.eu/api" in url or "bolt.eu/v" in url

def clean_url(url: str) -> str:
    return url.split("?")[0]

def try_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        return None

def shape(obj, depth=0):
    """Return a compact schema description of a JSON value."""
    if depth > 3:
        return "..."
    if isinstance(obj, dict):
        return {k: shape(v, depth+1) for k, v in list(obj.items())[:12]}
    if isinstance(obj, list):
        if not obj:
            return "[]"
        return [shape(obj[0], depth+1), f"…({len(obj)} items)"]
    if isinstance(obj, str) and len(obj) > 60:
        return f"str({len(obj)})"
    return type(obj).__name__

# ── main ─────────────────────────────────────────────────────────────────────

def run():
    calls: list[dict] = []
    auth_token: str | None = None

    def on_request(req):
        if not is_api(req.url):
            return
        entry = {
            "time":    time.strftime("%H:%M:%S"),
            "method":  req.method,
            "url":     req.url,
            "base":    clean_url(req.url),
            "headers": dict(req.headers),
            "body":    try_json(req.post_data or ""),
        }
        calls.append(entry)

    def on_response(resp):
        if not is_api(resp.url):
            return
        for entry in reversed(calls):
            if entry["url"] == resp.url and "status" not in entry:
                entry["status"] = resp.status
                try:
                    body = try_json(resp.body().decode("utf-8", errors="ignore"))
                    entry["response_shape"] = shape(body)
                    entry["response_total_rows"] = (
                        body.get("data", {}).get("pages", {}).get("total_rows")
                        if isinstance(body, dict) else None
                    )
                except Exception:
                    pass
                break

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            PROFILE_DIR,
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
            viewport={"width": 1280, "height": 900},
        )
        page = browser.pages[0] if browser.pages else browser.new_page()

        page.on("request",  on_request)
        page.on("response", on_response)

        print(f"\n→ Opening {TARGET_URL}")
        print(f"  You have {CAPTURE_SEC}s — click status filters, search, sort, etc.")
        print("  Close the browser any time to end early.\n")

        try:
            page.goto(TARGET_URL, wait_until="domcontentloaded", timeout=30_000)
        except Exception as e:
            print(f"  (navigation note: {e})")

        deadline = time.time() + CAPTURE_SEC
        while time.time() < deadline:
            try:
                page.wait_for_timeout(1000)
                remaining = int(deadline - time.time())
                print(f"\r  Recording… {remaining:3d}s left  ({len(calls)} API calls captured)", end="", flush=True)
            except Exception:
                break   # browser was closed

        print("\n\n═══ CAPTURED API CALLS ═══\n")

        # ── extract bearer token from any request ─────────────────────────
        for c in calls:
            auth = c["headers"].get("authorization", "")
            if auth.lower().startswith("bearer "):
                auth_token = auth[7:]
                break

        # ── dedupe by (method, base_url) and print summary ────────────────
        seen: dict[str, dict] = {}
        for c in calls:
            key = f"{c['method']} {c['base']}"
            if key not in seen:
                seen[key] = c

        for key, c in seen.items():
            print(f"  {c['method']:6s}  {c['base']}")
            if c.get("body"):
                print(f"          payload: {json.dumps(c['body'], separators=(',',':'))[:200]}")
            if c.get("response_shape"):
                print(f"          response shape: {json.dumps(c['response_shape'])[:200]}")
            if c.get("response_total_rows") is not None:
                print(f"          total_rows: {c['response_total_rows']}")
            print()

        # ── save full log ─────────────────────────────────────────────────
        log_path = Path(__file__).parent / "sniff_log.json"
        log_path.write_text(json.dumps({"token": auth_token, "calls": calls}, indent=2))
        print(f"Full log saved → {log_path}")

        if auth_token:
            print(f"\nBearer token captured: {auth_token[:40]}…")
            tok_path = Path(__file__).parent / ".captured_token"
            tok_path.write_text(auth_token)
            print(f"Token also saved to   → {tok_path}\n")

        browser.close()

if __name__ == "__main__":
    run()
