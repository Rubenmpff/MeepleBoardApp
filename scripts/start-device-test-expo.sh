#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
node_dir="${MEEPLE_TEST_NODE_DIR:-$HOME/.nvm/versions/node/v22.14.0/bin}"
export PATH="$node_dir:$PATH"
[[ "$(node --version)" == 'v22.14.0' && "$(npm --version)" == '10.9.2' ]] || { echo 'Required: Node 22.14.0 / npm 10.9.2.' >&2; exit 1; }
api_host="${1:?Pass the Mac LAN IPv4 address as the first argument}"
node -e 'const n=require("node:net");if(n.isIP(process.argv[1])!==4)process.exit(1)' "$api_host"
curl --fail --silent --show-error --max-time 5 "http://$api_host:5099/device-test/health" | node -e 'let s="";process.stdin.on("data",c=>s+=c);process.stdin.on("end",()=>{const h=JSON.parse(s);if(h.environment!=="DeviceTests"||h.database!=="MeepleBoard_DeviceTests"||h.externalDelivery!==false)process.exit(1);console.log("DeviceTests health verified; Node "+process.version);});'
export EXPO_PUBLIC_API_MODE=local EXPO_PUBLIC_API_PORT=5099 EXPO_PUBLIC_API_BASEPATH=/MeepleBoard REACT_NATIVE_PACKAGER_HOSTNAME="$api_host"
cd "$root"
exec npm run start -- --lan --port 8082 --clear
