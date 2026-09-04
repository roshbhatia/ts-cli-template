#!/usr/bin/env bash
set -euo pipefail

tag="${GITHUB_REF_NAME:-${1:-}}"
version="$(jq -r .version package.json)"

if [ -z "${tag}" ]; then
  echo "ERROR: pass a release tag or set GITHUB_REF_NAME" >&2
  exit 2
fi

if [ "${tag}" != "v${version}" ]; then
  echo "ERROR: tag ${tag} does not match package version v${version}" >&2
  exit 1
fi
