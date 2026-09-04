#!/usr/bin/env python3
"""Minimal App Store Connect client; all account values come from secrets."""
from __future__ import annotations

import base64
import json
import os
import time
import urllib.error
import urllib.request

BASE = "https://api.appstoreconnect.apple.com"


def required(name: str) -> str:
    value = os.environ.get(name)
    if not value:
        raise SystemExit(f"missing required environment variable {name}")
    return value


def token() -> str:
    from cryptography.hazmat.primitives import hashes, serialization
    from cryptography.hazmat.primitives.asymmetric import ec, utils

    encode = lambda value: base64.urlsafe_b64encode(value).rstrip(b"=").decode()
    key_id = required("ASC_KEY_ID")
    issuer = required("ASC_ISSUER_ID")
    pem = base64.b64decode(required("ASC_API_KEY_P8_BASE64"))
    key = serialization.load_pem_private_key(pem, password=None)
    now = int(time.time())
    header = encode(json.dumps({"alg": "ES256", "kid": key_id, "typ": "JWT"}, separators=(",", ":")).encode())
    payload = encode(json.dumps({"iss": issuer, "iat": now, "exp": now + 1190, "aud": "appstoreconnect-v1"}, separators=(",", ":")).encode())
    body = f"{header}.{payload}"
    r, s = utils.decode_dss_signature(key.sign(body.encode(), ec.ECDSA(hashes.SHA256())))
    return f"{body}.{encode(r.to_bytes(32, 'big') + s.to_bytes(32, 'big'))}"


def call(method: str, path: str, body: dict | None = None) -> tuple[int, dict]:
    data = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(BASE + path, data=data, method=method)
    request.add_header("Authorization", "Bearer " + token())
    if data: request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            raw = response.read()
            return response.status, json.loads(raw) if raw else {}
    except urllib.error.HTTPError as error:
        raw = error.read()
        return error.code, json.loads(raw) if raw else {}


def expect(method: str, path: str, body: dict | None = None, ok=(200, 201, 204)) -> dict:
    status, document = call(method, path, body)
    if status not in ok:
        details = "; ".join(error.get("detail", "") for error in document.get("errors", []))
        raise SystemExit(f"{method} {path} returned {status}: {details}")
    return document


def paged(path: str) -> list[dict]:
    result: list[dict] = []
    while path:
        document = expect("GET", path)
        result.extend(document.get("data", []))
        next_url = document.get("links", {}).get("next", "")
        path = next_url.removeprefix(BASE)
    return result


def app_id(bundle_id: str) -> str | None:
    return next((app["id"] for app in paged("/v1/apps?limit=200") if app["attributes"]["bundleId"] == bundle_id), None)
