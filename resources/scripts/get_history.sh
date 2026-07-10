#!/bin/bash
# Lee el historial seguro sin ejecutar nada

if [ -f "$HOME/.zsh_history" ]; then
  tail -n 1000 "$HOME/.zsh_history" | sed 's/^:[0-9]*:[0-9]*;//'
elif [ -f "$HOME/.bash_history" ]; then
  tail -n 1000 "$HOME/.bash_history"
else
  echo "NO_HISTORY_FILE_FOUND"
fi
