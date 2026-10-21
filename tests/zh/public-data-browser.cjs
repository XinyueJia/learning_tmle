const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),{createHash}=require('node:crypto');
const base=process.env.EIF_URL||'http://127.0.0.1:4174';
(async()=>{const browser=await chromium.launch({channel:'chrome',headless:true});try{
 fs.mkdirSync('output/zh/playwright',{recursive:true});
 for(const width of [1360,790,375]){
  const p=await browser.newPage({viewport:{width,height:876}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto(base+'/zh/public-data.html');
  const main=p.locator('main'),table=main.locator('table');
  assert.equal(await table.count(),1);assert.equal(await main.locator('h2').count(),2);
  assert.equal(await table.locator('tbody tr').count(),5);assert.equal(await main.locator('pre').count(),0);
  const expected={all:[5735,61.37588299738448,16.681929290407542,2543,3192,1918],rhc:[2184,60.749835796703294,15.630698163533834,906,1278,830],noRhc:[3551,61.76092582652774,17.287674372233937,1637,1914,1088]};
  for(const [group,values] of Object.entries(expected))for(const [i,key] of ['n','ageMean','ageSd','female','male','deaths'].entries()){
   const value=Number(await table.locator(`[data-rhc-group="${group}"] [data-rhc-stat="${key}"]`).getAttribute('data-value'));assert(Math.abs(value-values[i])<1e-10,`${group}/${key}`);
  }
  assert((await table.locator('[data-rhc-summary-row="deaths"] [data-rhc-group="rhc"]').innerText()).includes('38.0%'));
  const text=await main.innerText();
  for(const old of ['Ng','NSCLC','肺癌','候选取舍','合成200','synthetic-course','逐讲完成分析','运行命令'])assert(!text.includes(old),old);
  assert.equal(await p.getByRole('link',{name:'原始研究',exact:true}).count(),1);
  const link=p.getByRole('link',{name:'下载原始CSV',exact:true});assert.equal(await link.count(),1);
  if(width===1360){const response=await p.request.get(new URL(await link.getAttribute('href'),p.url()).href);assert.equal(response.status(),200);const data=await response.body();assert.equal(data.length,2320412);assert.equal(createHash('sha256').update(data).digest('hex'),'9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8');}
  const area=main.locator('.table-wrap');if(await area.evaluate(e=>e.scrollWidth>e.clientWidth+1)){await area.focus();await p.keyboard.press('ArrowRight');await p.waitForTimeout(180);assert(await area.evaluate(e=>e.scrollLeft>0));await area.evaluate(e=>e.scrollLeft=0);await link.focus();await link.blur();}
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await p.screenshot({path:`output/zh/playwright/patient-summary-${width}.png`,fullPage:true});
  for(const file of ['case-study.html','sources.html']){
   await p.goto(base+'/zh/'+file);const body=await p.locator('main').innerText();for(const old of ['Ng','NSCLC','肺癌','合成200','候选取舍','匿名药物','synthetic-course'])assert(!body.includes(old),file+': '+old);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  }
  assert.deepEqual(errors,[]);await p.close();console.log(`PASS ${width}px: references and one real-RHC summary table, all groups and sample SD, source download integrity, keyboard scroll, no legacy case copy or overflow/errors`);
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
