"""Build a standalone interactive HTML from EIF_Tutorial_v1.md.

Dependencies for build-time only: mistune; runtime uses plain JS + SVG. MathJax
is loaded from a CDN when online; the interactive mathematics does not depend
on it.
"""
from pathlib import Path
import re
import mistune
import subprocess
import json
import html as htmlmod
import os

ROOT = Path(__file__).resolve().parent
source = (ROOT / 'EIF_Tutorial_v1.md').read_text(encoding='utf8')
markdown = mistune.create_markdown(plugins=['table','strikethrough','math'])


def to_html(md):
    # Convert original LaTeX display delimiters to the Markdown math plugin's
    # display delimiter, preserving formula source for MathJax.
    md = re.sub(r'\\\[\s*(.*?)\s*\\\]', lambda m: '\n\n$$\n'+m.group(1).strip()+'\n$$\n\n', md, flags=re.S)
    return markdown(md)

parts = re.split(r'(?=^## [1-8]\. )', source, flags=re.M)
intro = re.sub(r'^# From Means to TMLE\n## 一本可以动手验证的 Efficient Influence Function 入门教程\n', '', parts[0])
chapter_parts=[]
appendix=''
for p in parts[1:]:
    mm=re.match(r'^## (\d+)\.\s+([^\n]+)',p)
    if not mm:
        continue
    chno=int(mm.group(1))
    # The last chapter is followed by an appendix separated by horizontal rule.
    if chno==8 and '\n## 读完之后应能回答' in p:
        p, tail=p.split('\n## 读完之后应能回答',1)
        appendix='## 读完之后应能回答'+tail
    chapter_parts.append((chno,mm.group(2),p))
assert len(chapter_parts)==8

navlabels=['均值的 IF','点质量扰动','分布分解','ATE EIF 的构建','Pathwise derivative','Tangent space','效率下界','从 EIF 到 TMLE']
nav=''.join(f'<a class="navitem" href="#chapter-{i}"><span>{i:02d}</span><span>{n}</span></a>' for i,n in enumerate(navlabels,1))
chapters='\n'.join(f'<section id="chapter-{n}" class="chapter" tabindex="-1"><div class="eyebrow">CHAPTER {n:02d} OF 08</div>{to_html(md)}<div class="lab" id="lab-{n}" aria-label="第 {n} 章交互实验"></div><div class="chapter-end"><a class="next-link" href="#chapter-{n+1 if n<8 else "afterword"}">{"下一章 →" if n<8 else "阅读总结 →"}</a></div></section>' for n,_,md in chapter_parts)

style=r'''
:root{--bg:#f7f8f7;--paper:#fff;--text:#172a2d;--muted:#5f7073;--line:#d9e1e0;--teal:#116f70;--tealLight:#dff1ef;--orange:#b96d2d;--orangeLight:#f9ecdb;--blue:#42688a;--shadow:0 12px 45px rgba(29,62,66,.055)}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.78 -apple-system,BlinkMacSystemFont,"PingFang SC","Noto Sans CJK SC","Microsoft YaHei",Arial,sans-serif}
a{color:var(--teal)}a:hover{color:#064e4d}.layout{display:grid;grid-template-columns:270px minmax(0,1fr);max-width:1500px;margin:auto}
.sidebar{position:sticky;top:0;height:100vh;padding:26px 17px 25px 28px;border-right:1px solid var(--line);background:#f2f5f4;overflow-y:auto;display:flex;flex-direction:column;gap:20px}
.brand{font-weight:800;font-size:21px;line-height:1.3;letter-spacing:-.035em}.brand small{font-weight:500;color:var(--muted);font-size:12px;display:block;letter-spacing:0;margin-top:5px}.rail-title{font-size:11px;color:var(--muted);font-weight:800;text-transform:uppercase;letter-spacing:.15em}
.nav{display:flex;flex-direction:column;gap:4px}.navitem{display:flex;align-items:center;gap:12px;padding:10px 10px;border-radius:9px;color:#4e6266;text-decoration:none;font-size:13px;line-height:1.45;font-weight:570}.navitem span:first-child{font:700 11px/1 monospace;color:#859596}.navitem:hover{background:#e7eeed}.navitem.active{color:var(--teal);background:#dcebea}.navitem.active span:first-child{color:var(--teal)}
.sidebar-bottom{margin-top:auto;font-size:12px;color:var(--muted);line-height:1.7}.sidebar-bottom a{color:inherit}.progress{height:5px;border-radius:5px;background:#dbe5e4;overflow:hidden;margin:7px 0}.progress>div{width:12.5%;height:100%;background:var(--teal);transition:width .3s}
.content{max-width:990px;width:100%;padding:26px clamp(24px,5vw,72px) 100px;margin:0 auto}
.hero{padding:60px 0 50px}.kicker{font:800 11px/1.5 monospace;letter-spacing:.14em;color:var(--teal);text-transform:uppercase}.hero h1{font-size:clamp(34px,4.6vw,60px);letter-spacing:-.055em;line-height:1.13;margin:18px 0 15px;font-weight:760}.lede{font-size:clamp(16px,1.5vw,21px);line-height:1.66;color:#4c6567;max-width:770px;margin:0 0 22px}.pillrow{display:flex;gap:8px;flex-wrap:wrap;margin:20px 0}.pill{font-size:12px;border:1px solid #ccdad9;padding:5px 12px;border-radius:40px;color:#4f6869}.quick{background:var(--tealLight);color:#165d5a;border-radius:14px;padding:18px 23px;font-size:14px;line-height:1.7;margin:26px 0}
.chapter{background:var(--paper);border:1px solid var(--line);border-radius:19px;box-shadow:var(--shadow);padding:clamp(22px,3.8vw,47px);margin:0 0 42px;scroll-margin-top:20px}.eyebrow{font:800 12px/1 monospace;letter-spacing:.15em;color:var(--teal);margin-bottom:20px}.chapter h2{font-size:clamp(23px,2.7vw,34px);line-height:1.3;letter-spacing:-.025em;margin:0 0 23px}.chapter h3{font-size:20px;line-height:1.3;margin:38px 0 13px}.chapter p{margin:13px 0}.chapter strong{font-weight:700}.chapter blockquote{margin:23px 0;background:#f1f6f5;padding:10px 20px;border-left:3px solid var(--teal)}.chapter code{font:500 .89em/1.4 "SFMono-Regular",Consolas,monospace;padding:2px 5px;border-radius:4px;background:#f3f6f7;color:#2f5c62}.chapter table{border-collapse:collapse;width:100%;overflow:auto;display:block;font-size:13px;margin:20px 0}.chapter th{text-align:left;background:#f1f5f4}.chapter td,.chapter th{padding:10px 12px;border-bottom:1px solid #dfe8e6;white-space:nowrap}.chapter ul,.chapter ol{padding-left:24px}.chapter .math{overflow-x:auto;font-size:14px;background:#f8faf9;border:1px solid #e7eeec;border-radius:9px;padding:13px 9px;margin:18px 0;text-align:center}.chapter hr{border:0;border-top:1px solid var(--line);margin:42px 0}
.lab{border:1px solid #cbdedb;background:linear-gradient(145deg,#f3faf8,#f8faf9);padding:24px;border-radius:14px;margin:30px 0 8px}.lab h3{font-size:18px;margin:0 0 6px}.lab .lab-intro{font-size:13px;color:#547072;margin:4px 0 18px;line-height:1.7}.lab label{font-size:13px;font-weight:690}.lab .controls{display:flex;gap:16px 22px;flex-wrap:wrap;align-items:flex-end;margin:12px 0 18px}.lab .control{min-width:145px;flex:1}.lab select,.lab button{font-family:inherit;color:var(--text);font-size:13px;background:#fff;border:1px solid #bcd0cf;border-radius:8px;padding:9px 12px;cursor:pointer}.lab select{width:100%;margin-top:6px}.lab button:hover{border-color:var(--teal)}.lab input[type=range]{width:100%;accent-color:var(--teal);cursor:pointer;margin:11px 0 5px}.lab output{font-size:13px;color:var(--teal);font-weight:750}.metricrow{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:9px;margin:17px 0}.metric{border:1px solid #dae7e3;background:#fff;border-radius:10px;padding:13px 15px;min-width:0}.metric .k{font-size:11px;color:#5d7676;line-height:1.4}.metric .v{font-size:25px;letter-spacing:-.025em;font-weight:740;line-height:1.55;white-space:nowrap}.metric .v.small{font-size:19px}.metric .desc{color:#819193;font-size:11px}.note{background:#e2f0ed;border-left:3px solid var(--teal);padding:12px 15px;font-size:13px;border-radius:5px;color:#315f61;margin:13px 0}.note.warn{background:var(--orangeLight);border-left-color:var(--orange);color:#80552d}
.viz{background:white;border:1px solid #dce8e6;border-radius:12px;padding:12px;margin:16px 0;min-width:0}.viz svg{width:100%;height:auto;display:block;overflow:visible}.plotlegend{display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:#4c6466;margin:8px 0}.dot{display:inline-block;height:8px;width:8px;border-radius:50%;margin-right:6px;background:var(--teal)}.dot.orange{background:var(--orange)}.barrow{display:grid;grid-template-columns:90px 1fr 50px;align-items:center;gap:10px;margin:9px 0;font-size:12px}.bartrack{height:11px;background:#edf3f2;border-radius:6px;overflow:hidden}.barfill{height:100%;background:var(--teal);border-radius:6px}.barfill.alt{background:var(--orange)}.minor{color:#72878a;font-size:12px}.chapter-end{display:flex;justify-content:flex-end;margin-top:22px}.next-link{text-decoration:none;font-size:13px;border:1px solid #b9cfce;padding:8px 17px;border-radius:9px;font-weight:680}
.afterword{padding:18px 0 40px}.afterword h2{font-size:24px;letter-spacing:-.02em}.afterword ol{max-width:800px}.foot{font-size:12px;color:#6c8584;padding:30px 0;border-top:1px solid var(--line)}
@media(max-width:1000px){.layout{grid-template-columns:225px minmax(0,1fr)}.sidebar{padding:21px 12px}.content{padding:22px 24px 80px}.chapter{padding:26px}}
@media(max-width:720px){.layout{display:block}.sidebar{position:relative;height:auto;padding:14px 16px;gap:7px}.brand{font-size:16px}.brand small,.rail-title,.sidebar-bottom,.progress{display:none}.nav{display:flex;overflow-x:auto;gap:2px;flex-direction:row;scrollbar-width:thin}.navitem{white-space:nowrap;padding:8px;font-size:12px}.content{padding:10px 15px 55px}.hero{padding:38px 8px 18px}.chapter{margin-bottom:23px;border-radius:13px;padding:21px 17px;scroll-margin-top:12px}.lab{padding:15px}.lab .control{min-width:120px}.chapter .math{font-size:12px}}
'''

js=r'''
'use strict';
const $=id=>document.getElementById(id);const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const q0=[.70,.20],q1=[.80,.50],g0=[.20,.80],basePx=[.5,.5],baseTau=[.10,.30],basePsi=.2;
const fmt=(x,n=3)=>Number(x).toFixed(n),sign=(x,n=3)=>(x>=0?'+':'')+fmt(x,n),pct=x=>fmt(100*x,1)+'%',pp=x=>sign(100*x,2)+' pp';
const range=(a,b,count=50)=>Array.from({length:count+1},(_,i)=>a+(b-a)*i/count);
function metrics(items){return '<div class="metricrow">'+items.map(o=>`<div class="metric"><div class="k">${o[0]}</div><div class="v ${o[3]||''}">${o[1]}</div>${o[2]?`<div class="desc">${o[2]}</div>`:''}</div>`).join('')+'</div>';}
function plot(el,series,xDomain,yDomain,mark=null){
 const W=620,H=250,L=52,R=13,T=15,B=37,iw=W-L-R,ih=H-T-B;
 const X=v=>L+(v-xDomain[0])/(xDomain[1]-xDomain[0])*iw;
 const Y=v=>T+ih-(v-yDomain[0])/(yDomain[1]-yDomain[0])*ih;
 let s=`<svg role="img" aria-label="变化曲线" viewBox="0 0 ${W} ${H}">`;
 for(let j=0;j<=4;j++){let v=yDomain[0]+(yDomain[1]-yDomain[0])*j/4;let yy=Y(v);s+=`<line x1="${L}" y1="${yy}" x2="${W-R}" y2="${yy}" stroke="#e4ece9" stroke-width="1"/><text x="${L-8}" y="${yy+4}" text-anchor="end" fill="#789092" font-size="11">${(100*v).toFixed(1)}%</text>`;}
 for(let j=0;j<=4;j++){let v=xDomain[0]+(xDomain[1]-xDomain[0])*j/4;let xx=X(v);s+=`<text x="${xx}" y="${H-12}" text-anchor="middle" fill="#789092" font-size="11">${v.toFixed(2)}</text>`;}
 series.forEach((z,i)=>{let path=z.pts.map((p,k)=>(k?'L':'M')+X(p[0]).toFixed(2)+' '+Y(p[1]).toFixed(2)).join(' ');s+=`<path d="${path}" fill="none" stroke="${z.color||'#116f70'}" stroke-width="${i===0?3:2}" ${i?'stroke-dasharray="7 5"':''}/>`;});
 if(mark!==null){let xx=X(mark);s+=`<line x1="${xx}" x2="${xx}" y1="${T}" y2="${H-B}" stroke="#90a5a4" stroke-dasharray="3 4"/>`;series.forEach(z=>{let pts=z.pts;let low=pts.reduce((a,b)=>Math.abs(a[0]-mark)<Math.abs(b[0]-mark)?a:b);s+=`<circle cx="${xx}" cy="${Y(low[1])}" r="4.5" fill="${z.color}" stroke="white" stroke-width="1.5"/>`;});}
 s+='</svg>';$(el).innerHTML=s;
}
function init1(){
 $('lab-1').innerHTML=`<h3>实验 1 · 亲手改变均值</h3><p class="lab-intro">原始分布 Y={0,1,3}，P={0.20,0.50,0.30}；向选定取值加入一小部分质量 t。</p><div class="controls"><div class="control"><label>增加的取值 z</label><select id="meanZ"><option value="0">Y = 0</option><option value="1">Y = 1</option><option value="3" selected>Y = 3</option></select></div><div class="control"><label>扰动比例 t · <output id="meanTV">8%</output></label><input id="meanT" type="range" min="0" max="20" value="8" step="1"></div></div><div id="meanMetrics"></div><div class="viz" id="meanProbs"></div><div class="viz" id="meanChart"></div><div class="plotlegend"><span><i class="dot"></i>真实均值</span><span><i class="dot orange"></i>导数给出的一阶线性预测</span></div><div class="note">观察：均值是一个线性 functional，所以这里的一阶预测对任何 t 都是精确的。这一性质并不适用于所有 estimands。</div>`;
 $('meanZ').onchange=upd1;$('meanT').oninput=upd1;upd1();
}
function upd1(){let z=Number($('meanZ').value),t=Number($('meanT').value)/100,ys=[0,1,3],p=[.2,.5,.3],mu=1.4,d=z-mu,pt=p.map((v,i)=>(1-t)*v+(ys[i]===z?t:0)),mup=pt.reduce((a,v,i)=>a+v*ys[i],0);
 $('meanTV').textContent=Math.round(t*100)+'%';$('meanMetrics').innerHTML=metrics([['原始均值 μ',fmt(mu,2)],['IF(z) = z − μ',sign(d,2)],['更新后的均值',fmt(mup,3)]]);
 $('meanProbs').innerHTML='<div class="minor">扰动前 / 扰动后的概率质量</div>'+ys.map((v,i)=>`<div class="barrow"><span>Y = ${v}</span><div><div class="bartrack"><div class="barfill" style="width:${p[i]*100}%"></div></div><div class="bartrack" style="margin-top:3px"><div class="barfill alt" style="width:${pt[i]*100}%"></div></div></div><span>${pct(pt[i])}</span></div>`).join('');
 plot('meanChart',[{color:'#116f70',pts:range(0,.2,40).map(t0=>[t0,mu+t0*d])},{color:'#b96d2d',pts:range(0,.2,40).map(t0=>[t0,mu+t0*d])}],[0,.2],[Math.min(mu,mu+.2*d)-.08,Math.max(mu,mu+.2*d)+.08],t);
}
function init2(){
 $('lab-2').innerHTML=`<h3>实验 2 · 点质量方向与 score</h3><p class="lab-intro">把新增点 z 对应的 score 写在每个可能的原始观测值上，并验证 E[D·S]=D(z)。</p><div class="controls"><div class="control"><label>新增点 z</label><select id="pointZ"><option value="0">0</option><option value="1">1</option><option value="3" selected>3</option></select></div></div><div id="pointMetrics"></div><div class="viz" id="pointTable"></div><div class="note">当 p(z) 很小，score S_z(z)=1/p(z)−1 会很大。注意这里的 score 是分布路径的对数导数，不是 propensity score。</div>`;
 $('pointZ').onchange=upd2;upd2();
}
function upd2(){let ys=[0,1,3],p=[.2,.5,.3],z=Number($('pointZ').value),D=ys.map(v=>v-1.4),S=ys.map((v,i)=>(v===z?1/p[i]:0)-1),res=p.reduce((v,pi,i)=>v+pi*D[i]*S[i],0),meanS=p.reduce((v,pi,i)=>v+pi*S[i],0),meanD=p.reduce((v,pi,i)=>v+pi*D[i],0);
 $('pointMetrics').innerHTML=metrics([['新增点的 IF',sign(z-1.4,3)],['E[D × S]',sign(res,3)],['E[S] / E[D]',fmt(meanS,2)+' / '+fmt(meanD,2),'']]);
 $('pointTable').innerHTML=`<table><thead><tr><th>原始观测 y</th><th>P(y)</th><th>D(y)=y−μ</th><th>S_z(y)</th></tr></thead><tbody>${ys.map((v,i)=>`<tr><td>${v}</td><td>${fmt(p[i],2)}</td><td>${sign(D[i],2)}</td><td>${sign(S[i],3)}</td></tr>`).join('')}</tbody></table>`;
}
function init3(){
 $('lab-3').innerHTML=`<h3>实验 3 · 分布的三个部件</h3><p class="lab-intro">两类患者的治疗效果固定为 10 pp 和 30 pp。只改变 X 比例与治疗机制 g，观察真实 ATE 与直接比较的分离。</p><div class="controls"><div class="control"><label>高风险人群比例 · <output id="mixV">50%</output></label><input id="mixP" type="range" min="10" max="90" value="50" step="5"></div><div class="control"><label>治疗倾斜 · <output id="skewV">30 pp</output></label><input id="mixSkew" type="range" min="0" max="40" value="30" step="5"></div></div><div id="mixMetrics"></div><div class="viz" id="mixBars"></div><div class="note">重要：仅改变治疗分配 g 不会改变真实 ATE，但会改变直接比较的结果。g 仍决定哪些结局有机会被观察到。</div>`;
 $('mixP').oninput=upd3;$('mixSkew').oninput=upd3;upd3();
}
function upd3(){let p1=Number($('mixP').value)/100,p0=1-p1,s=Number($('mixSkew').value)/100,g=[.5-s,.5+s];let ate=p0*.1+p1*.3;
 let tden=p0*g[0]+p1*g[1],cden=p0*(1-g[0])+p1*(1-g[1]);let treated=(p0*g[0]*q1[0]+p1*g[1]*q1[1])/tden,control=(p0*(1-g[0])*q0[0]+p1*(1-g[1])*q0[1])/cden,naive=treated-control;
 $('mixV').textContent=pct(p1);$('skewV').textContent=Math.round(s*100)+' pp';$('mixMetrics').innerHTML=metrics([['真实 ATE',pp(ate)],['直接比较',pp(naive)],['直接比较的偏差',pp(naive-ate)],['g(低风险) / g(高风险)',pct(g[0])+' / '+pct(g[1]),'', 'small']]);
 let rows=[['真实 ATE',ate],['直接比较',naive]];
 $('mixBars').innerHTML=`<div class="minor">治疗效应，单位 pp；垂直刻度零点在中间</div><svg role="img" aria-label="真实ATE与直接比较" viewBox="0 0 620 156">${rows.map((o,i)=>{let y=40+i*67,w=clamp(Math.abs(o[1])*700,0,230),left=o[1]>=0?310:310-w;return `<text x="15" y="${y+15}" font-size="14" fill="#334e51">${o[0]}</text><line x1="310" x2="310" y1="${y-8}" y2="${y+29}" stroke="#aebdbb"/><rect x="${left}" y="${y-4}" width="${w}" height="25" rx="3" fill="${i===0?'#116f70':'#b96d2d'}"/><text x="${o[1]>=0?310+w+8:left-9}" y="${y+14}" text-anchor="${o[1]>=0?'start':'end'}" font-size="14" fill="#253d40">${pp(o[1])}</text>`;}).join('')}</svg>`;
}
function init4(){
 $('lab-4').innerHTML=`<h3>实验 4 · ATE EIF 的三项来自哪种扰动？</h3><p class="lab-intro">在离散模型中，选择一类观测 (x,a,y)，向其增加质量 t。比较精确计算的 ATE 与 EIF 一阶预测。</p><div class="controls"><div class="control"><label>X 风险</label><select id="cellX"><option value="0">低风险</option><option value="1" selected>高风险</option></select></div><div class="control"><label>A 治疗</label><select id="cellA"><option value="0">未治疗</option><option value="1" selected>治疗</option></select></div><div class="control"><label>Y 结局</label><select id="cellY"><option value="0">未改善</option><option value="1" selected>改善</option></select></div><div class="control"><label>扰动 t · <output id="cellTV">4%</output></label><input type="range" id="cellT" min="0" max="15" value="4" step="1"></div></div><div id="cellMetrics"></div><div class="viz" id="cellChart"></div><div class="plotlegend"><span><i class="dot"></i>精确 Ψ(Pₜ)</span><span><i class="dot orange"></i>一阶近似 Ψ(P)+tD*(o)</span></div><div class="note">试一试“高风险、不治疗、改善”：这类患者的治疗分配权重较大，且会使对照组预测改善率上升，因而对 ATE 的 EIF 贡献可能很负。</div>`;
 ['cellX','cellA','cellY'].forEach(id=>$(id).onchange=upd4);$('cellT').oninput=upd4;upd4();
}
function cellExact(x,a,y,t){let px=.5,g=g0[x],pa=a?g:1-g,q=a?q1[x]:q0[x],pCell=px*pa,qt=((1-t)*pCell*q+t*y)/((1-t)*pCell+t),alt=(a?1:-1)*(qt-q),pxt=(1-t)*px+t,pxOther=(1-t)*(1-px);return pxt*(baseTau[x]+alt)+pxOther*baseTau[1-x];}
function cellD(x,a,y){let pa=a?g0[x]:1-g0[x],q=a?q1[x]:q0[x];return [baseTau[x]-basePsi,(a?1:-1)*(y-q)/pa];}
function upd4(){let x=Number($('cellX').value),a=Number($('cellA').value),y=Number($('cellY').value),t=Number($('cellT').value)/100,d=cellD(x,a,y),ifv=d[0]+d[1],exact=cellExact(x,a,y,t),apx=basePsi+t*ifv;
 $('cellTV').textContent=Math.round(t*100)+'%';$('cellMetrics').innerHTML=metrics([['构成贡献 D_X',sign(d[0],3)],['结局贡献 D_Y',sign(d[1],3)],['完整 EIF D*',sign(ifv,3)],['精确 ATE / 线性预测',pct(exact)+' / '+pct(apx),'','small']]);
 let ar=range(0,.15,90),yvals=ar.map(v=>cellExact(x,a,y,v)).concat(ar.map(v=>basePsi+v*ifv)),low=Math.min(...yvals),high=Math.max(...yvals),pad=Math.max((high-low)*.15,.015);plot('cellChart',[{color:'#116f70',pts:ar.map(v=>[v,cellExact(x,a,y,v)])},{color:'#b96d2d',pts:ar.map(v=>[v,basePsi+v*ifv])}],[0,.15],[low-pad,high+pad],t);
}
function cells(){let arr=[];for(let x=0;x<=1;x++)for(let a=0;a<=1;a++)for(let y=0;y<=1;y++){let ga=a?g0[x]:1-g0[x],qq=a?q1[x]:q0[x],pr=.5*ga*(y?qq:1-qq);arr.push({x,a,y,p:pr,d:cellD(x,a,y).reduce((u,v)=>u+v,0)});}return arr;}
function tiltedPsi(kind,t){
 // Tilt exactly one factor of p(x,a,y)=p(x)p(a|x)p(y|a,x),
 // keeping the other two factors fixed at ALL t (not only first order).
 const pHigh=kind==='X'?expit(logit(.5)+t):.5;
 const pX=[1-pHigh,pHigh];
 const g=kind==='A'?g0.map(v=>expit(logit(v)+t)):g0;
 const qControl=kind==='Y'?q0.map(v=>expit(logit(v)+t)):q0;
 const qTreated=kind==='Y'?q1.map(v=>expit(logit(v)+t)):q1;
 const psi=pX.reduce((v,p,x)=>v+p*(qTreated[x]-qControl[x]),0);
 const cc=cells(),s=cc.map(v=>kind==='X'?v.x-.5:kind==='A'?v.a-g0[v.x]:v.y-(v.a?q1[v.x]:q0[v.x]));
 const cov=cc.reduce((v,c,i)=>v+c.p*c.d*s[i],0);
 return {psi,cov};
}
function init5(){
 $('lab-5').innerHTML=`<h3>实验 5 · 从一个点到任何平滑路径</h3><p class="lab-intro">通过条件指数倾斜只改变 p(X)、p(A|X) 或 p(Y|A,X) 中的一项，同时严格固定其他两项。观察 Ψ(Pₜ) 在 t=0 的导数与 E[D*S] 是否一致。</p><div class="controls"><div class="control"><label>扰动方向 S</label><select id="scoreType"><option value="X">S_X(X)：人群构成</option><option value="A">S_A(A|X)：治疗机制</option><option value="Y">S_Y(Y|A,X)：结局机制</option></select></div><div class="control"><label>路径参数 t · <output id="scoreTV">0.60</output></label><input type="range" id="scoreT" min="-100" max="100" value="60" step="5"></div></div><div id="scoreMetrics"></div><div class="viz" id="scoreChart"></div><div class="plotlegend"><span><i class="dot"></i>准确的 Ψ(Pₜ)</span><span><i class="dot orange"></i>由 E[D*S] 给出的切线</span></div><div class="note">选择治疗分配方向 S_A：整个路径的 ATE 都不变，因而对它的导数为零。这是 score 与 EIF 正交的一个可直接观察的例子。</div>`;
 $('scoreType').onchange=upd5;$('scoreT').oninput=upd5;upd5();
}
function upd5(){let k=$('scoreType').value,t=Number($('scoreT').value)/100,cur=tiltedPsi(k,t),slope=tiltedPsi(k,0).cov,vals=range(-1,1,100),exact=vals.map(v=>tiltedPsi(k,v).psi),linear=vals.map(v=>basePsi+slope*v),mi=Math.min(...exact,...linear),ma=Math.max(...exact,...linear),pad=Math.max(.015,(ma-mi)*.12);
 $('scoreTV').textContent=t.toFixed(2);$('scoreMetrics').innerHTML=metrics([['理论导数 E[D*S]',sign(slope,5)],['有限差分导数',sign((tiltedPsi(k,.0001).psi-tiltedPsi(k,-.0001).psi)/.0002,5)],['当前 Ψ(Pₜ)',pct(cur.psi)]]);
 plot('scoreChart',[{color:'#116f70',pts:vals.map((v,i)=>[v,exact[i]])},{color:'#b96d2d',pts:vals.map((v,i)=>[v,linear[i]])}],[-1,1],[mi-pad,ma+pad],t);
}
function init6(){
 $('lab-6').innerHTML=`<h3>实验 6 · 为什么 canonical gradient 方差最小？</h3><p class="lab-intro">二维几何示意：T 是允许的 score 方向，D* 在 T 内。任意与 T 正交的分量 u 都不改变导数表示，却会增大影响函数的范数。</p><div class="controls"><div class="control"><label>正交分量 u · <output id="orthV">1.00</output></label><input id="orthU" type="range" min="-200" max="200" value="100" step="10"></div></div><div id="orthMetrics"></div><div class="viz" id="orthSVG"></div><div class="note">这幅图演示的是受限制模型的投影逻辑；在完整非参数模型中，tangent space 就是整个 L²₀(P)，不再存在这些额外的正交方向。</div>`;
 $('orthU').oninput=upd6;upd6();
}
function upd6(){let u=Number($('orthU').value)/100,$v=$('orthV');$v.textContent=fmt(u,2);$('orthMetrics').innerHTML=metrics([['EIF 范数²',fmt(1,2)],['其他 IF 范数²',fmt(1+u*u,2)],['额外方差',fmt(u*u,2)]]);
 let cx=135,cy=210,scale=125,ex=cx+scale,ey=cy,ux=ex,uy=cy-u*65;
 $('orthSVG').innerHTML=`<svg role="img" aria-label="tangent space 投影" viewBox="0 0 600 340"><defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="#116f70"/></marker></defs><rect width="600" height="340" rx="8" fill="#fff"/><line x1="48" x2="560" y1="${cy}" y2="${cy}" stroke="#d5e2df" stroke-width="3"/><line x1="${cx}" y1="18" x2="${cx}" y2="315" stroke="#e1e8e6" stroke-dasharray="6 5"/><text x="478" y="${cy+23}" font-size="13" fill="#536c70">T (tangent space)</text><text x="${cx+10}" y="25" font-size="13" fill="#536c70">T⊥</text><line x1="${cx}" y1="${cy}" x2="${ex}" y2="${ey}" stroke="#116f70" stroke-width="4" marker-end="url(#arr)"/><line x1="${ex}" y1="${ey}" x2="${ux}" y2="${uy}" stroke="#b96d2d" stroke-width="3" stroke-dasharray="5 5"/><line x1="${cx}" y1="${cy}" x2="${ux}" y2="${uy}" stroke="#42688a" stroke-width="3"/><circle cx="${ux}" cy="${uy}" r="5" fill="#42688a"/><text x="${ex+12}" y="${ey-10}" font-size="13" fill="#116f70">D*</text><text x="${ux+12}" y="${uy-5}" font-size="13" fill="#42688a">D* + u</text><text x="${ex+7}" y="${(ey+uy)/2+4}" font-size="13" fill="#b96d2d">u</text><text x="${cx-15}" y="${cy+22}" font-size="12" fill="#7a8c8e">0</text></svg>`;
}
function effVar(r){let g=[r,1-r],v=.01;for(let x=0;x<2;x++)v+=.5*(q1[x]*(1-q1[x])/g[x]+q0[x]*(1-q0[x])/(1-g[x]));return v;}
function init7(){
 $('lab-7').innerHTML=`<h3>实验 7 · Positivity 与效率界</h3><p class="lab-intro">固定结局机制和真实 ATE=20 pp，只改变 propensity overlap 与样本量。观察可达到的渐近方差下界如何变化。</p><div class="controls"><div class="control"><label>低风险患者的 g(0) · <output id="overlapV">20%</output></label><input id="overlapR" type="range" min="5" max="50" value="20" step="5"></div><div class="control"><label>样本量 n · <output id="sampleV">500</output></label><input id="sampleN" type="range" min="100" max="2000" value="500" step="100"></div></div><div id="effMetrics"></div><div class="viz" id="effChart"></div><div class="plotlegend"><span><i class="dot"></i>EIF 的 Var(D*)</span></div><div class="note warn">这是 efficiency bound 而非某个具体估计器在有限样本中的实际误差。小样本、overfitting 与权重截断等因素可能使实际表现显著不同。</div>`;
 $('overlapR').oninput=upd7;$('sampleN').oninput=upd7;upd7();
}
function upd7(){let r=Number($('overlapR').value)/100,n=Number($('sampleN').value),v=effVar(r),se=Math.sqrt(v/n),curve=range(.05,.5,90).map(t=>[t,effVar(t)]);
 $('overlapV').textContent=pct(r);$('sampleV').textContent=n; $('effMetrics').innerHTML=metrics([['Var(D*)',fmt(v,3)],['理论标准误',pp(se)],['95% CI 理论半宽',pp(1.96*se)],['真实 ATE','+20.00 pp']]);
 plot('effChart',[{color:'#116f70',pts:curve}],[.05,.5],[0,Math.max(...curve.map(o=>o[1]))*1.1],r);
}
function logit(p){return Math.log(p/(1-p));}function expit(z){return 1/(1+Math.exp(-z));}
function modifiedQ(b){return {q0:[clamp(.70+b,.001,.999),clamp(.20+.5*b,.001,.999)],q1:[clamp(.80-.5*b,.001,.999),clamp(.50-b,.001,.999)]};}
function tmleCalc(b,l){let q=modifiedQ(b),g=g0.map(v=>v*(1-l)+.5*l),Q0=q.q0,Q1=q.q1;
 let qStar=e=>({q0:Q0.map((v,x)=>expit(logit(v)-e/(1-g[x]))),q1:Q1.map((v,x)=>expit(logit(v)+e/g[x]))});
 let score=e=>{let s=qStar(e);return .5*([0,1].reduce((v,x)=>v+g0[x]/g[x]*(q1[x]-s.q1[x])-(1-g0[x])/(1-g[x])*(q0[x]-s.q0[x]),0));};
 let low=-12,high=12;for(let k=0;k<90;k++){let mid=(low+high)/2;if(score(mid)>0)low=mid;else high=mid;}
 let eps=(low+high)/2,st=qStar(eps),pQ=.5*(Q1[0]+Q1[1]-Q0[0]-Q0[1]),pTMLE=.5*(st.q1[0]+st.q1[1]-st.q0[0]-st.q0[1]);return {pQ,pTMLE,pAIPW:pQ+score(0),score0:score(0),scoreStar:score(eps),eps,g,q,st};
}
function init8(){
 $('lab-8').innerHTML=`<h3>实验 8 · 用 EIF 找到 targeted update</h3><p class="lab-intro">在总体期望层面模拟估计 Q、g：改变初始 outcome model 的误设程度，以及 propensity model 向 0.5 错误收缩的程度。求使 EIF 加权残差均值为零的 logistic fluctuation 系数 ε。</p><div class="controls"><div class="control"><label>Q 的结构性误差 b · <output id="qbV">+0.12</output></label><input id="qb" type="range" min="-15" max="15" value="12" step="3"></div><div class="control"><label>g 的误设比例 · <output id="gmV">50%</output></label><input id="gm" type="range" min="0" max="100" value="50" step="10"></div></div><div class="controls"><button id="presetQ">只有 Q 正确</button><button id="presetG">只有 g 正确</button><button id="presetBoth">两者都正确</button><button id="presetNeither">两者都错误</button></div><div id="tmleMetrics"></div><div class="viz" id="tmleBars"></div><div id="tmleDetail"></div><div class="note">注意这是一项总体积分的数学实验，没有有限样本随机误差。TMLE 不保证两个 nuisance models 同时错误时的数值一定比 AIPW 更接近真实效果。</div>`;
 $('qb').oninput=upd8;$('gm').oninput=upd8;
 $('presetQ').onclick=()=>{$('qb').value=0;$('gm').value=100;upd8()};
 $('presetG').onclick=()=>{$('qb').value=12;$('gm').value=0;upd8()};
 $('presetBoth').onclick=()=>{$('qb').value=0;$('gm').value=0;upd8()};
 $('presetNeither').onclick=()=>{$('qb').value=12;$('gm').value=50;upd8()};upd8();
}
function upd8(){let b=Number($('qb').value)/100,l=Number($('gm').value)/100,o=tmleCalc(b,l);
 $('qbV').textContent=sign(b,2);$('gmV').textContent=pct(l);
 $('tmleMetrics').innerHTML=metrics([['Q plug-in ATE',pp(o.pQ)],['AIPW ATE',pp(o.pAIPW)],['TMLE ATE',pp(o.pTMLE)],['targeting ε',sign(o.eps,4)]]);
 let rows=[['真实 ATE',basePsi],['初始 Q',o.pQ],['AIPW',o.pAIPW],['TMLE',o.pTMLE]];
 $('tmleBars').innerHTML=`<div class="minor">与目标 20 pp 的比较</div>`+rows.map((r,i)=>{let xx=clamp(r[1]*100/50*100,0,100);return `<div class="barrow" style="grid-template-columns:85px 1fr 84px"><span>${r[0]}</span><div class="bartrack"><div class="barfill ${i===1?'alt':''}" style="width:${xx}%"></div></div><span>${pp(r[1])}</span></div>`;}).join('');
 $('tmleDetail').innerHTML=metrics([['更新前 E[H(Y−Q)]',sign(o.score0,6),'','small'],['更新后 E[H(Y−Q*)]',sign(o.scoreStar,6),'','small']])+`<p class="minor">对照组 q(0,X) 更新：${o.q.q0.map((v,i)=>pct(v)+' → '+pct(o.st.q0[i])).join('； ')}<br>治疗组 q(1,X) 更新：${o.q.q1.map((v,i)=>pct(v)+' → '+pct(o.st.q1[i])).join('； ')}</p>`;
}
function verify(){
 const eq=(a,b,tol=1e-7)=>{if(!Number.isFinite(a)||Math.abs(a-b)>tol)throw Error(`self-test failed: ${a} vs ${b}`);};
 eq(cells().reduce((a,v)=>a+v.p,0),1);eq(cells().reduce((a,v)=>a+v.p*v.d,0),0);
 for(let x=0;x<=1;x++)for(let a=0;a<=1;a++)for(let y=0;y<=1;y++){
   let d=cellD(x,a,y).reduce((s,v)=>s+v,0),diff=(cellExact(x,a,y,1e-6)-cellExact(x,a,y,0))/1e-6;eq(d,diff,1e-4);
 }
 for(let k of ['X','A','Y']){let slope=tiltedPsi(k,0).cov,der=(tiltedPsi(k,.00001).psi-tiltedPsi(k,-.00001).psi)/.00002;eq(slope,der,1e-7);}eq(tiltedPsi('A',.3).psi,basePsi,1e-8);
 for(const [b,l] of [[0,1],[.12,0],[0,0],[.12,.5]]){let o=tmleCalc(b,l);eq(o.scoreStar,0,1e-9);if(b===0||l===0){eq(o.pTMLE,basePsi,1e-8);eq(o.pAIPW,basePsi,1e-8);}}
 window.__EIF_TESTS_PASSED__=true;return true;
}
window.addEventListener('DOMContentLoaded',()=>{
 for(let i=1;i<=8;i++)window['init'+i]();
 let items=[...document.querySelectorAll('.chapter[id^=\"chapter-\"]')],links=[...document.querySelectorAll('.navitem')],progress=$('readingProgress');
 const io=new IntersectionObserver(entries=>{let visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(visible){let i=items.indexOf(visible.target);links.forEach((e,j)=>e.classList.toggle('active',i===j));progress.style.width=((i+1)/8*100)+'%';}},{rootMargin:'-15% 0px -65% 0px',threshold:0});items.forEach(v=>io.observe(v));
 verify();
});
'''

intro_html=to_html(intro)
appendix_html=to_html(appendix)
body=f'''<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="description" content="交互式半参数统计教程：从均值影响函数到 ATE EIF、pathwise differentiability、tangent space、semiparametric efficiency 和 TMLE。">
<title>From Means to TMLE · Interactive EIF Tutorial</title>
<style>{style}</style>
</head><body><div class="layout"><aside class="sidebar"><div class="brand">From Means to TMLE<small>INTERACTIVE EIF TUTORIAL · V1.0</small></div><div class="rail-title">Eight chapters</div><nav class="nav" aria-label="章节导航">{nav}</nav><div class="sidebar-bottom"><div class="rail-title">阅读进度</div><div class="progress"><div id="readingProgress"></div></div><p>严格推导 × 可调模拟 × 数值核验</p><a href="#afterword">延伸阅读 ↓</a></div></aside>
<main class="content"><header class="hero" id="top"><div class="kicker">Semiparametric statistics without the prerequisites</div><h1>Efficient Influence Functions<br>从均值到 TMLE</h1><p class="lede">不是先背诵 AIPW 公式，而是亲手扰动概率分布，看懂 EIF 为什么是那个样子，以及为何它决定了 TMLE 的更新方向。</p><div class="pillrow"><span class="pill">8 个循序渐进的章节</span><span class="pill">8 组交互式数学实验</span><span class="pill">同一个二元 ATE 示例</span><span class="pill">完整离线运行（含数学排版）</span></div><div class="quick">建议阅读顺序：先读每章的数学解释，再操作底部实验，最后检查公式成立的条件。本页面不依赖外部服务；数学公式与交互图表可在离线状态下使用。</div></header><section class="chapter intro" id="intro"><div class="eyebrow">BEFORE WE START</div><h2>同一组数据，贯穿整个教程</h2>{intro_html}</section>{chapters}<section id="afterword" class="afterword">{appendix_html}</section><footer class="foot">EIF Tutorial v1.0 · 全部数值实验使用明示的、有限离散数据生成分布；不声称代表真实临床数据。内容来源参考 Hines et al. (2022)、Fisher & Kennedy (2021)，并标注数学假设与简化范围。</footer></main></div>
<script>{js}</script></body></html>'''

# Pre-render TeX to SVG with a locally installed MathJax package.
# This makes the tutorial truly standalone, including its mathematical notation.
regex = re.compile(r'<div class="math">\$\$\s*(.*?)\s*\$\$</div>',re.S)
maths = [htmlmod.unescape(m.group(1)).strip() for m in regex.finditer(body)]
if maths:
    env=dict(os.environ)
    env['NODE_PATH']=env.get('NODE_PATH') or subprocess.check_output(['npm','root','-g'],text=True).strip()
    result=subprocess.run(['node',str(ROOT/'generate_math_svg.js')],input=json.dumps(maths,ensure_ascii=False),text=True,capture_output=True,check=True,env=env)
    svgs=json.loads(result.stdout)
    matches=iter(svgs)
    body=regex.sub(lambda m:'<div class="math rendered">'+next(matches)+'</div>',body)
    body=body.replace('.chapter .math{','.chapter .math.rendered mjx-container{max-width:100%;}.chapter .math{')
    print(f'Pre-rendered {len(maths)} mathematical equations as inline SVG')
out=ROOT/'EIF_Interactive_Tutorial.html'
out.write_text(body,encoding='utf8')
print(f'Created {out} ({len(body):,} characters)')
