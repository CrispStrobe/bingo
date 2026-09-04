#!/usr/bin/env python3
"""Wait for the newest iOS build, configure external TestFlight and submit it."""
from __future__ import annotations

import json
import os
import pathlib
import sys
import time

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import client  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[2]
BUNDLE_ID = json.loads((ROOT / "src-tauri" / "tauri.conf.json").read_text())["identifier"]
LOCALIZATIONS = {
    "en-US": {
        "description": "CrispBingo brings 75-ball Bingo, 90-ball Bingo and Italian Tombola to one screen, printed tickets or local Wi-Fi. No accounts, adverts or tracking.",
        "whatsNew": "Please test La Tombola prize progression, six-ticket strips, family Smorfia calls, Italian localization, LAN joining, printing and QR claim verification.",
    },
    "de-DE": {
        "description": "CrispBingo bringt 75- und 90-Kugel-Bingo sowie italienische Tombola auf einen Bildschirm, gedruckte Scheine oder ins lokale WLAN. Ohne Konto, Werbung oder Tracking.",
        "whatsNew": "Bitte La Tombola mit Gewinnstufen, Sechserstreifen, Familien-Smorfia, italienischer Übersetzung, WLAN-Beitritt, Druck und QR-Gewinnprüfung testen.",
    },
    "it-IT": {
        "description": "CrispBingo porta Bingo a 75 e 90 palline e la Tombola italiana sullo stesso schermo, su cartelle stampate o tramite Wi-Fi locale. Senza account, pubblicità o tracciamento.",
        "whatsNew": "Prova La Tombola con tutti i premi, serie complete di sei cartelle, Smorfia per famiglie, gioco Wi-Fi, stampa e verifica delle vincite tramite QR.",
    },
}


def required(name: str) -> str:
    value = os.environ.get(name)
    if not value: raise SystemExit(f"missing required environment variable {name}")
    return value


def target_ios_build(app: str, marketing_version: str, bundle_version: str) -> dict | None:
    builds = client.paged(f"/v1/apps/{app}/builds?limit=50")
    builds.sort(key=lambda item: item["attributes"].get("uploadedDate", ""), reverse=True)
    for build in builds:
        if build["attributes"].get("version") != bundle_version:
            continue
        relation = client.expect("GET", f"/v1/builds/{build['id']}/preReleaseVersion")
        attributes = relation.get("data", {}).get("attributes", {})
        if attributes.get("platform") == "IOS" and attributes.get("version") == marketing_version:
            return build
    return None


def upsert_localization(app: str, build: dict) -> None:
    existing = {item["attributes"]["locale"]: item for item in client.paged(f"/v1/apps/{app}/betaAppLocalizations")}
    locations = {item["attributes"]["locale"]: item for item in client.paged(f"/v1/builds/{build['id']}/betaBuildLocalizations")}
    for locale, copy in LOCALIZATIONS.items():
        attributes = {
            "description": copy["description"],
            "feedbackEmail": required("ASC_REVIEW_EMAIL"),
            "privacyPolicyUrl": "https://crispstrobe.github.io/bingo/privacy.html",
        }
        if locale in existing:
            item = existing[locale]
            client.expect("PATCH", f"/v1/betaAppLocalizations/{item['id']}", {"data": {"type": "betaAppLocalizations", "id": item["id"], "attributes": attributes}})
        else:
            client.expect("POST", "/v1/betaAppLocalizations", {"data": {"type": "betaAppLocalizations", "attributes": {**attributes, "locale": locale}, "relationships": {"app": {"data": {"type": "apps", "id": app}}}}})
        if locale in locations:
            item = locations[locale]
            client.expect("PATCH", f"/v1/betaBuildLocalizations/{item['id']}", {"data": {"type": "betaBuildLocalizations", "id": item["id"], "attributes": {"whatsNew": copy["whatsNew"]}}})
        else:
            client.expect("POST", "/v1/betaBuildLocalizations", {"data": {"type": "betaBuildLocalizations", "attributes": {"locale": locale, "whatsNew": copy["whatsNew"]}, "relationships": {"build": {"data": {"type": "builds", "id": build["id"]}}}}})


def review_contact(app: str) -> None:
    detail = client.expect("GET", f"/v1/apps/{app}/betaAppReviewDetail")["data"]
    attributes = {
        "contactFirstName": required("ASC_REVIEW_FIRST_NAME"), "contactLastName": required("ASC_REVIEW_LAST_NAME"),
        "contactEmail": required("ASC_REVIEW_EMAIL"), "contactPhone": required("ASC_REVIEW_PHONE"),
        "demoAccountRequired": False,
        "notes": "No account is required. LAN hosting is optional; all game modes can be tested on one device.",
    }
    client.expect("PATCH", f"/v1/betaAppReviewDetails/{detail['id']}", {"data": {"type": "betaAppReviewDetails", "id": detail["id"], "attributes": attributes}})


def external_group(app: str) -> dict:
    name = "External Testers"
    groups = [item for item in client.paged(f"/v1/apps/{app}/betaGroups") if item["attributes"]["name"] == name]
    if groups: return groups[0]
    return client.expect("POST", "/v1/betaGroups", {"data": {"type": "betaGroups", "attributes": {"name": name, "isInternalGroup": False, "publicLinkEnabled": True}, "relationships": {"app": {"data": {"type": "apps", "id": app}}}}})["data"]


def main() -> int:
    app = client.app_id(BUNDLE_ID)
    if not app: raise SystemExit("App Store Connect app record is missing; create it in the browser first")
    marketing_version = required("TARGET_MARKETING_VERSION")
    bundle_version = required("TARGET_BUNDLE_VERSION")
    deadline = time.time() + 3600
    build = target_ios_build(app, marketing_version, bundle_version)
    while not build or build["attributes"]["processingState"] == "PROCESSING":
        if time.time() >= deadline: raise SystemExit("timed out waiting for Apple to process the build")
        print(f"waiting for iOS {marketing_version} ({bundle_version}) to process…", flush=True)
        time.sleep(60)
        build = target_ios_build(app, marketing_version, bundle_version)
    if build["attributes"]["processingState"] != "VALID": raise SystemExit(f"build is {build['attributes']['processingState']}, not VALID")
    client.expect("PATCH", f"/v1/builds/{build['id']}", {"data": {"type": "builds", "id": build["id"], "attributes": {"usesNonExemptEncryption": False}}})
    upsert_localization(app, build)
    review_contact(app)
    group = external_group(app)
    assigned = {item["id"] for item in client.paged(f"/v1/betaGroups/{group['id']}/builds")}
    if build["id"] not in assigned:
        client.expect("POST", f"/v1/betaGroups/{group['id']}/relationships/builds", {"data": [{"type": "builds", "id": build["id"]}]})
    assigned = {item["id"] for item in client.paged(f"/v1/betaGroups/{group['id']}/builds")}
    if build["id"] not in assigned:
        raise SystemExit("the processed build was not assigned to the external group")
    existing = client.paged(f"/v1/betaAppReviewSubmissions?filter%5Bbuild%5D={build['id']}")
    if not existing:
        client.expect("POST", "/v1/betaAppReviewSubmissions", {"data": {"type": "betaAppReviewSubmissions", "relationships": {"build": {"data": {"type": "builds", "id": build["id"]}}}}})
    refreshed = client.expect("GET", f"/v1/betaGroups/{group['id']}")["data"]
    print("external TestFlight submitted")
    if refreshed["attributes"].get("publicLink"): print(refreshed["attributes"]["publicLink"])
    return 0


if __name__ == "__main__": raise SystemExit(main())
