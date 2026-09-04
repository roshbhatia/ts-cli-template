import { describe, expect, test } from "bun:test";
import { Effect } from "effect";
import { run } from "./run.ts";

const capture = () => {
  const stdout: Array<string> = [];
  const stderr: Array<string> = [];
  return {
    stderr,
    stdout,
    streams: {
      stderr: (value: string) => stderr.push(value),
      stdout: (value: string) => stdout.push(value),
    },
  };
};

describe("run", () => {
  test("writes text", () => {
    const output = capture();
    expect(Effect.runSync(run(["Roshan"], output.streams, "test"))).toBe(0);
    expect(output.stdout).toEqual(["hello, Roshan"]);
    expect(output.stderr).toEqual([]);
  });

  test("writes JSON", () => {
    const output = capture();
    expect(
      Effect.runSync(run(["--json", "Roshan"], output.streams, "test")),
    ).toBe(0);
    expect(JSON.parse(output.stdout[0] ?? "")).toEqual({
      message: "hello, Roshan",
      status: "done",
    });
  });

  test("renders help from the command specification", () => {
    const output = capture();
    expect(Effect.runSync(run(["--help"], output.streams, "test"))).toBe(0);
    expect(output.stdout[0]).toContain("completion <bash|fish|nu|zsh>");
    expect(output.stdout[0]).toContain("--json");
  });

  test("renders each supported completion", () => {
    for (const shell of ["bash", "fish", "nu", "zsh"]) {
      const output = capture();
      expect(
        Effect.runSync(run(["completion", shell], output.streams, "test")),
      ).toBe(0);
      expect(output.stdout[0]?.length).toBeGreaterThan(20);
    }
  });

  test("rejects an unsupported completion", () => {
    const output = capture();
    expect(
      Effect.runSync(run(["completion", "powershell"], output.streams, "test")),
    ).toBe(2);
    expect(output.stderr).toEqual(["unsupported shell: powershell"]);
  });
});
