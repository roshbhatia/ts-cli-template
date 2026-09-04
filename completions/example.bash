# bash completion for example
_example() {
  local current
  current="${COMP_WORDS[COMP_CWORD]}"
  if [ "${COMP_WORDS[COMP_CWORD - 1]}" = completion ]; then
    COMPREPLY=( $(compgen -W 'bash fish nu zsh' -- "$current") )
    return
  fi
  COMPREPLY=( $(compgen -W '--json --version -h --help completion' -- "$current") )
}
complete -F _example example
