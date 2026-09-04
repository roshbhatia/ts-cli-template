#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "usage: $0 OWNER PROJECT [BINARY]" >&2
}

if [ "$#" -lt 2 ] || [ "$#" -gt 3 ]; then
  usage
  exit 2
fi

owner="$1"
project="$2"
binary="${3:-${project}}"

if ! printf '%s' "${owner}" | grep -Eq '^[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?$'; then
  echo "ERROR: OWNER must be a valid GitHub account name" >&2
  exit 2
fi

for value in "${project}" "${binary}"; do
  if ! printf '%s' "${value}" | grep -Eq '^[a-z][a-z0-9-]*$'; then
    echo "ERROR: project and binary names must use lowercase letters, digits, and hyphens" >&2
    exit 2
  fi
done

if ! grep -q '"initialized": false' template.json; then
  echo "ERROR: this template was already initialized" >&2
  exit 1
fi

while IFS= read -r -d '' file; do
  PROJECT_NAME="${project}" BINARY_NAME="${binary}" perl -0pi -e '
    s/ts-cli-template/__TS_CLI_TEMPLATE_PROJECT__/g;
    s/example/__TS_CLI_TEMPLATE_BINARY__/g;
    s/__TS_CLI_TEMPLATE_PROJECT__/$ENV{PROJECT_NAME}/g;
    s/__TS_CLI_TEMPLATE_BINARY__/$ENV{BINARY_NAME}/g;
  ' "${file}"
done < <(git grep -Ilz -e example -e ts-cli-template -- . ':!hack/init-template.sh')

PROJECT_NAME="${project}" BINARY_NAME="${binary}" perl -0pi -e '
  s/"name": "\Q$ENV{BINARY_NAME}\E"/"name": "$ENV{PROJECT_NAME}"/;
' package.json

HOMEBREW_OWNER="${owner}" perl -0pi -e '
  s/"homebrewOwner": "roshbhatia"/"homebrewOwner": "$ENV{HOMEBREW_OWNER}"/;
  s/"initialized": false/"initialized": true/;
' template.json

if [ "example" != "${binary}" ]; then
  git mv completions/example.bash "completions/${binary}.bash"
  git mv completions/example.fish "completions/${binary}.fish"
  git mv completions/example.nu "completions/${binary}.nu"
  git mv completions/_example "completions/_${binary}"
fi

bun install
bun run nix:lock
bun run generate

echo "Initialized ${owner}/${project} with binary ${binary}" >&2
