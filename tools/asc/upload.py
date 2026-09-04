#!/usr/bin/env python3
"""Validate and optionally upload an IPA, checking altool's JSON errors."""
from __future__ import annotations

import json
import pathlib
import subprocess
import sys
import tempfile
import zipfile

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import client  # noqa: E402


def plist_from_ipa(path: pathlib.Path) -> dict:
    with zipfile.ZipFile(path) as archive:
        name = next(name for name in archive.namelist() if name.startswith("Payload/") and name.endswith(".app/Info.plist") and name.count("/") == 2)
        with tempfile.NamedTemporaryFile(suffix=".plist") as source:
            source.write(archive.read(name)); source.flush()
            result = subprocess.run(["plutil", "-convert", "json", "-o", "-", source.name], capture_output=True, check=True)
            return json.loads(result.stdout)


def run_altool(arguments: list[str]) -> None:
    result = subprocess.run(["xcrun", "altool", *arguments, "--output-format", "json"], capture_output=True, text=True)
    raw = result.stdout.strip() or result.stderr.strip()
    try: document = json.loads(raw)
    except ValueError: document = {}
    errors = document.get("product-errors", [])
    if result.returncode or errors:
        raise SystemExit(raw or f"altool exited {result.returncode}")
    print(document.get("success-message", "altool succeeded"))


def main() -> int:
    ipa = pathlib.Path(sys.argv[1])
    upload = "--upload" in sys.argv
    info = plist_from_ipa(ipa)
    bundle = info["CFBundleIdentifier"]
    app = client.app_id(bundle)
    if not app: raise SystemExit("the App Store Connect app record does not exist yet")
    common = ["--type", "ios", "--apple-id", app, "--bundle-id", bundle,
              "--bundle-short-version-string", info["CFBundleShortVersionString"],
              "--bundle-version", info["CFBundleVersion"], "--api-key", client.required("ASC_KEY_ID"),
              "--api-issuer", client.required("ASC_ISSUER_ID")]
    run_altool(["--validate-app", "-f", str(ipa), *common])
    if upload: run_altool(["--upload-package", str(ipa), *common])
    else: print("validated; not uploaded")
    return 0


if __name__ == "__main__": raise SystemExit(main())
