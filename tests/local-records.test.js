import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {spawnSync} from 'node:child_process';

const root = resolve('.');
const privatePaths = ['en/docs/PROGRESS.md', 'zh/docs/PROGRESS.md', 'en/docs/VERIFICATION.json',
  'zh/docs/chapters/ch01.md', 'en/docs/archive/README.md', 'en/reviews/review.md',
  'zh/reviews/review.md', 'zh/reference/working-notes.md', 'output/check.log'];
const publicPaths = ['README.md', 'DEVELOPMENT.md', 'en/docs/PUBLISHING.md',
  'en/src/sources.md', 'zh/src/chapters/ch01.md', 'shared/data/public/rhc/provenance.json'];

test('author records are ignored while public notes, references and provenance remain eligible', () => {
  const directory = mkdtempSync(join(tmpdir(), 'learning-tmle-ignore-'));
  try {
    copyFileSync(join(root, '.gitignore'), join(directory, '.gitignore'));
    assert.equal(spawnSync('git', ['init', '-q'], {cwd: directory}).status, 0);
    const result = spawnSync('git', ['check-ignore', '--no-index', '--stdin'], {
      cwd: directory, input: [...privatePaths, ...publicPaths].join('\n') + '\n', encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(new Set(result.stdout.trim().split('\n')), new Set(privatePaths));
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test('public packaging works without private original archives and excludes local record sentinels', () => {
  const directory = mkdtempSync(join(tmpdir(), 'learning-tmle-package-'));
  const put = (name, content) => {
    const target = join(directory, name); mkdirSync(resolve(target, '..'), {recursive: true});
    writeFileSync(target, content);
  };
  try {
    put('scripts/package.py', readFileSync(join(root, 'scripts/package.py')));
    for (let n = 0; n <= 8; n++) put(`zh/src/chapters/ch${String(n).padStart(2, '0')}.md`, '# Test fixture\n');
    put('dist/zh/index.html', '<!doctype html><title>Test fixture</title>');
    put('README.md', '# Public notes\n'); put('DEVELOPMENT.md', '# Contributor guide\n');
    put('en/docs/PUBLISHING.md', '# Publishing\n');
    put('shared/data/public/rhc/provenance.json', '{"source":"public fixture"}\n');
    for (const path of privatePaths) put(path, 'LOCAL-ONLY-SENTINEL\n');
    const result = spawnSync('python3', ['scripts/package.py'], {cwd: directory, encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
    const inspect = spawnSync('python3', ['-c',
      'import zipfile,json; z=zipfile.ZipFile("releases/EIF_Tutorial_Complete.zip"); print(json.dumps(z.namelist())); assert all(b"LOCAL-ONLY-SENTINEL" not in z.read(n) for n in z.namelist())'],
      {cwd: directory, encoding: 'utf8'});
    assert.equal(inspect.status, 0, inspect.stderr);
    const members = JSON.parse(inspect.stdout);
    assert(members.includes('en/docs/PUBLISHING.md'));
    assert(members.includes('shared/data/public/rhc/provenance.json'));
    for (const path of privatePaths) assert(!members.includes(path), path);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
