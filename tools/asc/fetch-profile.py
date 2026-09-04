#!/usr/bin/env python3
"""Fetch one active provisioning profile by name."""
import base64
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import client  # noqa: E402

name, destination = sys.argv[1], pathlib.Path(sys.argv[2])
matches = [item for item in client.paged("/v1/profiles?limit=200") if item["attributes"]["name"] == name]
if len(matches) != 1 or matches[0]["attributes"]["profileState"] != "ACTIVE":
    raise SystemExit(f"expected one active profile named {name!r}")
destination.write_bytes(base64.b64decode(matches[0]["attributes"]["profileContent"]))
print(f"fetched active profile {name!r}")
