"""Capture documentation screenshots of the Papilio Loader web UI.

Starts the Papilio Loader server (from the papilio-loader-mcp repo), navigates
each web UI page with Playwright, and saves consistent PNG screenshots into
the Docusaurus static image folder.

Rerun this script any time the loader UI changes to regenerate all screenshots.

Usage:
    python capture_loader_screenshots.py                 # start server, capture all
    python capture_loader_screenshots.py --url http://localhost:8000   # use running server

Requirements:
    pip install playwright requests
    playwright install chromium
"""

import argparse
import os
import subprocess
import sys
import time
from pathlib import Path

import requests
from playwright.sync_api import sync_playwright

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_LOADER_REPO = Path(r"C:\development\papilio-loader-mcp")
DEFAULT_OUT_DIR = SCRIPT_DIR.parent.parent / "docs-src" / "static" / "img" / "papilio-loader"

VIEWPORT = {"width": 1280, "height": 800}
SERVER_PORT = 8123  # non-default port so we don't collide with a real running loader
USERNAME = "admin"
PASSWORD = "admin"


def find_server_python(loader_repo: Path) -> str:
    """Prefer the loader repo's venv python, fall back to current interpreter."""
    venv_python = loader_repo / ".venv" / "Scripts" / "python.exe"
    if venv_python.exists():
        return str(venv_python)
    return sys.executable


def start_server(loader_repo: Path) -> subprocess.Popen:
    """Start the Papilio Loader API server with web auth enabled (so the login
    page is reachable for screenshots)."""
    env = os.environ.copy()
    env.update(
        {
            "PAPILIO_BIND_ADDRESS": "127.0.0.1",
            "PAPILIO_PORT": str(SERVER_PORT),
            "PAPILIO_REQUIRE_WEB_AUTH": "true",
            "PAPILIO_WEB_USERNAME": USERNAME,
            "PAPILIO_WEB_PASSWORD": PASSWORD,
        }
    )
    python = find_server_python(loader_repo)
    print(f"Starting Papilio Loader server: {python} -m papilio_loader_mcp.api")
    proc = subprocess.Popen(
        [python, "-m", "papilio_loader_mcp.api"],
        cwd=str(loader_repo),
        env=env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return proc


def wait_for_server(base_url: str, timeout: float = 30.0) -> None:
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            r = requests.get(f"{base_url}/health", timeout=2)
            if r.ok:
                print(f"Server ready at {base_url}")
                return
        except requests.RequestException:
            pass
        time.sleep(0.5)
    raise RuntimeError(f"Papilio Loader server did not become ready at {base_url}")


def capture(base_url: str, out_dir: Path) -> list[Path]:
    out_dir.mkdir(parents=True, exist_ok=True)
    saved: list[Path] = []

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT)

        def shot(name: str) -> None:
            path = out_dir / f"{name}.png"
            page.screenshot(path=str(path), full_page=True)
            saved.append(path)
            print(f"  captured {path.name}")

        # 1. Login page
        page.goto(f"{base_url}/web/login", wait_until="networkidle")
        if "/web/login" in page.url:
            shot("login")
            # Log in through the UI so the session cookie is set
            page.fill("#username", USERNAME)
            page.fill("#password", PASSWORD)
            page.click("#loginForm button[type=submit], #loginForm button")
            page.wait_for_url("**/web/upload", timeout=10000)
        else:
            print("  auth disabled on this server - skipping login page")

        # 2. Upload (main flashing) page
        page.goto(f"{base_url}/web/upload", wait_until="networkidle")
        shot("upload")

        # 3. WiFi log page (streams SSE, so networkidle never fires)
        page.goto(f"{base_url}/web/wifi-log", wait_until="domcontentloaded")
        page.wait_for_timeout(1500)  # let the page render
        shot("wifi-log")

        browser.close()

    return saved


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--url",
        help="Base URL of an already-running loader server (skips auto-start)",
    )
    parser.add_argument(
        "--loader-repo",
        type=Path,
        default=DEFAULT_LOADER_REPO,
        help=f"Path to the papilio-loader-mcp repo (default: {DEFAULT_LOADER_REPO})",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=DEFAULT_OUT_DIR,
        help=f"Output directory for screenshots (default: {DEFAULT_OUT_DIR})",
    )
    args = parser.parse_args()

    proc = None
    if args.url:
        base_url = args.url.rstrip("/")
    else:
        base_url = f"http://127.0.0.1:{SERVER_PORT}"
        proc = start_server(args.loader_repo)

    try:
        wait_for_server(base_url)
        saved = capture(base_url, args.out)
    finally:
        if proc is not None:
            proc.terminate()
            try:
                proc.wait(timeout=5)
            except subprocess.TimeoutExpired:
                proc.kill()

    print(f"\nDone - {len(saved)} screenshots in {args.out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
