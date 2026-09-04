# nushell completion for example
export extern example [
  name?: string
  --json # Print JSON output
  --version # Print the version
  --help(-h) # Print command help
]

export extern "example completion" [
  shell: string@"nu-complete example shells"
]

def "nu-complete example shells" [] {
  [bash fish nu zsh]
}
