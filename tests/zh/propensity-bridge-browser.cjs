const nativeScroll=require('./browser-scroll.cjs');
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const base=(process.env.EIF_URL||'http://127.0.0.1:4174').replace(/(?:\/zh)?\/?$/,'/zh');
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{for(const width of [1360,375]){
 const p=await browser.newPage({viewport:{width,height:950}}),errors=[],external=[];
 p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await p.route('**/*',r=>{const u=r.request().url();if(u.startsWith(new URL(base).origin+'/')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await p.goto(base+'/chapter-0-details.html?edition=propensity-first#chapter-0');await p.locator('#chapter-0[data-objects-mounted=true]').waitFor({state:'attached'});
 const ch=p.locator('#chapter-0'),fig=ch.locator('[data-ps-weighting]');
 assert.equal(await ch.locator('.ps-visual').count(),3);assert.equal(await ch.locator('[name^=object-mode]').count(),0);
 const order=await ch.evaluate(el=>{const selectors=['[data-ps-imbalance]','.qg-introduction','[data-ps-routes]','[data-ps-weighting]','.if-motivation-visual,[data-im-visual]'];const all=[...el.querySelectorAll('*')];return selectors.map(s=>all.indexOf(el.querySelector(s)));});
 assert(order.every((v,i)=>v>=0&&(!i||v>order[i-1])),JSON.stringify(order));
 const bars=ch.locator('[data-ps-bar]');assert.equal(await bars.count(),5);
 const male=[3192/5735,1914/3551,1278/2184,3192/5735,3192/5735];
 for(let i=0;i<5;i++){const text=await bars.nth(i).locator('.ps-male').innerText();assert(Math.abs(parseFloat(text.replace('Male ',''))-100*male[i])<.0051);}
 const detail=fig.locator('details');await detail.locator('summary').focus();await p.keyboard.press('Enter');assert(await detail.evaluate(el=>el.open));
 const actual=[{x:1,a:0,y:0},{x:0,a:1,y:0},{x:0,a:1,y:0},{x:0,a:0,y:0},{x:1,a:1,y:1},{x:0,a:0,y:0}],nX=[2543,3192],n1=[906,1278];
 for(let i=0;i<6;i++){
  const row=fig.locator(`[data-ps-row="${i+1}"]`),r=actual[i],g=n1[r.x]/nX[r.x],pa=r.a?g:1-g;
  const text=await row.innerText();assert(text.includes(r.x?'Male':'Female'));
  for(const [key,want]of Object.entries({g,pActual:pa,weight:1/pa}))assert(Math.abs(Number(await row.locator(`[data-ps-key=${key}]`).getAttribute('data-value'))-want)<1e-12);
 }
 const expected=2543/5735*(348/906-494/1637)+3192/5735*(482/1278-594/1914);
 assert(Math.abs(Number(await fig.locator('[data-ps-estimate]').getAttribute('data-ps-estimate'))-expected)<1e-12);
 for(const area of await ch.locator('.ps-visual .diagram-scroll,.ps-visual .table-wrap').all()){if(await area.isVisible())await nativeScroll(p,area);}
 for(const strip of await ch.locator('.ps-route-strip,.ps-calculation').all())assert.equal(await strip.evaluate(el=>getComputedStyle(el).flexWrap),'nowrap');
 await ch.locator('[data-ps-imbalance]').screenshot({path:`output/zh/playwright/propensity-imbalance-${width}.png`});
 await ch.locator('[data-ps-routes]').screenshot({path:`output/zh/playwright/propensity-routes-${width}.png`});
 await fig.screenshot({path:`output/zh/playwright/propensity-weights-${width}.png`});
 const proof=ch.locator('details').filter({has:p.getByText('逐步核对：接受RHC的概率怎样在条件期望里消去？',{exact:true})});
 await proof.locator('summary').focus();await p.keyboard.press('Enter');assert(await proof.evaluate(el=>el.open));assert.equal(await proof.locator('.equation').count(),2);assert(await proof.locator('math').count()>0);
 const recall=proof.locator('.recall-trigger').first();await recall.focus();await p.keyboard.press('Enter');const id=await recall.getAttribute('aria-controls');assert(await p.locator('#'+id).isVisible());await p.keyboard.press('Escape');
 await proof.locator('summary').focus();await p.keyboard.press('Enter');
 await ch.locator('[data-lesson-language]').selectOption('r');assert.equal(await ch.locator('[data-object-mode=math]').count(),5);
 assert.equal(await ch.locator('.ps-visual pre,.ps-visual code,.ps-visual .katex-error').count(),0);
 await p.locator('nav [href="#chapter-1"]').click();assert.equal(await p.locator('#chapter-1 .ps-visual').count(),0);
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
 await p.close();console.log(`PASS propensity bridge ${width}px: pre-IF order, real sex counts and first-six weights, independent standardised risks, PSM/IPW paths, two-arm derivation/recalls, keyboard scrolling, maths-only mode, no overflow/console/external requests`);
 }}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
