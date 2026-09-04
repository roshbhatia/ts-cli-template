{
  biome,
  bun2nix,
  installShellFiles,
  stdenv,
}:
let
  metadata = builtins.fromJSON (builtins.readFile ./package.json);
  template = builtins.fromJSON (builtins.readFile ./template.json);
in
bun2nix.mkDerivation {
  pname = template.binary;
  version = metadata.version;
  src = ./.;
  module = "src/main.ts";

  nativeBuildInputs = [
    biome
    installShellFiles
  ];
  bunDeps = bun2nix.fetchBunDeps { bunNix = ./bun.nix; };
  bunInstallFlags =
    if stdenv.hostPlatform.isDarwin then
      [
        "--linker=hoisted"
        "--backend=copyfile"
      ]
    else
      [ "--linker=hoisted" ];

  doCheck = true;
  checkPhase = ''
    runHook preCheck
    biome check .
    bun run typecheck
    bun test
    runHook postCheck
  '';

  postInstall = ''
    installShellCompletion --cmd example \
      --bash completions/example.bash \
      --fish completions/example.fish \
      --zsh completions/_example
    install -Dm644 completions/example.nu \
      "$out/share/nushell/vendor/autoload/example.nu"
  '';
}
