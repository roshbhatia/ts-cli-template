{
  description = "Nix-first TypeScript CLI template";

  nixConfig = {
    extra-substituters = [ "https://nix-community.cachix.org" ];
    extra-trusted-public-keys = [
      "nix-community.cachix.org-1:mB9FSh9qf2dCimDSUo8Zy7bkq5CX+/rkCWyvRCYg3Fs="
    ];
  };

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
    bun2nix.url = "github:nix-community/bun2nix/2.1.2";
    bun2nix.inputs.nixpkgs.follows = "nixpkgs";
    bun2nix.inputs.systems.follows = "systems";
  };

  outputs =
    inputs:
    let
      supportedSystems = [
        "aarch64-darwin"
        "aarch64-linux"
        "x86_64-linux"
      ];
      eachSystem = inputs.nixpkgs.lib.genAttrs supportedSystems;
      pkgsFor = eachSystem (
        system:
        import inputs.nixpkgs {
          inherit system;
          overlays = [ inputs.bun2nix.overlays.default ];
        }
      );
    in
    {
      formatter = eachSystem (
        system:
        let
          pkgs = pkgsFor.${system};
        in
        pkgs.writeShellApplication {
          name = "ts-cli-template-format";
          runtimeInputs = [
            pkgs.fd
            pkgs.nixfmt
          ];
          text = ''
            if [ "$#" -gt 0 ] && [ "''${1#-}" = "$1" ]; then
              exec nixfmt "$@"
            fi
            exec fd --extension nix --type file --exec-batch nixfmt "$@"
          '';
        }
      );

      packages = eachSystem (system: {
        default = pkgsFor.${system}.callPackage ./package.nix { };
      });

      apps = eachSystem (system: {
        default = {
          type = "app";
          program = "${inputs.nixpkgs.lib.getExe inputs.self.packages.${system}.default}";
        };
      });

      checks = eachSystem (
        system:
        let
          pkgs = pkgsFor.${system};
          example = pkgs.callPackage ./package.nix { };
          fakeBun = pkgs.writeShellScriptBin "bun" "exit 0";
        in
        {
          default = example;
          repository =
            pkgs.runCommand "ts-cli-template-repository-check"
              {
                nativeBuildInputs = [
                  pkgs.actionlint
                  pkgs.bash
                  pkgs.bun
                  pkgs.fish
                  pkgs.gitMinimal
                  pkgs.jq
                  pkgs.nushell
                  pkgs.perl
                  pkgs.shellcheck
                  pkgs.shfmt
                  pkgs.zsh
                ];
              }
              ''
                export HOME="$TMPDIR/home"
                mkdir -p "$HOME" "$TMPDIR/generated/completions"
                cd ${./.}

                actionlint ${./.github/workflows/ci.yml} ${./.github/workflows/release.yml}
                shellcheck ${./hack/init-template.sh} ${./hack/verify-release-tag.sh}
                shfmt -i 2 -ci -sr -s -d ${./hack/init-template.sh} ${./hack/verify-release-tag.sh}

                ${example}/bin/example completion bash > "$TMPDIR/generated/completions/example.bash"
                ${example}/bin/example completion fish > "$TMPDIR/generated/completions/example.fish"
                ${example}/bin/example completion nu > "$TMPDIR/generated/completions/example.nu"
                ${example}/bin/example completion zsh > "$TMPDIR/generated/completions/_example"
                diff -ru ${./completions} "$TMPDIR/generated/completions"

                test -f ${example}/share/bash-completion/completions/example.bash
                test -f ${example}/share/fish/vendor_completions.d/example.fish
                test -f ${example}/share/zsh/site-functions/_example
                test -f ${example}/share/nushell/vendor/autoload/example.nu

                bash -n ${./completions/example.bash}
                fish -n ${./completions/example.fish}
                nu --no-config-file --no-std-lib -c 'source ${./completions/example.nu}'
                zsh -n ${./completions/_example}
                GITHUB_REF_NAME=v0.3.0 bash ${./hack/verify-release-tag.sh}

                collision_project="exam""ple-tools"
                fixture="$TMPDIR/$collision_project"
                cp -R ${./.}/. "$fixture"
                chmod -R u+w "$fixture"
                (
                  cd "$fixture"
                  git init --quiet
                  git add .
                  PATH="${fakeBun}/bin:$PATH" bash ./hack/init-template.sh valid-owner "$collision_project" greet
                  test "$(jq -r .name package.json)" = "$collision_project"
                  test "$(jq -r .project template.json)" = "$collision_project"
                  test "$(jq -r .binary template.json)" = greet
                  ! grep -R -q "greet""-tools" README.md flake.nix package.json template.json .github
                )
                touch "$out"
              '';
        }
      );

      devShells = eachSystem (system: {
        default = pkgsFor.${system}.mkShellNoCC {
          packages = with pkgsFor.${system}; [
            biome
            bun
            bun2nix
            actionlint
            fish
            jq
            nushell
            ripgrep
            shellcheck
            shfmt
            vhs
            zsh
          ];
        };
      });
    };
}
