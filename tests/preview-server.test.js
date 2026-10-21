import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';

test('preview serves the course and its dependencies from any working directory', {timeout:15000}, async t => {
  const server = spawn(process.execPath, [fileURLToPath(new URL('../scripts/serve.js', import.meta.url))], {
    cwd:tmpdir(), env:{...process.env,PORT:'0'}, stdio:['ignore','pipe','pipe']
  });
  t.after(() => server.kill());
  const origin = await new Promise((resolve,reject) => {
    let output='';
    server.on('error',reject);
    server.once('exit',code=>reject(Error(`Preview exited: ${code}`)));
    server.stdout.on('data',chunk=>{
      output+=chunk;
      const match=output.match(/http:\/\/127\.0\.0\.1:\d+/);
      if(match)resolve(match[0]);
    });
  });
  for (let attempt=0;attempt<2;attempt++) {
    const response=await fetch(origin+'/zh/?edition=refresh#chapter-0');
    assert.equal(response.status,200);
    assert((await response.text()).includes('id="chapter-0"'));
  }
  const js=await fetch(origin+'/zh/src/app.js');
  assert.equal(js.status,200);
  assert.match(js.headers.get('content-type'),/javascript/);
  const csv=await fetch(origin+'/shared/data/public/rhc/source.csv');
  assert.equal(csv.status,200);
  assert.match(csv.headers.get('content-type'),/text\/csv/);
  assert.deepEqual(Buffer.from(await csv.arrayBuffer()),await readFile(new URL('../shared/data/public/rhc/source.csv',import.meta.url)));
  assert.equal((await fetch(origin+'/missing.html')).status,404);
  assert.equal((await fetch(origin+'/%2e%2e%2fpackage.json')).status,403);
});
