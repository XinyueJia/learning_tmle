import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parallelChapterCode} from '../../zh/renderers/parallel-code.js';

test('chapter0 workbooks survive prose heading edits and remain before the case workbench',async()=>{
 const md=readFileSync('zh/src/supplements/ch00-details.md','utf8');
 const renamed=md.replace(/^## .+$/gm,'## A revised reader-facing heading');
 for(const source of [md,renamed]){
  const out=await parallelChapterCode(source,0);
  assert.equal((out.match(/data-lesson-language/g)||[]).length,1);
  assert.equal((out.match(/data-lesson-panel="julia"/g)||[]).length,1);
  assert.equal((out.match(/data-lesson-panel="r"/g)||[]).length,1);
  assert(out.includes(readFileSync('zh/julia/object_ch00.jl','utf8').trim()));
  assert(out.includes('{{r-code:ch00}}'));
  assert(out.indexOf('data-lesson-language')<out.indexOf('data-case-study="0"'));
  assert.equal((out.match(/data-case-study="0"/g)||[]).length,1);
 }
});

test('a missing chapter0 workbook mount fails rather than silently omitting the code',async()=>{
 await assert.rejects(()=>parallelChapterCode('# Chapter 0\n\n## Any closing title',0),/Missing parallel code slot ch00/);
});
