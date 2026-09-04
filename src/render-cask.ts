import { renderTemplate } from "@roshbhatia/ts-utils/template";
import packageMetadata from "../package.json" with { type: "json" };
import templateMetadata from "../template.json" with { type: "json" };

const sha256 = Bun.argv[2];
if (sha256 === undefined || !/^[a-f0-9]{64}$/.test(sha256)) {
  throw new Error("usage: bun run src/render-cask.ts SHA256");
}

const source = await Bun.file("templates/cask.rb.hbs").text();
const output = renderTemplate(source, {
  binary: templateMetadata.binary,
  description: "A Nix-first TypeScript command-line tool",
  project: templateMetadata.project,
  sha256,
  sourceOwner: templateMetadata.homebrewOwner,
  version: packageMetadata.version,
});

process.stdout.write(output);
