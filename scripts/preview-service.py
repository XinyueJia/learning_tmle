#!/usr/bin/env python3
"""Manage the macOS login service for the local EIF tutorial preview."""
import argparse
import os
from pathlib import Path
import plistlib
import shutil
import socket
import subprocess
import sys
import time
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
LABEL = 'org.eif-tutorial.preview'
DOMAIN = f'gui/{os.getuid()}'
TARGET = f'{DOMAIN}/{LABEL}'
PLIST = Path.home() / 'Library/LaunchAgents' / f'{LABEL}.plist'
LOGS = ROOT / 'output/local-preview'
URL = 'http://127.0.0.1:4174/zh/'


def launchctl(*args, check=True):
    return subprocess.run(['launchctl', *args], capture_output=True, text=True, check=check)


def loaded():
    return launchctl('print', TARGET, check=False).returncode == 0


def configuration():
    node = shutil.which('node')
    if not node:
        node = str(Path.home() / '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node')
    if not Path(node).is_file() or not os.access(node, os.X_OK):
        raise RuntimeError('Node.js was not found. Install Node.js 20 or newer first.')
    if not (ROOT / 'dist/zh/index.html').is_file():
        raise RuntimeError('Build the course first: sh scripts/node.sh scripts/build.js')
    return {
        'Label': LABEL,
        'ProgramArguments': [node, str(ROOT / 'scripts/serve.js')],
        'WorkingDirectory': str(ROOT),
        'EnvironmentVariables': {'PORT': '4174'},
        'RunAtLoad': True,
        'KeepAlive': True,
        'ThrottleInterval': 5,
        'ProcessType': 'Background',
        'StandardOutPath': str(LOGS / 'stdout.log'),
        'StandardErrorPath': str(LOGS / 'stderr.log'),
    }


def wait_ready():
    deadline = time.monotonic() + 20
    while time.monotonic() < deadline:
        if loaded():
            try:
                with urllib.request.urlopen(URL, timeout=1) as response:
                    if response.status == 200:
                        print(f'Ready: {URL}')
                        return
            except OSError:
                pass
        time.sleep(0.25)
    raise RuntimeError(f'Preview did not become ready. Inspect {LOGS / "stderr.log"}')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['install', 'status', 'restart', 'stop', 'uninstall'])
    parser.add_argument('--dry-run', action='store_true', help='Print the installation plist without changing anything')
    args = parser.parse_args()
    if sys.platform != 'darwin':
        parser.error('This service manager requires macOS. Use sh scripts/node.sh scripts/serve.js elsewhere.')
    if args.dry_run:
        if args.action != 'install':
            parser.error('--dry-run is only available for install')
        sys.stdout.buffer.write(plistlib.dumps(configuration()))
        return
    if args.action == 'status':
        result = launchctl('print', TARGET, check=False)
        print(f'Configuration: {PLIST}\nLogs: {LOGS}')
        if result.returncode:
            raise RuntimeError('Preview service is not loaded. Run install to start it.')
        for line in result.stdout.splitlines():
            if any(key in line for key in ['state =', 'pid =', 'runs =', 'last exit code =']):
                print(line.strip())
        wait_ready()
    elif args.action == 'install':
        config = configuration()
        # Preserve another application's listener rather than terminating it.
        if not loaded():
            with socket.socket() as probe:
                if probe.connect_ex(('127.0.0.1', 4174)) == 0:
                    raise RuntimeError('Port 4174 is already in use by another process; nothing was stopped.')
        LOGS.mkdir(parents=True, exist_ok=True)
        PLIST.parent.mkdir(parents=True, exist_ok=True)
        if PLIST.exists():
            old = plistlib.loads(PLIST.read_bytes())
            if old.get('ProgramArguments', [None, None])[1:] != config['ProgramArguments'][1:]:
                raise RuntimeError(f'{PLIST} belongs to a different checkout; nothing was overwritten.')
        if loaded():
            launchctl('bootout', TARGET)
        temporary = PLIST.with_suffix('.plist.tmp')
        temporary.write_bytes(plistlib.dumps(config))
        temporary.chmod(0o644)
        temporary.replace(PLIST)
        launchctl('enable', TARGET)
        launchctl('bootstrap', DOMAIN, str(PLIST))
        wait_ready()
        print('Installed: starts at login and restarts automatically after exit.')
    elif args.action == 'restart':
        if not loaded():
            raise RuntimeError('Preview service is not loaded. Run install first.')
        launchctl('kickstart', '-k', TARGET)
        wait_ready()
    else:
        if loaded():
            launchctl('bootout', TARGET)
        if args.action == 'uninstall':
            PLIST.unlink(missing_ok=True)
            print('Uninstalled. Course files and logs have been retained.')
        else:
            print('Stopped until login or reinstall. Use uninstall to remove automatic startup.')


if __name__ == '__main__':
    try:
        main()
    except (RuntimeError, OSError, subprocess.CalledProcessError) as error:
        detail = getattr(error, 'stderr', '') or str(error)
        print(f'ERROR: {detail}', file=sys.stderr)
        sys.exit(1)
