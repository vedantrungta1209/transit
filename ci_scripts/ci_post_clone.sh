#!/bin/sh
# Xcode Cloud CI script — runs from the repository root after git clone.
# Xcode Cloud automatically runs pod install after this script completes.
set -e

echo "=== Transit ci_post_clone.sh ==="
echo "Bundle ID : ${CI_BUNDLE_ID}"
echo "Workflow  : ${CI_WORKFLOW}"
echo "Node      : $(node --version 2>/dev/null || echo 'not found')"

# ── Ensure Node 20 is available ──────────────────────────────────────────────
if ! node --version 2>/dev/null | grep -q "^v20\."; then
  echo "Node 20 not found — installing via Homebrew..."
  brew install node@20
  export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
  echo "Node after install: $(node --version)"
fi

# ── Install monorepo dependencies ────────────────────────────────────────────
echo "Running npm install..."
npm install --legacy-peer-deps

# ── Determine which app to prebuild ──────────────────────────────────────────
case "${CI_BUNDLE_ID}" in
  in.transitco.customer)
    APP_DIR="apps/customer-app"
    ;;
  in.transitco.driver)
    APP_DIR="apps/driver-app"
    ;;
  *)
    echo "ERROR: Unknown CI_BUNDLE_ID '${CI_BUNDLE_ID}' — cannot determine app directory."
    exit 1
    ;;
esac

# ── Regenerate ios/ from app.json + plugins ───────────────────────────────────
# --clean wipes any stale state; withIosPodfilePatches plugin runs here and
# patches .xcode.env, react_native_pods.rb, and the Podfile.
# Xcode Cloud then picks up the patched Podfile for its automatic pod install.
echo "Running expo prebuild for ${APP_DIR}..."
cd "${APP_DIR}"
npx expo prebuild --platform ios --clean --non-interactive

echo "=== ci_post_clone.sh complete ==="
