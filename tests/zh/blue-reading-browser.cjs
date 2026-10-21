const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
const forbidden=/fit_logistic|hcat|prepare_full|Float64|\bVector\b|\bMatrix\b|\.\*|\.\-|\.==|read_rhc_rows|rhc_observations|mu = risk/;
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});try{
 for(const width of [1360,792,375]){
  const p=await b.newPage({viewport:{width,height:width===792?876:950}}),errors=[],external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
  await p.goto(base+'/?edition=blue-reading#chapter-0');await p.locator('#chapter-0[data-objects-mounted=true]').waitFor({state:'attached'});
  assert.equal(await p.locator('.rail-note').count(),0);
  const opening=await p.locator('.shell>aside,.course-intro').allTextContents();
  for(const phrase of ['从基础应用生物统计出发','只学过基础应用生物统计','无需登录 · 本地运行'])assert(!opening.join(' ').includes(phrase));
  assert.equal(await p.locator('.reader-note').count(),0);
  const theme=await p.evaluate(()=>({body:getComputedStyle(document.body).backgroundColor,rail:getComputedStyle(document.querySelector('.shell>aside')).backgroundColor,link:getComputedStyle(document.querySelector('nav a')).color}));
  assert.deepEqual(theme,{body:'rgb(255, 255, 255)',rail:'rgb(1, 20, 81)',link:'rgb(1, 20, 81)'});
  const activeNav=p.locator('nav a[aria-current=page]');await activeNav.focus();assert.equal(await activeNav.evaluate(e=>getComputedStyle(e).outlineColor),'rgb(0, 83, 152)');await activeNav.blur(); // current navigation item has a light surface
  await p.screenshot({path:`output/zh/playwright/blue-course-${width}.png`});
  let count=0;
  async function checkRows(chapter){
   const figures=chapter.locator('[data-object-stage]');
   for(const fig of await figures.all()){
    for(const area of await fig.locator('.ov-expression-scroll').all()){
     if(!await area.isVisible())continue;
     await area.locator(':scope > .ov-expression[data-rows-aligned=true],:scope > .ov-expression[data-vector-layout=false]').waitFor({state:'attached'});
     const report=await area.evaluate(el=>{
      const e=el.firstElementChild,own=x=>x.closest('.ov-expression')===e;
      const objects=[...e.querySelectorAll('.ov-object')].filter(own),groups={patient:[],outcome:[]};
      for(const object of objects){const kind=object.dataset.alignment;if(groups[kind]){const rows=[...object.querySelectorAll(kind==='patient'?'[data-record]':'[data-outcome]')];if(rows.length)groups[kind].push(rows);}}
      const rowErrors=[];for(const [kind,sets]of Object.entries(groups))for(let row=0;row<(sets[0]?.length||0);row++){
       const ys=sets.filter(s=>s[row]).map(s=>s[row].getBoundingClientRect().top);if(Math.max(...ys)-Math.min(...ys)>.75)rowErrors.push({kind,row,ys});
      }
      const dataRows=Object.values(groups).flat().flat();const centre=dataRows.length?(Math.min(...dataRows.map(r=>r.getBoundingClientRect().top))+Math.max(...dataRows.map(r=>r.getBoundingClientRect().bottom)))/2:null;
      const operators=[...e.querySelectorAll('.ov-syntax,.ov-arrow')].filter(own).map(o=>({text:o.textContent,centre:(o.getBoundingClientRect().top+o.getBoundingClientRect().bottom)/2,font:parseFloat(getComputedStyle(o).fontSize),pure:o.classList.contains('ov-operator')||o.classList.contains('ov-arrow')}));
      return{wrap:getComputedStyle(e).flexWrap,rowErrors,operators,centre,scrollWidth:el.scrollWidth,clientWidth:el.clientWidth};
     });
     assert.equal(report.wrap,'nowrap');assert.deepEqual(report.rowErrors,[],await fig.getAttribute('id'));
     for(const op of report.operators){assert(op.font>=(op.pure?28:18),op.text);if(report.centre!==null)assert(Math.abs(op.centre-report.centre)<1,`operator ${op.text} aligned with data body`);}
     assert.equal(await area.getAttribute('tabindex'),'0');count++;
    }
   }
  }
  for(const chapterNumber of [0,1]){
   await p.locator(`nav [href="#chapter-${chapterNumber}"]`).click();const ch=p.locator(`#chapter-${chapterNumber}`);
   if(chapterNumber===0){const fit=ch.locator('details').filter({has:p.locator('[data-object-stage=fit]')});await fit.locator(':scope > summary').click();await ch.locator('.ov-extra-fit>summary').click();}
   if(chapterNumber===0)assert.equal(await ch.locator('[name^=object-mode]').count(),0);
   for(const mode of chapterNumber===0?['math']:['math','julia']){
    if(chapterNumber===1)await ch.locator(`input[name^=object-mode][value=${mode}]`).check();
    const expected=chapterNumber===0?5:13;assert.equal(await ch.locator(`[data-object-mode=${mode}]`).count(),expected);
    if(mode==='math'){
     assert.equal(await ch.locator('.ov-canvas .ov-code,.ov-canvas [data-julia-name]').count(),0);
     for(const canvas of await ch.locator('.ov-canvas').all()){assert(!forbidden.test(await canvas.textContent()));assert(!(await canvas.textContent()).includes('对应的可运行Julia'));}
    }else assert.equal(await ch.locator('.ov-code').count(),expected);
    if(chapterNumber===0){const extra=ch.locator('.ov-extra-fit');if(!await extra.evaluate(e=>e.open))await extra.locator(':scope > summary').click();}
    await checkRows(ch);
   }
   if(chapterNumber===1)await ch.locator('input[name^=object-mode][value=math]').check();
   if(chapterNumber===0){await ch.locator('.ov-extra-fit>summary').click();const fit=ch.locator('details').filter({has:p.locator('[data-object-stage=fit]')});await fit.locator(':scope > summary').click();}
  }
  const c1=p.locator('#chapter-1'),area=c1.locator('#visual-replacement .ov-expression-scroll').first();
  await area.locator('[data-rows-aligned=true]').waitFor({state:'attached'});await nativeScroll(p,area);
  await c1.locator('#visual-distribution').screenshot({path:`output/zh/playwright/blue-ch1-distribution-${width}.png`});
  await c1.locator('#visual-replacement').screenshot({path:`output/zh/playwright/blue-ch1-replacement-${width}.png`});
  await p.locator('nav [href="#chapter-8"]').click();const c8=p.locator('[data-rhc-full]');await c8.locator('button[data-trace-stage="4"]').click();
  const chain=c8.locator('.trace-object-chain');await c8.locator('.trace-row-path .diagram-scroll[data-scroll-ready=true]').waitFor({state:'attached'});
  const cards=await chain.locator('.trace-value-object').evaluateAll(es=>es.map(e=>({top:e.getBoundingClientRect().top,height:e.getBoundingClientRect().height,left:e.getBoundingClientRect().left})));
  assert(cards.length===5);assert(Math.max(...cards.map(c=>c.top))-Math.min(...cards.map(c=>c.top))<1);assert(Math.max(...cards.map(c=>c.height))-Math.min(...cards.map(c=>c.height))<1);assert(cards.every((c,i)=>!i||c.left>cards[i-1].left));
  for(const line of await c8.locator('.trace-formula-line').all())assert.equal(await line.evaluate(e=>getComputedStyle(e).flexWrap),'nowrap');
  const chainArea=c8.locator('.trace-row-path .diagram-scroll');await nativeScroll(p,chainArea);await chainArea.evaluate(e=>{e.scrollLeft=e.scrollWidth;});
  await c8.locator('.trace-row-path').screenshot({path:`output/zh/playwright/blue-ch8-path-end-${width}.png`});
  const link=c8.locator('.trace-formula button[data-trace-key=offset]');await link.click();assert(await c8.locator('th[data-trace-column=offset]').evaluate(e=>e.classList.contains('trace-linked')));await p.keyboard.press('Escape');
  for(const page of ['public-data','sources','case-study','audit']){await p.goto(base+'/'+page+'.html');assert.equal(await p.locator('link[rel=stylesheet]').last().getAttribute('href'),'src/blue-theme.css');assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)');assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),page);}
  await p.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});assert.equal(await p.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(255, 255, 255)');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);await p.close();console.log(`PASS blue reading ${width}px: ${count} math/Julia expressions, row/operator alignment, no wrapping, native scrolling+keyboard; no position hints, code-free maths DOM, 8th-chapter chain/linking, 5 blue-white pages, reduced motion, console/offline`);
 }
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
