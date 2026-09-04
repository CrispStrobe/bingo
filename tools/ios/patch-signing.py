#!/usr/bin/env python3
"""Apply manual distribution signing to Tauri's generated iOS project."""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
GEN = ROOT / "src-tauri" / "gen" / "apple"


def main() -> int:
    if len(sys.argv) != 3:
        raise SystemExit("usage: patch-signing.py <team-id> <profile-name>")
    team, profile = sys.argv[1:]
    projects = sorted(GEN.glob("*.xcodeproj"))
    if not projects:
        raise SystemExit(f"no Xcode project under {GEN}")
    project = projects[0] / "project.pbxproj"
    text = project.read_text()
    for key in ("CODE_SIGN_IDENTITY", "CODE_SIGN_STYLE", "DEVELOPMENT_TEAM", "PROVISIONING_PROFILE_SPECIFIER"):
        text = re.sub(rf"^\s*{key}(\[sdk=[^\]]*\])? = .*\n", "", text, flags=re.MULTILINE)
    settings = (
        '\t\t\t\tCODE_SIGN_IDENTITY = "Apple Distribution";\n'
        "\t\t\t\tCODE_SIGN_STYLE = Manual;\n"
        f"\t\t\t\tDEVELOPMENT_TEAM = {team};\n"
        f'\t\t\t\tPROVISIONING_PROFILE_SPECIFIER = "{profile}";\n'
    )
    text, count = re.subn(r"(buildSettings = \{\n)", r"\1" + settings, text)
    if not count:
        raise SystemExit("no Xcode buildSettings blocks found")
    project.write_text(text)
    print(f"manual signing applied to {count} buildSettings blocks")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
