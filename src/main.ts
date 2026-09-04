import { Effect } from "effect";
import packageMetadata from "../package.json" with { type: "json" };
import { run } from "./run.ts";

const streams = {
  stderr: (value: string) => console.error(value),
  stdout: (value: string) => console.log(value),
};

Effect.runPromise(
  run(Bun.argv.slice(2), streams, packageMetadata.version),
).then((code) => {
  process.exitCode = code;
});
