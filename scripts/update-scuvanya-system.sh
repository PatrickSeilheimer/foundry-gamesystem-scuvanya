#!/usr/bin/env bash
#
# Lädt die aktuelle Version von foundry-gamesystem-scuvanya von GitHub herunter
# und installiert sie als Foundry-System "Scuvanya".
#
# Usage: ./update-scuvanya-system.sh
#
# Optional per Umgebungsvariable überschreibbar:
#   FOUNDRY_DATA_DIR  Pfad zum Foundry-Datenordner (Standard: ~/foundry/foundrydata)
#   REPO_BRANCH       Branch/Tag, der heruntergeladen wird (Standard: main)

set -euo pipefail

REPO_OWNER="PatrickSeilheimer"
REPO_NAME="foundry-gamesystem-scuvanya"
REPO_BRANCH="${REPO_BRANCH:-main}"
FOUNDRY_DATA_DIR="${FOUNDRY_DATA_DIR:-$HOME/foundry/foundrydata}"
SYSTEMS_DIR="${FOUNDRY_DATA_DIR}/Data/systems"
TARGET_NAME="Scuvanya"
TARGET_DIR="${SYSTEMS_DIR}/${TARGET_NAME}"

TARBALL_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/refs/heads/${REPO_BRANCH}.tar.gz"

if [[ ! -d "${SYSTEMS_DIR}" ]]; then
  echo "Fehler: Systems-Ordner nicht gefunden: ${SYSTEMS_DIR}" >&2
  echo "Prüfe FOUNDRY_DATA_DIR (aktuell: ${FOUNDRY_DATA_DIR})." >&2
  exit 1
fi

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "${WORK_DIR}"' EXIT

echo "Lade ${REPO_NAME} (${REPO_BRANCH}) herunter..."
curl -fsSL "${TARBALL_URL}" -o "${WORK_DIR}/repo.tar.gz"

echo "Entpacke Archiv..."
tar -xzf "${WORK_DIR}/repo.tar.gz" -C "${WORK_DIR}"

EXTRACTED_DIR="$(find "${WORK_DIR}" -mindepth 1 -maxdepth 1 -type d -name "${REPO_NAME}-*")"
if [[ -z "${EXTRACTED_DIR}" ]]; then
  echo "Fehler: Entpackter Ordner wurde nicht gefunden." >&2
  exit 1
fi

echo "Ersetze ${TARGET_DIR}..."
rm -rf "${TARGET_DIR}"
mv "${EXTRACTED_DIR}" "${TARGET_DIR}"

echo "Fertig. Scuvanya-System liegt jetzt unter: ${TARGET_DIR}"
