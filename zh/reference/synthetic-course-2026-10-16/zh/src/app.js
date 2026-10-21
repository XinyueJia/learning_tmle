import './recall-popovers.js';
import * as M from '../../shared/js/math.js';
import { chapter0Data } from './chapter0-data.js';
import { mountCaseWorkbenches } from './case-workbench.js';
const $ = (root, sel) => root.querySelector(sel);
const num = (root, id) => Number($(root, `#${id}`).value);
const f = (n,d=4) => (Math.abs(n)<.5*10**(-d)?0:n).toFixed(d);
const prob = n => n>0&&n<.0005?n.toExponential(2):n<1&&n>=.9995?`1 − ${(1-n).toExponential(2)}`:f(n,3);
const pp = n => `${f(100*n,2)} pp`;
const metric = items => `<div class="metrics">${items.map(([label,value,unit=''])=>`<div class="metric"><div class="metric-label">${label}</div><div class="metric-value">${value}</div><div class="metric-unit">${unit}</div></div>`).join('')}</div>`;
const table = (heads, rows) => `<p class="table-hint">表格未显示完整时，可横向滚动；键盘可先聚焦表格，再按左右键。</p><div class="table-wrap" tabindex="0" role="region" aria-label="数值表格，可横向滚动"><table><thead><tr>${heads.map(h=>`<th scope="col">${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const range = (id,label,min,max,step,value) => `<div class="control"><label for="${id}">${label}：<output id="${id}-value">${value}</output></label><input id="${id}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
const select = (id,label,opts,value) => `<div class="control"><label for="${id}">${label}</label><select id="${id}">${opts.map(([v,l])=>`<option value="${v}" ${v===value?'selected':''}>${l}</option>`).join('')}</select></div>`;
function chart(series, xLabel, yLabel, mark) {
  const points=series.flatMap(s=>s.points),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
  const xmin=Math.min(...xs),xmax=Math.max(...xs),lo=Math.min(...ys),hi=Math.max(...ys),pad=Math.max((hi-lo)*.18,.02),ymin=lo-pad,ymax=hi+pad;
  const W=window.innerWidth<800?340:650,H=270,L=60,R=22,T=20,B=56,X=x=>L+(x-xmin)/(xmax-xmin)*(W-L-R),Y=y=>H-B-(y-ymin)/(ymax-ymin)*(H-T-B);
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${xLabel}与${yLabel}的关系"><title>${series.map(s=>s.label).join('，')}</title>`;
  for(let i=0;i<=4;i++){let y=ymin+(ymax-ymin)*i/4,x=xmin+(xmax-xmin)*i/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(y)}" y2="${Y(y)}" stroke="#e0e4d9"/><text x="${L-10}" y="${Y(y)+4}" text-anchor="end" font-size="14" fill="#577069">${f(y,2)}</text><text x="${X(x)}" y="${H-B+21}" text-anchor="middle" font-size="14" fill="#577069">${f(x,2)}</text>`;}
  for(const [i,s] of series.entries())svg+=`<path d="${s.points.map(([x,y],j)=>`${j?'L':'M'}${X(x)},${Y(y)}`).join(' ')}" fill="none" stroke="${i?'#a86124':'#176f59'}" stroke-width="${i?2:4}" ${i?'stroke-dasharray="7 5"':''}/>`;
  if(mark!==undefined)svg+=`<line x1="${X(mark)}" x2="${X(mark)}" y1="${T}" y2="${H-B}" stroke="#7b8c79" stroke-dasharray="3 3"/>`;
  svg+=`<text x="${L}" y="13" font-size="14" fill="#577069">${yLabel}</text><text x="${W/2}" y="${H-7}" text-anchor="middle" font-size="14" fill="#577069">${xLabel}</text></svg>`;
  return `<div class="chart">${svg}</div><p class="chart-note">${series.map((s,i)=>`${i?'橙色虚线':'绿色实线'}：${s.label}`).join('；')}。数值表为精确当前值。</p>`;
}
function wire(root, update) {
  const inputs=[...root.querySelectorAll('input,select')];
  const defaults=inputs.map(e=>e.value);
  const run=()=>{for(const e of inputs){const out=$(root,`#${e.id}-value`);if(out)out.value=e.value;}try{update();}catch(e){$(root,'.results').innerHTML=`<p class="error" role="alert">${e.message}</p>`;}};
  inputs.forEach(e=>e.addEventListener(e.tagName==='SELECT'?'change':'input',run));
  $(root,'.reset').addEventListener('click',()=>{inputs.forEach((e,i)=>e.value=defaults[i]);run();});
  run();return run;
}
function introRiskBars(data) {
  const groups=[
    ['同一目标人群，全部启动研究药物A',data.risk1],
    ['同一目标人群，全部启动活性对照药物B',data.risk0],
    ['实际启动药物A的人',data.observedRisk1],
    ['实际启动药物B的人',data.observedRisk0]
  ];
  return `<div class="intro-risk-bars" role="img" aria-label="同一目标人群的两种干预风险和实际观测两组风险，所有横条共用0到100%刻度">${groups.map(([label,risk],i)=>`<div class="intro-risk-row"><span>${label}</span><div class="intro-risk-track"><i style="width:${100*risk}%;background:${i<2?'#287663':'#a66520'}"></i></div><strong>${f(100*risk,2)}%</strong></div>`).join('')}<p class="chart-note">横条从0开始，共用0–100%刻度。绿色使用相同人群权重；棕色使用各观测组自己的构成。</p></div>`;
}
function lab0(root) {
  root.innerHTML=`<h3>导读实验 · 先改变问题，再比较答案</h3><p class="lab-intro">这是已知概率的教学模型：计算的是总体精确值。改变：估计目标、目标人群构成或处理分配。固定：两组各处理水平下的结局风险。选择随机分配只更换处理概率，不重抽一份样本。</p><div class="controls">${select('intro-target','想知道哪个总体量？',[['ate','平均风险差（ATE）'],['risk1','全部启动药物A时的风险'],['risk0','全部启动药物B时的风险']],'ate')}${select('intro-population','目标人群中 X=1 所占比例',[[.2,'20%'],[.5,'50%'],[.8,'80%']],.5)}${select('intro-assignment','谁实际接受处理？',[['observational','依基线组分配：20% / 80%'],['randomised','两组均以50%概率随机分配']],'observational')}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{
    const data=chapter0Data({target:$(root,'#intro-target').value,population:num(root,'intro-population'),assignment:$(root,'#intro-assignment').value});
    const targetValue=data.unit==='概率差'?pp(data.targetValue):`${f(100*data.targetValue,2)}%`;
    $(root,'.results').innerHTML=`<div class="intro-target" data-target-value="${data.targetValue}"><small>当前估计目标 · ${data.targetLabel}</small><strong>${targetValue}</strong><p>目标人群：X=0 占 ${f(100*data.model.px[0],0)}%，X=1 占 ${f(100*data.model.px[1],0)}%。这是给定模型的总体计算，不是一次样本的估计值。</p></div>`+
      metric([['全部启动药物A时的风险',`${f(100*data.risk1,2)}%`,'同一目标人群'],['全部启动药物B时的风险',`${f(100*data.risk0,2)}%`,'同一目标人群'],['同一目标人群 ATE',pp(data.ate),'药物A减药物B；百分点'],['未经调整的观测组间差',pp(data.naive),'实际药物A组减药物B组；百分点']])+
      introRiskBars(data)+table(['基线组 X','目标人群比例','处理概率','药物B的组内风险','药物A的组内风险','组内风险差'],data.rows.map(row=>[row.x,`${f(100*row.p,0)}%`,`${f(100*row.g,0)}%`,`${f(100*row.q0,0)}%`,`${f(100*row.q1,0)}%`,pp(row.cate)]))+
      `<p class="result">${data.assignment==='randomised'?'当前两组都以50%概率分配处理，因此在这个总体模型中，未经调整的组间差与同一人群ATE相同。':'当前处理组中X=1的比例更高，两组构成不同；未经调整差比较的是各自实际入组的人，不能直接等同于同一人群的干预风险差。'}改变目标人群，会改变这次问题中的平均权重；改变目标选项，会改变所求的总体量。组内风险差按概率差计算，显示时乘100为百分点（pp），不是相对百分比变化。</p>`;
  });
}

function lab1(root) {
  root.innerHTML=`<h3>实验 1 · 同一队列的事件风险与无进展生存概率</h3><p class="lab-intro">改变：集中到的结局 z 和概率替换比例 t。固定：原分布 P(Y=0)=42%、P(Y=1)=58%，来自同一200人合成队列。t 从0到1，无量纲；不是随访月份，也不改写200条记录。先预测风险和生存概率各往哪边移动。</p><div class="controls">${select('mean-z','集中到的结局 z',[[0,'Y=0：12个月无事件'],[1,'Y=1：12个月内事件']],1)}${range('mean-t','替换比例 t（无量纲）',0,1,.01,0)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{
    const z=num(root,'mean-z'),t=num(root,'mean-t'),{values,probabilities}=M.MEAN_MODEL,index=values.indexOf(z);
    const pt=M.contaminate(probabilities,index,t),mu=M.mean(values,probabilities),exact=M.mean(values,pt),d=z-mu,pred=mu+t*d;
    const pts=Array.from({length:51},(_,i)=>i/50);
    $(root,'.results').innerHTML=metric([['原事件风险 μ',f(mu),'概率；即58%'],['风险方向导数 z−μ',f(d),'概率 / 单位 t'],['新风险：直接加权',f(exact),'概率'],['线性式给出的值',f(pred),'概率；本例精确相等'],['风险变化 Δμ',f(exact-mu),`${f(100*(exact-mu),2)} 个百分点`],['新无进展生存概率 Sₜ(12)',f(1-exact),'概率；1−新风险'],['生存概率变化 ΔS(12)',f(mu-exact),`${f(100*(mu-exact),2)} 个百分点`]])+table(['12个月结局 Y','原概率','新概率 pₜ','Y × pₜ'],values.map((v,i)=>[v===0?'0：确认无事件':'1：发生事件',f(probabilities[i]),f(pt[i]),f(v*pt[i])]))+chart([{label:'新权重直接算出的精确风险',points:pts.map(s=>[s,M.mean(values,M.contaminate(probabilities,index,s))])},{label:'μ+t(z−μ)，本例精确相等',points:pts.map(s=>[s,mu+s*d])}],'t（替换比例；不是月份）','12个月事件风险（概率）',t)+`<p class="result">概率和 = ${f(pt.reduce((a,b)=>a+b,0),6)}；精确风险−线性式 = ${f(exact-pred,8)}。两条线重合，因为二元事件风险也是均值，对概率权重是线性的。原生存概率为 ${f(1-mu)}；事件风险上升多少，生存概率就下降多少。当前计算假定12个月结局已知；第8个月后失访且未见事件者的Y未知，不能填0。</p>`;
  });
}
function lab2(root) {
  root.innerHTML=`<h3>实验 2 · 两类临床结局的概率变化与相对变化</h3><p class="lab-intro">改变：选定结局 z 和路径参数 t。固定：同一二元边际分布 P、原风险 μ=0.58。h、S、D 都在 t=0 定义，不随当前 t 改写。负 t 仅表示局部反方向；t不是月份。此处S为路径得分，不是生存函数S(12)。</p><div class="controls">${select('score-z','集中到的结局 z',[[0,'Y=0：12个月无事件'],[1,'Y=1：12个月内事件']],1)}${range('point-t','路径参数 t（无量纲）',-.1,.3,.01,.1)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{const z=num(root,'score-z'),t=num(root,'point-t'),{values,probabilities:p}=M.MEAN_MODEL,k=values.indexOf(z),pt=M.contaminate(p,k,t),mu=M.mean(values,p),D=values.map(y=>y-mu),S=M.pointScore(p,k),h=p.map((v,i)=>(i===k?1:0)-v),pair=M.inner(p,D,S);
    $(root,'.results').innerHTML=metric([['直接导数 Σyh',f(values.reduce((s,y,i)=>s+y*h[i],0)),'概率 / 单位 t'],['配对 Eₚ[DS]',f(pair),'概率 / 单位 t'],['Eₚ[S]',f(M.mean(S,p)),'无量纲'],['当前精确事件风险',f(M.mean(values,pt)),'概率']])+table(['Y','p','pₜ','h=δ−p','S=h/p','D=Y−μ','pDS'],values.map((y,i)=>[y,f(p[i],3),f(pt[i],3),f(h[i],3),f(S[i],3),f(D[i],3),f(p[i]*D[i]*S[i],3)]))+`<p class="result">Σh=${f(h.reduce((a,b)=>a+b,0),6)}，Eₚ[D]=${f(M.mean(D,p),6)}。pₜ−p=t h；当前 t 改变移动距离，起点方向仍然固定。</p>`;});
}
function modelTable(model){return table(['X','p(X)','g(x)','Q(0,x)','Q(1,x)','CATE τ(x)'],[0,1].map(x=>[x,prob(model.px[x]),prob(model.g[x]),prob(model.q[0][x]),prob(model.q[1][x]),pp(model.q[1][x]-model.q[0][x])]));}
function lab3(root){
  const b=M.DEFAULT_MODEL;
  root.innerHTML=`<h3>实验 3 · 只改变一个机制</h3><p class="lab-intro">改变：所选机制的参数。固定：其余两种机制严格保持基准值；切换模式不会携带另一机制的变动。范围内所有八单元概率均为正。结果为总体精确积分，概率差以 pp 显示。</p><div class="controls">${select('factor-kind','改变的机制',[['X','X：人群构成'],['A','A：治疗分配'],['Y','Y：条件结局']],'A')}</div><div class="controls" data-factor="X">${range('factor-px','P(X=1)（概率）',.1,.9,.01,b.px[1])}</div><div class="controls" data-factor="A">${[0,1].map(x=>range(`factor-g${x}`,`g(${x})（概率）`,.05,.95,.01,b.g[x])).join('')}</div><div class="controls" data-factor="Y">${[0,1].flatMap(a=>[0,1].map(x=>range(`factor-q${a}${x}`,`Q(${a},${x})（概率）`,.05,.95,.01,b.q[a][x]))).join('')}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  $(root,'#factor-kind').addEventListener('change',()=>root.querySelectorAll('input').forEach(e=>e.value=e.defaultValue));
  wire(root,()=>{const kind=$(root,'#factor-kind').value,model=M.cloneModel();root.querySelectorAll('[data-factor]').forEach(e=>e.hidden=e.dataset.factor!==kind);
    if(kind==='X'){const px=num(root,'factor-px');model.px=[1-px,px];}
    if(kind==='A')model.g=[num(root,'factor-g0'),num(root,'factor-g1')];
    if(kind==='Y')model.q=[0,1].map(a=>[0,1].map(x=>num(root,`factor-q${a}${x}`)));
    const cells=M.joint(model),arm=a=>{const den=M.expectation(cells,c=>Number(c.a===a));return M.expectation(cells,c=>c.a===a?c.y:0)/den;};
    $(root,'.results').innerHTML=metric([['identified ATE',pp(M.ate(model)),'两层 CATE 按 p(X) 加权'],['未经调整的差',pp(M.naive(model)),'E[Y|A=1]−E[Y|A=0]'],['处理组结局发生概率',f(arm(1)),'概率'],['活性对照组结局发生概率',f(arm(0)),'概率']])+modelTable(model)+table(['X','P(X|A=1)','P(X|A=0)'],[0,1].map(x=>{const d1=model.px.reduce((s,p,i)=>s+p*model.g[i],0),d0=1-d1;return[x,f(model.px[x]*model.g[x]/d1),f(model.px[x]*(1-model.g[x])/d0)];}))+`<details><summary>展开八单元联合概率与因子</summary>${table(['X,A,Y','p(X)','p(A|X)','p(Y|A,X)','联合概率'],cells.map(c=>[`${c.x},${c.a},${c.y}`,f(model.px[c.x],3),f(c.a?model.g[c.x]:1-model.g[c.x],3),f(c.y?model.q[c.a][c.x]:1-model.q[c.a][c.x],3),f(c.p,5)]))}</details>`+`<p class="result">联合概率和=${f(cells.reduce((s,c)=>s+c.p,0),8)}。${kind==='A'?'本次仅改变 g；ATE 不变。两臂的人群权重可能改变，未经调整的差通常也改变。':'对照上表：只有所选机制改变。ATE 使用同一套人群权重平均两个处理水平的条件均值之差。'}</p>`;
  });
}

function contaminatedModel(model,k,t){const cells=M.joint(model),pt=M.contaminate(cells.map(c=>c.p),k,t);return M.fromJoint(cells.map((c,i)=>({...c,p:pt[i]})));}
function lab4(root){
  const base=M.cloneModel(),cells=M.joint(base);
  root.innerHTML=`<h3>实验 4 · 从商式求导到完整梯度</h3><p class="lab-intro">改变：联合分布朝选定单元的点污染及 t。固定：基准 P；此路径同时改变多个机制，不是纯结局路径。精确 ATE 从新八单元概率重建；切线使用起点 D。每章各自重置。</p><div class="controls">${select('ate-cell','选定单元 (X,A,Y)',cells.map((c,i)=>[i,`(${c.x},${c.a},${c.y})，p=${f(c.p,3)}`]),5)}${range('ate-t','污染比例 t',0,.15,.001,.01)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{const k=num(root,'ate-cell'),t=num(root,'ate-t'),c=cells[k],d=M.eif(base,c),pert=contaminatedModel(base,k,t),psi=M.ate(base),exact=M.ate(pert),approx=psi+t*d.total,r=base.px[c.x]*(c.a?base.g[c.x]:1-base.g[c.x]),q=base.q[c.a][c.x],nt=(1-t)*r*q+t*c.y,rt=(1-t)*r+t;
    const pts=Array.from({length:61},(_,i)=>.15*i/60),der=(M.ate(contaminatedModel(base,k,1e-6))-M.ate(contaminatedModel(base,k,-1e-6)))/2e-6;
    $(root,'.results').innerHTML=metric([['人群贡献 Dₓ',f(d.dx),'概率差 / 单位 t'],['结局贡献 Dᵧ',f(d.dy),'概率差 / 单位 t'],['完整梯度 D',f(d.total),'概率差 / 单位 t'],['起点中心差分导数',f(der,6),'步长=10⁻⁶；概率差 / 单位 t'],['当前精确 ATE',pp(exact),'从新联合分布求值'],['起点切线预测',pp(approx),'ψ(P)+t D(o)'],['当前单侧差商',t===0?'未定义':f((exact-psi)/t,6),'(ψ(Pₜ)−ψ(P))/t；t=0 时未定义']])+table(['商式量','原值','当前精确值'],[['所属 (A,X) 概率 r',f(r,6),f(rt,6)],['结局分子 n=E[Y 1(A=a,X=x)]',f(r*q,6),f(nt,6)],['条件均值 n/r',f(q,6),f(nt/rt,6)]])+chart([{label:'新联合概率直接算出的精确 ATE',points:pts.map(s=>[s,100*M.ate(contaminatedModel(base,k,s))])},{label:'ψ(P)+tD(o)，局部近似',points:pts.map(s=>[s,100*(psi+s*d.total)])}],'t（污染比例）','ATE（pp）',t)+`<p class="result">精确−近似=${f(100*(exact-approx),5)} pp；选定单元 Q 的起点导数为 (y−Q)/r=${f((c.y-q)/r)}。外层 p(X) 与分母的 p(X) 抵消，保留下治疗/对照概率权重。</p><details><summary>展开八单元梯度及均值零检查</summary>${table(['X,A,Y','p','Dₓ','Dᵧ','D','pD'],cells.map(o=>{const z=M.eif(base,o);return[`${o.x},${o.a},${o.y}`,f(o.p,3),f(z.dx,3),f(z.dy,3),f(z.total,3),f(o.p*z.total,4)];}))}<p>Eₚ[D]=${f(M.expectation(cells,o=>M.eif(base,o).total),10)}。这是按 P 加权的恒等式；每个单元的 D 通常不为零。</p></details>`;
  });
}

function lab5(root){
  const base=M.cloneModel(),cells=M.joint(base),p=cells.map(c=>c.p),raw=[2,-1,4,3,-.5,7,-2,1],centre=M.mean(raw,p),jointS=raw.map(s=>s-centre);
  const path=(kind,t)=>kind==='J'?M.jointTilt(base,jointS,t):M.tilt(base,kind,t);
  root.innerHTML=`<h3>实验 5 · 梯度与不同方向的配对</h3><p class="lab-intro">改变：路径种类和 t。X/A/Y 各自条件归一化，严格固定其余两因子。J 是一条联合倾斜示例，同时改变多个机制。所有 score、D 和配对值在原 P、t=0 计算；精确结果为当前 Pₜ。导数与有限差分的单位为概率差/单位 t。</p><div class="controls">${select('path-kind','平滑路径',[['X','X：只改变人群构成'],['A','A：只改变处理机制'],['Y','Y：只改变结局机制'],['J','J：联合方向示例（多机制）']],'X')}${range('path-t','路径位置 t（无量纲）',-3,3,.01,.5)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{const kind=$(root,'#path-kind').value,t=num(root,'path-t'),S=kind==='J'?jointS:cells.map(c=>M.mechanismScore(base,kind,c)),D=cells.map(c=>M.eif(base,c).total),pair=M.inner(p,D,S),current=path(kind,t),psi=M.ate(base),der=(M.ate(path(kind,1e-5))-M.ate(path(kind,-1e-5)))/2e-5,pts=Array.from({length:61},(_,i)=>-3+i/10);
    $(root,'.results').innerHTML=metric([['起点导数：Eₚ[DS]',f(pair,6),'概率差 / 单位 t'],['起点中心有限差分',f(der,6),'步长=10⁻⁵'],['当前精确 ATE',pp(M.ate(current)),'由 Pₜ 重算'],['局部切线预测',pp(psi+t*pair),'ψ(P)+tEₚ[DS]']])+table(['X','p(X) 原→当前','g(x) 原→当前','Q(0,x) 原→当前','Q(1,x) 原→当前'],[0,1].map(x=>[x,`${prob(base.px[x])} → ${prob(current.px[x])}`,`${prob(base.g[x])} → ${prob(current.g[x])}`,`${prob(base.q[0][x])} → ${prob(current.q[0][x])}`,`${prob(base.q[1][x])} → ${prob(current.q[1][x])}`]))+chart([{label:'当前路径的精确 ATE',points:pts.map(s=>[s,100*M.ate(path(kind,s))])},{label:'起点梯度与方向配对的切线',points:pts.map(s=>[s,100*(psi+s*pair)])}],'t（路径位置）','ATE（pp）',t)+`<p class="result">当前精确值−切线=${f(100*(M.ate(current)-psi-t*pair),5)} pp；Eₚ[S]=${f(M.mean(S,p),10)}。${kind==='A'?'g 已改变，但 Q 与 p(X) 逐项保持基准，因此整个路径 ATE 恒定。':kind==='J'?'J 使用原始向量 [2,−1,4,3,−0.5,7,−2,1] 减去其 P 加权均值，再在联合分布全局归一化；它不是纯机制路径。':'表中箭头显示本次真正改变的机制；数值相等的另外两因子是固定的。'}</p><details><summary>展开八单元的起点 score 与配对贡献</summary>${table(['X,A,Y','p','S','D','pDS'],cells.map((c,i)=>[`${c.x},${c.a},${c.y}`,f(c.p,3),f(S[i],4),f(D[i],4),f(p[i]*S[i]*D[i],5)]))}</details>`;
  });
}

function lab6(root){
  const model=M.cloneModel(),cells=M.joint(model),p=cells.map(c=>c.p),Dstar=cells.map(c=>M.eif(model,c).total),U=cells.map(c=>c.a-model.g[c.x]),basis=[cells.map(c=>c.x-model.px[1])];
  for(let x=0;x<2;x++)for(let a=0;a<2;a++)basis.push(cells.map(c=>c.x===x&&c.a===a?c.y-model.q[a][x]:0));
  root.innerHTML=`<h3>实验 6 · 在八个单元上实际投影</h3><p class="lab-intro">固定：基准 P 和已知的 g；统计模型允许 p(X)、Q 任意局部变化，合法 score 空间 T 为五维。改变：梯度候选 D=D*+bU 中的 b，U=A−g(X)。下面用八维向量和 p 加权内积实际计算投影，不是二维示意图。</p><div class="controls">${range('projection-b','正交分量系数 b',-3,3,.1,1)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{const b=num(root,'projection-b'),u=U.map(v=>b*v),D=Dstar.map((v,i)=>v+u[i]),proj=M.project(p,D,basis),res=D.map((v,i)=>v-proj[i]),nD=M.inner(p,D,D),nP=M.inner(p,proj,proj),nR=M.inner(p,res,res),orth=M.inner(p,proj,res),err=Math.max(...basis.map(v=>Math.abs(M.inner(p,res,v))));
    const coeffs=Array.from({length:61},(_,i)=>-3+i/10),normStar=M.inner(p,Dstar,Dstar),normU=M.inner(p,U,U);
    $(root,'.results').innerHTML=metric([['候选梯度 ‖D‖²',f(nD),'概率差²'],['投影 ‖ΠₜD‖²',f(nP),'概率差²'],['正交残余 ‖D−ΠₜD‖²',f(nR),'概率差²'],['投影与残余内积',f(orth,10),'概率差²，应为零']])+table(['X,A,Y','p','D*','bU','候选 D','计算投影 ΠₜD','计算残余'],cells.map((c,i)=>[`${c.x},${c.a},${c.y}`,f(p[i],3),f(Dstar[i],3),f(u[i],3),f(D[i],3),f(proj[i],3),f(res[i],3)]))+chart([{label:'候选梯度的加权范数²',points:coeffs.map(v=>{const candidate=Dstar.map((d,i)=>d+v*U[i]);return [v,M.inner(p,candidate,candidate)];})},{label:'canonical gradient 的加权范数²',points:coeffs.map(v=>[v,normStar])}],'b（正交分量系数）','加权范数²（概率差²）',b)+`<p class="result">勾股分解误差=${f(nD-nP-nR,10)}；残余对五个基方向的最大配对绝对值=${f(err,10)}。所有允许方向的导数保持一致；候选均值 Eₚ[D]=${f(M.mean(D,p),10)}。</p><details><summary>展开五个合法基方向的逐行配对</summary>${table(['合法基 B','E[D*B]','E[候选 DB]','E[投影 B]','E[残余 B]'],basis.map((B,i)=>[['Bₓ','B₀,₀','B₀,₁','B₁,₀','B₁,₁'][i],f(M.inner(p,Dstar,B),6),f(M.inner(p,D,B),6),f(M.inner(p,proj,B),6),f(M.inner(p,res,B),10)]))}<p>同一合法方向上，候选与投影的配对均等于原目标梯度的配对；残余贡献逐行都是零。</p></details><details><summary>展开模型约束与跨模型检验</summary><p>五个基是 X−0.5 与四个 1(X=x,A=a)(Y−Q(a,x))。U 不属于这个已知 g 模型的合法路径方向，却与其全部基方向正交。全模型允许处理方向 Sₐ=U，真实目标导数为 0；当前候选配对 Eₚ[DU]=${f(M.inner(p,D,U),6)}。${b===0?'当前 b=0，候选就是全模型的 canonical gradient。':'当前 b≠0：它在已知 g 模型是合法梯度，在全模型却不能代表处理路径的导数。'}加权 ‖U‖²=${f(normU,4)}；全模型的 L²₀(P) 是七维；图中是在扫描一个系数 b，不是在画 tangent space 的全部维度。</p></details>`;
  });
}

function lab7(root){
  root.innerHTML=`<h3>实验 7 · 信息量如何进入估计误差？</h3><p class="lab-intro">改变：处理分配 g(0)=r、g(1)=1−r，和 iid 样本量 n。固定：p(X) 与 Q。下面是给定模型的渐近效率下界及理论标准误，不是一次有限样本拟合的误差或保证。</p><div class="controls">${range('eff-r','r：处理概率（无量纲）',.05,.5,.01,.2)}${select('eff-n','样本量 n（独立观测个数）',[[100,'100'],[1000,'1000'],[4000,'4000'],[10000,'10000']],1000)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  wire(root,()=>{const r=num(root,'eff-r'),n=num(root,'eff-n'),model=M.cloneModel();model.g=[r,1-r];const direct=M.varianceDirect(model),analytic=M.varianceAnalytic(model),se=Math.sqrt(direct/n),cells=M.joint(model),vx=M.expectation(cells,c=>M.eif(model,c).dx**2),vy=M.expectation(cells,c=>M.eif(model,c).dy**2),cross=M.expectation(cells,c=>M.eif(model,c).dx*M.eif(model,c).dy),rs=Array.from({length:91},(_,i)=>.05+.45*i/90);
    $(root,'.results').innerHTML=metric([['ATE',pp(M.ate(model)),'总体目标固定'],['EIF 方差：八点直接求和',f(direct,6),'概率差²'],['EIF 方差：条件方差式',f(analytic,6),'概率差²'],['理论标准误 √(V/n)',pp(se),'渐近近似']])+table(['方差组成','当前计算','单位'],[['E[Dₓ²]',f(vx,6),'概率差²'],['E[Dᵧ²]',f(vy,6),'概率差²'],['E[DₓDᵧ]',f(cross,10),'概率差²'],['两种方差计算之差',f(direct-analytic,10),'概率差²'],['渐近方差尺度 V/n',f(direct/n,8),'概率差²']])+chart([{label:'每个 r 下八单元直接求出的 EIF 方差',points:rs.map(v=>{const m=M.cloneModel();m.g=[v,1-v];return[v,M.varianceDirect(m)];})}],'r（g(0)，g(1)=1−r）','方差（概率差²）',r)+`<p class="result">n=${n} 时理论标准误为 ${f(se,6)} 概率差，即 ${pp(se)}。样本量乘 4 时标准误乘 1/2；这是渐近尺度规律。改变 r 不改变 ATE，却改变罕见处理臂的观测信息。</p><details><summary>展开当前机制与曲线的非单调细节</summary>${modelTable(model)}<p>本例 V(r)=0.01+0.16/r+0.23/(1−r)，两臂条件噪声不完全相同，最低点约在 r=0.455，稍小于 0.5。因此不能把整个控件区间说成严格单调；靠近 0 或 1 的逆概率项会变大。没有声称 TMLE 或其他算法在本次有限样本一定达到这条界。</p></details>`;
  });
}

function lab8(root){
  const truth=M.cloneModel();
  root.innerHTML=`<h3>实验 8 · 修正估计，或更新模型？</h3><p class="lab-intro">固定：真实八单元 P₀。改变：模拟拟合 Q̃ 的偏移 b、g̃ 向 0.5 收缩的比例 λ，以及手动试探 ε。这里用 P₀ 做总体积分；没有拟合真实数据，数值方程零不证明任意有限样本无偏。自动 targeting 会检查根与收敛。</p><div class="presets"><button type="button" data-preset="Q">只有 Q 正确</button><button type="button" data-preset="g">只有 g 正确</button><button type="button" data-preset="both-wrong">两者都错</button><button type="button" data-preset="both-correct">两者都正确</button></div><div class="controls">${range('fit-b','拟合 Q 的偏移参数 b',-.15,.15,.01,.12)}${range('fit-lambda','g 向 0.5 收缩比例 λ',0,1,.05,.5)}${range('trial-epsilon','手动试探 ε（无量纲）',-1,1,.01,0)}</div><div class="results" aria-live="polite"></div><button class="reset" type="button">重置本章实验</button>`;
  const run=wire(root,()=>{const b=num(root,'fit-b'),lambda=num(root,'fit-lambda'),trial=num(root,'trial-epsilon'),fit=M.fitFromOffsets(truth,b,lambda);const solved=M.tmle(truth,fit),trialQ=M.fluctuation(truth,fit,trial),score0=M.fluctuationScore(truth,fit,0),trialScore=M.fluctuationScore(truth,fit,trial),limit=Math.max(.75,1.5*Math.abs(solved.epsilon),Math.abs(trial)+.1),eps=Array.from({length:101},(_,i)=>-limit+2*limit*i/100);
    const h=(a,x)=>M.cleverCovariate(fit,a,x);
    const bias=M.nuisanceBias(truth,fit);
    $(root,'.results').innerHTML=metric([['真实 ATE',pp(M.ate(truth)),'P₀ 下的目标'],['初始 plug-in',pp(M.ate(fit)),'总体 X 权重的 Q̃ 差'],['AIPW / one-step',pp(M.aipw(truth,fit)),'修正最终数值；保留 Q̃'],['population TMLE',pp(solved.estimate),'更新 Q* 后重新 plug-in'],['自动求出的 ε',f(solved.epsilon,6),'唯一 score 根'],['更新前总体 score',f(score0,8),'E₀[H(Y−Q̃)]'],['手动试探 ε 的 score',f(trialScore,8),'与自动求根分开'],['更新后数值残差',Math.abs(solved.score).toExponential(2),'|E₀[H(Y−Q*)]|']])+table(['A,X','H（clever covariate）','offset=logit Q̃','Q̃','手动 Qε','自动 Q*','真 Q₀'],[0,1].flatMap(a=>[0,1].map(x=>[`${a},${x}`,f(h(a,x),3),f(M.logit(fit.q[a][x]),4),f(fit.q[a][x],4),f(trialQ.q[a][x],4),f(solved.updated.q[a][x],4),f(truth.q[a][x],4)])))+chart([{label:'总体 fluctuation score（真实积分）',points:eps.map(e=>[e,M.fluctuationScore(truth,fit,e)])},{label:'score=0 的目标线',points:eps.map(e=>[e,0])}],'ε（fluctuation 参数）','score（无量纲）',solved.epsilon)+`<p class="result">自动求根：${solved.converged?'已收敛':'未收敛'}，${solved.iterations} 次迭代；数值容差为 10⁻¹²。竖线是自动 ε；手动 ε=${trial} 的预测在上表单列。拟合 g̃=[${fit.g.map(v=>f(v,3)).join(', ')}]。AIPW 总体偏差=${f(100*(M.aipw(truth,fit)-M.ate(truth)),5)} pp；独立误差乘积 B=${f(100*bias,5)} pp。</p><details><summary>展开精确总体恒等式与经验方程的区别</summary><p>此实验中使用已知 P₀，而不是 Pₙ。AIPW−ψ₀=${f(M.aipw(truth,fit)-M.ate(truth),10)}，乘积 B=${f(bias,10)}。TMLE−ψ₀=${f(solved.estimate-M.ate(truth),10)}，更新后乘积 B(Q*,g̃)=${f(M.nuisanceBias(truth,solved.updated),10)}。自动 targeting 只让总体加权残差为零；用同一人群 X 权重做 plug-in 后，中心化项也平均为零。真实数据的经验方程将 P₀ 替换成 Pₙ，数学上方程零的证明仍成立，统计偏差与推断另需正文条件。</p><p>只有 Q 正确时 ε=0。只有 g 正确时目标被恢复，但 Q* 未必逐点等于 Q₀。两者都错时没有一致性保证，表中估计应逐个对照真值，不能预设 TMLE 必定更接近。</p></details>`;
  });
  for(const button of root.querySelectorAll('[data-preset]'))button.addEventListener('click',()=>{const values={Q:[0,1],g:[.12,0],'both-wrong':[.12,.5],'both-correct':[0,0]}[button.dataset.preset];$(root,'#fit-b').value=values[0];$(root,'#fit-lambda').value=values[1];$(root,'#trial-epsilon').value=0;run();});
}

const labs={0:lab0,1:lab1,2:lab2,3:lab3,4:lab4,5:lab5,6:lab6,7:lab7,8:lab8};
for(const root of document.querySelectorAll('[data-lab]')) {
  const fn=labs[Number(root.dataset.lab)];if(!fn)throw Error(`未实现实验 ${root.dataset.lab}`);fn(root);
}
mountCaseWorkbenches(document);
const articles=[...document.querySelectorAll('.chapter')],visited=new Set();
function fitInlineMath(){
  for(const el of document.querySelectorAll('.chapter:not([hidden]) .inline-math')){
    const wide=el.scrollWidth>el.clientWidth+1;
    if(wide){el.tabIndex=0;el.title='公式较长，可横向滑动；聚焦后可按左右键';}
    else{el.removeAttribute('tabindex');el.removeAttribute('title');}
  }
}
window.addEventListener('resize',fitInlineMath);
document.fonts.ready.then(fitInlineMath);
function navigate(){const match=location.hash.match(/^#chapter-(\d+)$/);const n=match?Number(match[1]):Number(articles[0].dataset.number);const active=articles.find(a=>Number(a.dataset.number)===n)||articles[0];for(const a of articles)a.hidden=a!==active;requestAnimationFrame(fitInlineMath);for(const link of document.querySelectorAll('nav a')){if(link.dataset.chapter===active.dataset.number)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');}document.title=`${active.querySelector('h1').textContent} · EIF`;document.getElementById('reading-status').textContent=`已标记学习 ${visited.size} / ${articles.length} 章`;}
for(const a of articles)$(a,'.mark-read').addEventListener('click',e=>{visited.add(a.dataset.number);e.target.textContent='本章已标记学习 ✓';navigate();});
window.addEventListener('hashchange',()=>{navigate();document.getElementById('main').focus();window.scrollTo(0,0);});navigate();
