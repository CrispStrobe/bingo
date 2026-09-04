#!/usr/bin/env python3
"""Validate and optionally upload an IPA, checking altool's JSON errors."""
from __future__ import annotations

import base64
import json
import os
import pathlib
import re
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


def install_api_key() -> pathlib.Path:
    """Put the API key where altool requires it, without logging its ID or body."""
    key_id = client.required("ASC_KEY_ID")
    if not re.fullmatch(r"[A-Za-z0-9]+", key_id):
        raise SystemExit("ASC_KEY_ID has an invalid format")
    try:
        body = base64.b64decode(client.required("ASC_API_KEY_P8_BASE64"), validate=True)
    except (ValueError, base64.binascii.Error) as error:
        raise SystemExit("ASC_API_KEY_P8_BASE64 is not valid base64") from error
    if b"BEGIN PRIVATE KEY" not in body:
        raise SystemExit("ASC_API_KEY_P8_BASE64 does not contain a private key")

    directory = pathlib.Path.home() / ".appstoreconnect" / "private_keys"
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    key_path = directory / f"AuthKey_{key_id}.p8"
    key_path.write_bytes(body)
    os.chmod(key_path, 0o600)
    return key_path


def main() -> int:
    ipa = pathlib.Path(sys.argv[1])
    upload = "--upload" in sys.argv
    info = plist_from_ipa(ipa)
    bundle = info["CFBundleIdentifier"]
    app = client.app_id(bundle)
    if not app: raise SystemExit("the App Store Connect app record does not exist yet")
    key_id = client.required("ASC_KEY_ID")
    common = ["--type", "ios", "--apple-id", app, "--bundle-id", bundle,
              "--bundle-short-version-string", info["CFBundleShortVersionString"],
              "--bundle-version", info["CFBundleVersion"], "--api-key", key_id,
              "--api-issuer", client.required("ASC_ISSUER_ID")]
    key_path = install_api_key()
    try:
        run_altool(["--validate-app", "-f", str(ipa), *common])
        if upload: run_altool(["--upload-package", str(ipa), *common])
        else: print("validated; not uploaded")
    finally:
        key_path.unlink(missing_ok=True)
    return 0


if __name__ == "__main__": raise SystemExit(main())
