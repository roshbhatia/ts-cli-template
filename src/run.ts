import type { Status } from "@roshbhatia/ts-utils";
import { Effect } from "effect";
import { parseArgs } from "./args.ts";
import { commandSpec, renderCompletion, renderHelp } from "./command.ts";

export interface Streams {
  readonly stdout: (value: string) => void;
  readonly stderr: (value: string) => void;
}

interface Result {
  readonly message: string;
  readonly status: Status;
}

export const run = (
  args: ReadonlyArray<string>,
  streams: Streams,
  version: string,
): Effect.Effect<number> =>
  Effect.gen(function* () {
    const options = yield* parseArgs(args);
    if (options.help) {
      streams.stdout(renderHelp(commandSpec));
      return 0;
    }
    if (options.version) {
      streams.stdout(version);
      return 0;
    }

    if (options.completion !== undefined) {
      const completion = renderCompletion(commandSpec, options.completion);
      if (completion === undefined) {
        streams.stderr(`unsupported shell: ${options.completion}`);
        return 2;
      }
      streams.stdout(completion);
      return 0;
    }

    const result: Result = {
      message: `hello, ${options.name}`,
      status: "done",
    };
    streams.stdout(options.json ? JSON.stringify(result) : result.message);
    return 0;
  }).pipe(
    Effect.catchTag("ArgumentError", (error) =>
      Effect.sync(() => {
        streams.stderr(error.message);
        return 2;
      }),
    ),
  );
