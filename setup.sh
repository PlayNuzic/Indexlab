#!/usr/bin/env bash
set -euxo pipefail

# Permet saltar la instal·lació de paquets de sistema amb SKIP_APT=1
: "${SKIP_APT:=}"

# 0. Instal·lació d’eines de base (molt lleugera)
if [[ -z "$SKIP_APT" ]]; then
  if ! (apt-get update -qq && apt-get install -yqq git curl jq make bash-completion); then
    echo "Avis: apt-get ha fallat; continuem sense paquets de sistema" >&2
  fi
else
  echo "SKIP_APT establert; s'omet la instal·lació de paquets de sistema" >&2
fi

# 1. Config Git amb nom+mail genèrics
git config --global user.name  "PlayNuzic-Codex"
git config --global user.email "codex@playnuzic.local"

# Comprova que GITHUB_TOKEN estigui definit
if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Error: GITHUB_TOKEN environment variable is not set." >&2
  exit 1
fi

# 2. Deixa ‘origin’ apuntant a HTTPS amb PAT
REMOTE_URL="$(git config --get remote.origin.url || true)"
if [[ -z "$REMOTE_URL" ]]; then
  REPO_PATH=$(basename "$(pwd)")
  # substitueix un PAT antic per GITHUB_TOKEN nou
  REMOTE_URL="${REMOTE_URL/https:\/\/ghp_[A-Za-z0-9]*/https:\/\/${GITHUB_TOKEN}}"
  git remote add origin "$REMOTE_URL"
else
  # substitueix token vell (si n’hi havia) pel nou
  REMOTE_URL="${REMOTE_URL/https:\/\/ghp_[A-Za-z0-9]*/https://${GITHUB_TOKEN}}"
  git remote set-url origin "$REMOTE_URL"
fi

# 3. Habilita yarn/pnpm sense baixar-los
corepack enable

# 4. Instal·la les dependències de Node (inclòs Jest) abans que es talli la xarxa
npm ci --ignore-scripts --no-audit --progress=false
npm ls chromatone-theory >/dev/null || true
npx --yes jest --version >/dev/null || true

echo "✅ Entorn preparat. Pots fer git add / commit / push (HTTPS amb PAT)."
