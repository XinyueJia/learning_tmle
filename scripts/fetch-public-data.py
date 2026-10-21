"""Verify the frozen public CSV, or fetch the exact attributed publisher file if absent."""
from pathlib import Path
import hashlib
import json
import urllib.request

root = Path(__file__).resolve().parents[1]
folder = root / 'shared/data/public/ng-2021-nsclc'
meta = json.loads((folder / 'provenance.json').read_text())
target = folder / meta['file']
raw = target.read_bytes() if target.exists() else urllib.request.urlopen(meta['download_url'], timeout=45).read()
if len(raw) != meta['bytes'] or hashlib.sha256(raw).hexdigest() != meta['sha256']:
    raise SystemExit('Publisher file differs from the frozen version; do not overwrite or analyse silently.')
if not target.exists():
    target.write_bytes(raw)
print(f"Verified public publisher CSV: {meta['records']} records; SHA256 matches. Endpoint remains unverified.")
