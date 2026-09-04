import { Data, Effect } from "effect";

export interface Options {
  readonly completion: string | undefined;
  readonly help: boolean;
  readonly json: boolean;
  readonly name: string;
  readonly version: boolean;
}

export class ArgumentError extends Data.TaggedError("ArgumentError")<{
  readonly message: string;
}> {}

export const parseArgs = (
  args: ReadonlyArray<string>,
): Effect.Effect<Options, ArgumentError> =>
  Effect.gen(function* () {
    let json = false;
    let help = false;
    let version = false;
    const positional: Array<string> = [];

    for (const arg of args) {
      switch (arg) {
        case "--help":
        case "-h":
          help = true;
          break;
        case "--json":
          json = true;
          break;
        case "--version":
          version = true;
          break;
        default:
          if (arg.startsWith("-")) {
            return yield* new ArgumentError({
              message: `unknown option: ${arg}`,
            });
          }
          positional.push(arg);
      }
    }

    if (positional[0] === "completion") {
      const shell = positional[1];
      if (positional.length !== 2 || shell === undefined) {
        return yield* new ArgumentError({
          message: "usage: example completion <bash|fish|nu|zsh>",
        });
      }
      return {
        completion: shell,
        help,
        json,
        name: "world",
        version,
      };
    }

    if (positional.length > 1) {
      return yield* new ArgumentError({
        message: "example accepts at most one name",
      });
    }

    return {
      completion: undefined,
      help,
      json,
      name: positional[0] ?? "world",
      version,
    };
  });
