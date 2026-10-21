import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readRhc} from '../../shared/js/rhc.js';
import {renderGlmScore} from '../../zh/renderers/glm-score.js';
import {renderMarkdown} from '../../scripts/markdown.js';
const Y=readRhc(readFileSync('shared/data/public/rhc/source.csv','utf8')).map(r=>r.y);
test('Score figures use accessible maths, source-ordered aligned rows and separately labelled targets',()=>{
 for(const mode of ['0','1','pairing']){
  const html=renderGlmScore(`<div class="glm-score-placeholder" data-glm-score="${mode}"></div>`,{Y});
  assert(html.includes('<math'));assert(!html.includes('katex-error'));assert(!html.includes('placeholder'));
  assert(html.includes('tabindex="0" role="region"'));assert(html.includes('真实总体P₀仍未知'));
  if(mode==='pairing'){assert(html.includes('有限步长需用expit重算'));assert.equal((html.match(/data-gs-support=/g)||[]).length,6);}
  else {assert(html.includes('5735 × 1'));assert.equal((html.match(/data-gs-row=/g)||[]).length,mode==='0'?12:18);}
 }
});
test('Added formula blocks have adjacent symbol recalls and chapter explanations distinguish the three derivatives',()=>{
 for(const c of ['00','01']){
  const md=readFileSync(c==='00'?'zh/src/supplements/ch00-details.md':`zh/src/chapters/ch${c}.md`,'utf8');
  const html=renderGlmScore(renderMarkdown(md),{Y});
  assert(!html.includes('katex-error'));
  const blocks=md.match(/^\$\$\n[\s\S]*?^\$\$/gm)||[];
  for(const block of blocks){const tail=md.slice(md.indexOf(block)+block.length);assert(/^\s*> \*\*符号回看/.test(tail),'Every display equation has a symbol recall');}
  assert(md.includes('score'));
 }
 const md=readFileSync('zh/src/chapters/ch01.md','utf8');
 assert(md.includes('logit尺度的增量'));assert(md.includes('不同路径'));
 assert(md.includes('D^{\\mathrm{logit}}_P'));assert(md.includes('s_\\mu(y)'));
 assert(md.includes('未知真实$\\mu_0$'));assert(md.includes('第6–7章'));
 assert.equal(renderGlmScore('<p>Other chapter</p>',{}),'<p>Other chapter</p>');
});
