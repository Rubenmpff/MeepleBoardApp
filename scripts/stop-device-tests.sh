#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
# Validate every listener before signalling any process. --check changes nothing.
exec python3 - "$root" "${1:-}" <<'PY'
import os, pathlib, signal, subprocess, sys
app = pathlib.Path(sys.argv[1]).resolve()
api = app.parent / 'MeepleBoardApi'
if sys.argv[2] not in ('', '--check'):
    raise SystemExit('Usage: stop-device-tests.sh [--check]')
targets = []
for port in (5099, 8082):
    result = subprocess.run(['lsof', '-nP', '-t', f'-iTCP:{port}', '-sTCP:LISTEN'], capture_output=True, text=True)
    if result.returncode not in (0, 1):
        raise SystemExit('Cannot inspect test listeners')
    for pid in set(result.stdout.split()):
        command = subprocess.check_output(['ps', '-p', pid, '-o', 'command='], text=True).strip()
        cwd_info = subprocess.check_output(['lsof', '-a', '-p', pid, '-d', 'cwd', '-Fn'], text=True)
        cwd = next((line[1:] for line in cwd_info.splitlines() if line.startswith('n')), '')
        if port == 5099:
            expected = str(api / 'tools/DeviceTestApi/bin/DeviceTests/net9.0/DeviceTestApi')
            valid = command.startswith(expected + ' ') and ('--data=' + str(api / '.device-tests')) in command and pathlib.Path(cwd) in (api, api / 'tools/DeviceTestApi')
        else:
            expected = str(app / 'node_modules/.bin/expo') + ' start --lan --port 8082'
            valid = expected in command and pathlib.Path(cwd) == app
        if not valid:
            raise SystemExit(f'Refusing to stop unexpected process on port {port}')
        targets.append((port, int(pid)))
for port, pid in targets:
    if sys.argv[2] == '--check':
        print(f'Validated test process on port {port}, PID {pid}; left running')
    else:
        os.kill(pid, signal.SIGINT)
        print(f'Stop requested for test process on port {port}')
if not targets:
    print('No API/Expo test listeners found')
print('SQL container and test volume preserved; stop SQL separately if needed')
PY
