#!/usr/bin/env bash
# Reproducible manual-signing iOS archive. It never creates certificates or
# changes capabilities; those operations can invalidate other apps' profiles.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TAURI="$ROOT/src-tauri"
GEN="$TAURI/gen/apple"
TEAM_ID="${ASC_TEAM_ID:?ASC_TEAM_ID is required}"
PROFILE_NAME="${IOS_PROFILE_NAME:?IOS_PROFILE_NAME is required}"
BUNDLE_ID="$(node -e "console.log(require('$TAURI/tauri.conf.json').identifier)")"

security find-identity -v -p codesigning | grep -F "Apple Distribution" >/dev/null \
  || { echo "Apple Distribution identity is missing"; exit 1; }

PROFILE="$RUNNER_TEMP/bingo.mobileprovision"
if [ -n "${ASC_PROFILE_BASE64:-}" ]; then
  printf %s "$ASC_PROFILE_BASE64" | base64 -d > "$PROFILE"
else
  python3 "$ROOT/tools/asc/fetch-profile.py" "$PROFILE_NAME" "$PROFILE"
fi
PROFILE_PLIST="$RUNNER_TEMP/bingo-profile.plist"
security cms -D -i "$PROFILE" > "$PROFILE_PLIST"
UUID="$(plutil -extract UUID raw -o - "$PROFILE_PLIST")"
PROFILE_DIR="$HOME/Library/MobileDevice/Provisioning Profiles"
mkdir -p "$PROFILE_DIR"
cp "$PROFILE" "$PROFILE_DIR/$UUID.mobileprovision"

# Tauri preserves generated project.yml, so a clean regeneration is required
# for config, icons and minimum OS changes to take effect.
rm -rf "$GEN"
cd "$ROOT"
npx tauri ios init --ci
node scripts/patch-ios-privacy.mjs
(cd "$GEN" && xcodegen generate >/dev/null)
python3 tools/ios/patch-signing.py "$TEAM_ID" "$PROFILE_NAME"

# Tauri's export omits the manual profile mapping. Its archive is valid, so
# allow that export to fail and perform the explicit export below.
set +e
npx tauri ios build --export-method app-store-connect
set -e
ARCHIVE="$(find "$GEN/build" -maxdepth 1 -name '*.xcarchive' | head -1)"
[ -d "$ARCHIVE/Products/Applications" ] || { echo "no complete iOS archive produced"; exit 1; }

EXPORT="$GEN/build/export"
rm -rf "$EXPORT"
cat > "$GEN/build/ExportOptions.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>export</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>manual</string>
  <key>signingCertificate</key><string>Apple Distribution</string>
  <key>provisioningProfiles</key><dict><key>$BUNDLE_ID</key><string>$PROFILE_NAME</string></dict>
  <key>uploadSymbols</key><true/>
</dict></plist>
PLIST
PATH="/usr/bin:$PATH" xcodebuild -exportArchive -archivePath "$ARCHIVE" \
  -exportPath "$EXPORT" -exportOptionsPlist "$GEN/build/ExportOptions.plist"

IPA="$(find "$EXPORT" -name '*.ipa' | head -1)"
[ -f "$IPA" ] || { echo "no IPA produced"; exit 1; }
VERIFY="$(mktemp -d)"
unzip -q "$IPA" -d "$VERIFY"
APP="$(find "$VERIFY/Payload" -maxdepth 1 -name '*.app' | head -1)"
codesign --verify --deep --strict --verbose=2 "$APP"
[ -f "$APP/PrivacyInfo.xcprivacy" ] || { echo "privacy manifest missing from bundle root"; exit 1; }
[ -f "$APP/embedded.mobileprovision" ] || { echo "provisioning profile missing"; exit 1; }
MIN_OS="$(/usr/libexec/PlistBuddy -c 'Print :MinimumOSVersion' "$APP/Info.plist")"
[ "${MIN_OS%%.*}" -ge 15 ] || { echo "MinimumOSVersion $MIN_OS is below 15"; exit 1; }
rm -rf "$VERIFY"
echo "$IPA"
