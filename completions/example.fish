# fish completion for example
complete -c example -f
complete -c example -l json -d 'Print JSON output'
complete -c example -l version -d 'Print the version'
complete -c example -l help -s h -d 'Print command help'
complete -c example -n '__fish_use_subcommand' -a 'completion' -d 'Print a shell completion script'
