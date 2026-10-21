#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
if command -v node >/dev/null 2>&1; then
  eif_node_bin=$(command -v node)
else
  eif_node_bin="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [ ! -x "$eif_node_bin" ]; then
  printf '%s\n' 'Please install Node.js 20 or newer to build or test the course.' >&2
  exit 1
fi
exec "$eif_node_bin" "$@"
