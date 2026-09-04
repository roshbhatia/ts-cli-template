# ts-cli-template

A Nix-first template for TypeScript command-line tools. It follows OpenCode's
Bun, Effect 4, and TypeScript Native Preview toolchain.

The example keeps stdout machine-readable, models argument failures as Effect
errors, and consumes shared terminal vocabulary from `ts-utils`.

## Start a project

Create a repository from this template, then run the initializer once:

```bash
./hack/init-template.sh OWNER PROJECT [BINARY]
```

Names must start with a lowercase letter and contain only lowercase letters,
digits, and hyphens. The binary defaults to the project name.

## Development

```bash
nix develop --accept-flake-config
bun install --frozen-lockfile
bun run check
nix build --accept-flake-config
nix flake check --accept-flake-config
```

## Example

```bash
nix run . -- Roshan
nix run . -- --json Roshan
```

Run `bun run nix:lock` after a dependency change.

## Commands

<!-- generated:commands:start -->
```text
Print a greeting as text or JSON.

Usage:
  example [--json] [NAME]
Commands:
  completion <bash|fish|nu|zsh>  Print a shell completion script

Options:
  --json  Print JSON output
  --version  Print the version
  -h, --help  Print command help
```
<!-- generated:commands:end -->
