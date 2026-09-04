import { renderTemplate } from "@roshbhatia/ts-utils/template";
import { commandSpec, renderCompletion, renderHelp } from "./command.ts";

const check = Bun.argv.includes("--check");
const outputs = new Map<string, string>();

for (const [shell, path] of Object.entries({
  bash: "completions/example.bash",
  fish: "completions/example.fish",
  nu: "completions/example.nu",
  zsh: "completions/_example",
})) {
  const content = renderCompletion(commandSpec, shell);
  if (content === undefined) {
    throw new Error(`missing completion renderer for ${shell}`);
  }
  outputs.set(path, `${content}\n`);
}

const readme = await Bun.file("README.md").text();
const start = "<!-- generated:commands:start -->";
const end = "<!-- generated:commands:end -->";
const generated = renderTemplate(
  `{{start}}
\`\`\`text
{{help}}
\`\`\`
{{end}}`,
  { end, help: renderHelp(commandSpec), start },
);
const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
if (!pattern.test(readme)) {
  throw new Error("README.md is missing generated command markers");
}
outputs.set("README.md", `${readme.replace(pattern, generated).trimEnd()}\n`);

for (const [path, expected] of outputs) {
  if (check) {
    const actual = await Bun.file(path).text();
    if (actual !== expected) {
      console.error(`${path} is stale; run bun run generate`);
      process.exitCode = 1;
    }
    continue;
  }
  await Bun.write(path, expected);
}
