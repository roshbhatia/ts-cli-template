import { renderTemplate } from "@roshbhatia/ts-utils/template";

export interface OptionSpec {
  readonly description: string;
  readonly long: string;
  readonly short?: string;
}

export interface SubcommandSpec {
  readonly description: string;
  readonly name: string;
  readonly usage: string;
}

export interface CommandSpec {
  readonly description: string;
  readonly name: string;
  readonly options: ReadonlyArray<OptionSpec>;
  readonly subcommands: ReadonlyArray<SubcommandSpec>;
  readonly usage: string;
}

export const commandSpec: CommandSpec = {
  description: "Print a greeting as text or JSON.",
  name: "example",
  options: [
    { description: "Print JSON output", long: "--json" },
    { description: "Print the version", long: "--version" },
    { description: "Print command help", long: "--help", short: "-h" },
  ],
  subcommands: [
    {
      description: "Print a shell completion script",
      name: "completion",
      usage: "completion <bash|fish|nu|zsh>",
    },
  ],
  usage: "example [--json] [NAME]",
};

const helpTemplate = `{{description}}

Usage:
  {{usage}}
{{#if subcommands.length}}
Commands:
{{#each subcommands}}  {{usage}}  {{description}}
{{/each}}{{/if}}
Options:
{{#each options}}  {{#if short}}{{short}}, {{/if}}{{long}}  {{description}}
{{/each}}`;

const bashTemplate = `# bash completion for {{name}}
_{{name}}() {
  local current
  current="\${COMP_WORDS[COMP_CWORD]}"
  if [ "\${COMP_WORDS[COMP_CWORD - 1]}" = completion ]; then
    COMPREPLY=( $(compgen -W 'bash fish nu zsh' -- "$current") )
    return
  fi
  COMPREPLY=( $(compgen -W '{{words}}' -- "$current") )
}
complete -F _{{name}} {{name}}`;

const fishTemplate = `# fish completion for {{name}}
complete -c {{name}} -f
{{#each options}}complete -c {{../name}} -l {{longName}} {{#if shortName}}-s {{shortName}} {{/if}}-d '{{description}}'
{{/each}}{{#each subcommands}}complete -c {{../name}} -n '__fish_use_subcommand' -a '{{name}}' -d '{{description}}'
{{/each}}`;

const nuTemplate = `# nushell completion for {{name}}
export extern {{name}} [
  name?: string
{{#each options}}  {{longFlag}}{{#if short}}(-{{short}}){{/if}} # {{description}}
{{/each}}]

export extern "{{name}} completion" [
  shell: string@"nu-complete {{name}} shells"
]

def "nu-complete {{name}} shells" [] {
  [bash fish nu zsh]
}`;

const zshTemplate = `#compdef {{name}}
local context state line
_arguments \\
{{#each options}}  '{{zshFlags}}[{{description}}]' \\
{{/each}}  '1:command:->command' \\
  '*::argument:->argument'

case "$state" in
  command)
    _values 'command'{{#each subcommands}} '{{name}}[{{description}}]'{{/each}}
    ;;
  argument)
    if [[ "$line[1]" = completion ]]; then
      _values 'shell' bash fish nu zsh
    fi
    ;;
esac`;

const completionContext = (spec: CommandSpec) => ({
  ...spec,
  options: spec.options.map((option) => ({
    ...option,
    longFlag: option.long,
    long: option.long.slice(2),
    longName: option.long.slice(2),
    short: option.short?.slice(1),
    shortName: option.short?.slice(1),
    zshFlags: option.short ? `{${option.short},${option.long}}` : option.long,
  })),
  words: [
    ...spec.options.flatMap((option) =>
      option.short === undefined ? [option.long] : [option.short, option.long],
    ),
    ...spec.subcommands.map(({ name }) => name),
  ].join(" "),
});

export const renderHelp = (spec: CommandSpec): string =>
  renderTemplate(helpTemplate, spec).trimEnd();

export const renderCompletion = (
  spec: CommandSpec,
  shell: string,
): string | undefined => {
  const templates: Readonly<Record<string, string>> = {
    bash: bashTemplate,
    fish: fishTemplate,
    nu: nuTemplate,
    zsh: zshTemplate,
  };
  const template = templates[shell];
  return template === undefined
    ? undefined
    : renderTemplate(template, completionContext(spec)).trimEnd();
};
