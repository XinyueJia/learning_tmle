const assert=require('node:assert/strict');
const path=require('node:path');
const near=(a,b)=>assert(Math.abs(a-b)<1e-10,`${a} != ${b}`);
module.exports=async function checkChapterOne(page,chapter,width,screenshotDir){
  const text=await chapter.innerText();
  for(const phrase of ['116','84','200','全因死亡','12个月','不是这200人的真实时间记录','第8月失访','状态未知','不能编码为0','不是药物A减B','完整观测','分布路径','原分布这个起点计算','仅有均值零','固定旧函数'])assert(text.includes(phrase),`clinical/model bridge missing: ${phrase}`);
  assert(!/0、1、3|0\/1\/3|0 分|3 分|分数例子/.test(text),'old score example removed');
  const ids=['survival-window','sample','distribution','replacement','mixture','mean-change','rate','general','rate-function','influence','random-influence','centering','centering-proof','reference-distribution','survival-complement','exercise-one','exercise-two','boundary'];
  assert.deepEqual(await chapter.locator('figure.step-visual').evaluateAll(es=>es.map(e=>e.dataset.visualId)),ids,'all18 visual stages are actually implemented in order');
  assert.equal(await chapter.locator('.course-visual').count(),0);
  for(const id of ['exercise-one','exercise-two','boundary'])assert(!(await chapter.locator(`#visual-${id}`).isVisible()),'answer/technical diagrams start folded');
  for(const visual of await chapter.locator('figure.step-visual').all()){
    const id=await visual.getAttribute('data-visual-id'),folded=visual.locator('xpath=ancestor::details');
    if(await folded.count())await folded.locator('summary').first().click();
    assert(await visual.isVisible());assert(await visual.locator('figcaption').innerText());
    assert.equal(await visual.locator('.formula-recall[role=note]').count(),1,'local symbol recalls retained');
    assert(await visual.evaluate(e=>e.scrollWidth<=e.clientWidth+1),`figure ${id} overflow at${width}`);
    await visual.screenshot({path:path.join(screenshotDir,`ch01-survival-${id}-${width}.png`)});
    if(await folded.count())await folded.locator('summary').first().click();
  }
  const functionRows=await chapter.locator('#visual-rate-function .function-journey').evaluateAll(es=>es.map(e=>[+e.dataset.z,+e.dataset.rate]));
  assert.equal(functionRows.length,2);functionRows.forEach((r,i)=>{assert.equal(r[0],i);near(r[1],[-.58,.42][i]);});
  const randomRows=await chapter.locator('#visual-random-influence .random-map-row').evaluateAll(es=>es.map(e=>[+e.dataset.y,+e.dataset.d,+e.dataset.probability]));
  assert.equal(randomRows.length,2);randomRows.forEach((r,i)=>{assert.equal(r[0],i);near(r[1],[-.58,.42][i]);near(r[2],[.42,.58][i]);});
  for(const [distribution,total] of [['original',0],['updated',.042]])near(+(await chapter.locator(`[data-reference-average=${distribution}]`).getAttribute('data-total')),total);
  assert.equal(await chapter.locator('.weight-cell').count(),0,'fractional probability weights are not rounded to fake patient icons');
  const equations=chapter.locator('.equation'),sources=await equations.locator('annotation').allTextContents();
  const steps=[
    ['encode','Y=\\mathbf 1\\{T\\le12\\}'],
    ['numeric-expand','1\\times0.58-1\\times0.58t+1\\times t'],
    ['numeric-combine','0.58+(-0.58+1)t'],
    ['distribute','\\sum_j\\big[y_jp_j-ty_jp_j'],
    ['split-sums','-\\sum_j ty_jp_j'],
    ['substitute','\\mu+t(-\\mu+z)'],
    ['cancel-mean','\\underbrace{(\\mu-\\mu)}_{=0}'],
    ['cancel-step','\\frac{t}{t}(z-\\mu)'],
    ['if-definition',':=\\lim_{t\\to0}'],
    ['if-quotient','\\frac{[\\mu+t(z-\\mu)]-\\mu}{t}'],
    ['if-limit','&=\\lim_{t\\to0}(z-\\mu)'],
    ['weighted-zero','&=-0.2436+0.2436'],
    ['general-zero','&=\\mu-\\mu\\times1'],
    ['constant-average','\\mathbb E_P[\\mu]'],
    ['changed-weights','&=-0.21924+0.26124'],
    ['survival-subtract','&=1-\\Psi(P_t)-1+\\mu'],
    ['survival-if','&=(1-Y)-(1-\\mu)']
  ];
  for(const [label,source] of steps){
    const i=sources.findIndex(s=>s.includes(source));assert(i>=0,`missing full algebra step${label}`);
    assert(await equations.nth(i).isVisible(),`core algebra${label} stays visible`);
    assert(await equations.nth(i).locator('math').count()>0);
  }
  for(const prefix of ['2.1 ','2.2 ','2.3 ','3.1 ','3.2 ','3.3 ','3.4 ','3.5 '])assert.equal(await chapter.locator('h3').filter({hasText:new RegExp('^'+prefix.replace('.','\\.'))}).count(),1);
  const coverage=await equations.evaluateAll(es=>es.filter(e=>!e.closest('.case-thread')).map(e=>e.nextElementSibling?.classList.contains('formula-recall')));
  assert(coverage.length>=30,'retain detailed equation groups including survival bridge');assert(coverage.every(Boolean),'each displayed formula has adjacent symbol callback');
  const tables=await chapter.locator('.table-wrap').evaluateAll(es=>es.filter(e=>!e.closest('.lab,.step-visual,.case-thread,.case-workbench')).map(e=>e.nextElementSibling?.classList.contains('formula-recall')));
  assert.equal(tables.length,4);assert(tables.every(Boolean));
  for(const source of ['p_j(t)=',':=\\lim_{t\\to0}','&=\\mu-\\mu\\times1']){
    const i=sources.findIndex(s=>s.includes(source));assert(i>=0);
    const note=equations.nth(i).locator('xpath=following-sibling::*[1]');
    await note.locator('.recall-trigger').click();assert(await note.locator('.recall-popover').isVisible());
    assert(await note.locator('math').count()>0);await page.keyboard.press('Escape');assert(!(await note.locator('.recall-popover').isVisible()));
  }
  const labRecall=chapter.locator('.lab').locator('xpath=following-sibling::*[1]');
  assert(await labRecall.evaluate(e=>e.classList.contains('formula-recall')));
  const answer=chapter.locator('#visual-exercise-one').locator('xpath=ancestor::details');
  await answer.locator('summary').click();const note=answer.locator('#visual-exercise-one .formula-recall');
  await note.locator('.recall-trigger').click();assert(await note.locator('.recall-popover').isVisible());
  await page.keyboard.press('Escape');await answer.locator('summary').click();assert(!(await note.locator('.recall-popover').isVisible()));
};
