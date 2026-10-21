"""Package the public course and sources; keep local author records out of bundles."""
from pathlib import Path
import hashlib
import json
import zipfile

root = Path(__file__).resolve().parents[1]
chapters = sorted((root / 'zh/src/chapters').glob('ch??.md'))
expected_chapters = [f'ch{n:02}.md' for n in range(9)]
if [p.name for p in chapters] != expected_chapters:
    raise SystemExit('Packaging requires the complete chapter 0 and all eight main chapters.')
if not (root / 'dist/zh/index.html').is_file():
    raise SystemExit('Build the course before packaging.')

# Local original materials are optional; public clones do not contain them.
original_path = root / 'zh/reference/EIF_Tutorial_Codex_Project.zip'
if original_path.exists():
    manifest = {}
    with zipfile.ZipFile(original_path) as original:
        for item in original.infolist():
            if item.is_dir():
                continue
            data = original.read(item.filename)
            saved = root / 'zh/reference/original' / item.filename
            if not saved.is_file() or saved.read_bytes() != data:
                raise SystemExit(f'Original ZIP material was altered: {item.filename}')
            manifest[item.filename] = hashlib.sha256(data).hexdigest()
    (root / 'zh/docs').mkdir(parents=True, exist_ok=True)
    (root / 'zh/docs/ORIGINAL_MANIFEST.json').write_text(json.dumps(manifest, indent=2) + '\n')


def public_member(file):
    relative = file.relative_to(root).as_posix()
    if relative.startswith('en/docs/'):
        return relative == 'en/docs/PUBLISHING.md'
    return not relative.startswith(('zh/docs/', 'en/reviews/', 'zh/reviews/', 'zh/reference/', 'output/'))

paths = ['dist', 'shared', 'zh', 'en', 'scripts', 'tests', '.github',
         'README.md', 'PUBLISHING.md', 'DEVELOPMENT.md', 'editions.json', 'package.json', 'pnpm-lock.yaml', '.gitignore']
(root / 'releases').mkdir(exist_ok=True)
target = root / 'releases/EIF_Tutorial_Complete.zip'
with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
    for name in paths:
        path = root / name
        files = sorted(path.rglob('*')) if path.is_dir() else [path]
        for file in files:
            if file.is_file() and public_member(file) and '__pycache__' not in file.parts and file.name != '.DS_Store':
                archive.write(file, str(file.relative_to(root)))
digest = hashlib.sha256(target.read_bytes()).hexdigest()
(root / 'releases/EIF_Tutorial_Complete.zip.sha256').write_text(f'{digest}  {target.name}\n')
with zipfile.ZipFile(target) as archive:
    if archive.testzip() is not None:
        raise SystemExit('Archive integrity check failed.')
    for item in archive.infolist():
        if not item.is_dir() and archive.read(item.filename) != (root / item.filename).read_bytes():
            raise SystemExit(f'Archive differs from the tested workspace: {item.filename}')
if hashlib.sha256(target.read_bytes()).hexdigest() != digest:
    raise SystemExit('Archive SHA256 changed after writing its checksum.')
style_source = root / 'zh/reference/因果推断之Doubly Robust Regression-causalit的文章.md'
if style_source.exists() and hashlib.sha256(style_source.read_bytes()).hexdigest() != '9892356b37eb476520b5f1c8b87a6dc65e3e62d5b933f706fec3790952d92a4f':
    raise SystemExit('The original style reference was altered.')
print(f'Packaged {target.name} ({target.stat().st_size:,} bytes); CRC/SHA256, all public members verified; local author records excluded.')
