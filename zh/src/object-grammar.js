import {rObjectName,rObjectToken,rStageCode,R_STAGE_NOTES} from './r-object-code.js';
/** Shared build/browser renderer: real objects occupy the operands of each expression. */
import {meanContamination} from '../../shared/js/object-data.js';
export const OBJECT_COLOURS=Object.freeze({outcomes:'blue','outcome-vector':'blue','treatment-vector':'amber','prediction-a0':'amber','prediction-a1':'amber','baseline-w':'teal','design-matrix':'teal',q0:'cyan',q1:'purple',qa:'selected',propensity:'green','q-coefficients':'slate','g-coefficients':'slate',probability:'slate','support-y':'blue',influence:'orange','support-influence':'orange','mean-contribution':'green','if-contribution':'green',risk:'blue','sample-size':'slate',events:'blue','mean-influence':'orange'});
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=(value,digits=6)=>Number.isInteger(value)?String(value):Math.abs(value)<1e-12?'0':Number(value.toFixed(digits)).toString();
const pretty=value=>typeof value==='number'?f(value):String(value);
const syntax=text=>`<span class="ov-syntax${text.trim()&&/^[+−\-×÷⊙*/=|(),.\s\[\]{}:;]+$/u.test(text.trim())?' ov-operator':''}">${escape(text)}</span>`;
const arrow=()=>'<span class="ov-arrow" aria-label="得到">→</span>';
export const OBJECT_STAGES=Object.freeze({
 'source':{chapter:0,title:'从同一份记录提取实际处理与结局',description:'每列保持原文件行序。矩阵容纳多列，向量每人一个值，标量只有一个数。这里只截取部分行用于阅读，模型与平均使用全部记录。'},
 'fit':{chapter:0,title:'用基线与实际处理拟合死亡风险',description:'W是15个原始基线变量；Z是编码后的17列设计矩阵，含截距。结局模型再加实际A，共18列。估计g时，A变成要预测的结果。此处只认识输入和输出，不要求先学会回归求解。'},
 'predict':{chapter:0,title:'保持基线不变，只更换预测输入A',description:'固定设计矩阵Z和同一套Q模型系数。输入A全1或全0时，输出分别是Q̂(1,W)或Q̂(0,W)；每个向量都有n项，同一行对应同一位患者的模型预测。'},
 'select':{chapter:0,title:'实际A逐行决定取哪一个预测',description:'Q̂(A,W)按原始A从Q̂(1,W)、Q̂(0,W)中选择。紫/青色格标出来源，同行标记i保持一致。原A和Y不会被预测输入覆盖。'},
 'estimate':{chapter:0,title:'先逐行相减，再对整列取平均',description:'两列预测相减仍是一列n个数；对全体求平均才将它汇总为一个标量。这里显示第8讲指定模型的初始代入估计，真实临床因果目标仍未知。'},
 'patient-mean':{chapter:1,title:'将全部死亡指标相加，再除以总人数',description:'每个i对应同一位真实患者。对全部5735个0/1求和得到死亡人数，再除以n。图中预览6行。'},
 'weighted-mean':{chapter:1,title:'按存活与死亡分组，计算同一个均值',description:'从这里起，两行依次表示结局y=0、1。p是组内人数除以5735；先逐项乘，再求和。'},
 'reweight':{chapter:1,title:'将原概率乘1−t，再向选定结局加入t',description:'固定原始结局Y，调整两类结局的概率权重。每个概率先乘1−t，再仅向选定结局z加t；两组权重相加仍是1。'},
 'changed-mean':{chapter:1,title:'新权重乘同一结局向量，得到新均值',description:'原始结局支持始终为0和1。按pₜ重新加权后，减去固定的原均值，就得到变化量。'},
 'change-rate':{chapter:1,title:'将均值变化除以替换比例，计算变化率',description:'t是无量纲概率替换比例，z是接收新增权重的0/1。均值对该混合路径恰为线性，所以变化率在非零t下完全相同。'},
 'linear-mean':{chapter:1,title:'合并z=0与z=1，得到同一条线性公式',description:'选择z=0或1只改变新增权重的位置。公式中原μ固定，分配律与消项如下逐行展开，得到精确等式。'},
 'lookup-rate':{chapter:1,title:'把输入结局与输出变化率配成一张函数表',description:'先算出两种输入的变化率，才给这个规则命名为均值的影响函数（influence function）。第4章将用同样的思路推导标准化风险差的EIF。'},
 'lookup-if':{chapter:1,title:'影响函数是一条规则；影响值是一次代入的输出',description:'D(z;P)=z−μ。P固定了μ；左列是可能输入，右列依次给出输入0、1时的输出。'},
 'patient-if':{chapter:1,title:'把同一条规则逐人应用，得到整列影响值',description:'每个实际Y_i减同一个参考μ，输出仍有5735项。这里固定P=P_n，所以μ的数值等于这份数据的样本均值。'},
 'mean-if':{chapter:1,title:'整列影响值先相加，再除以n',description:'均值零是全部带符号影响值平均后抵消；实际各项仍可正可负。六行只是显示窗口。'},
 'grouped-centre':{chapter:1,title:'展开两组加权项，说明平均为何为零',description:'这是按原P的概率加权。提出同一个常数μ后，概率和为1；两个总和相减得到0。'},
 'old-new':{chapter:1,title:'不更换函数，只更换平均所用的权重',description:'旧D_P始终减原μ。先用p平均，再用pₜ平均；只有前者保证为0。若重新中心化得到D_Pt，那是另一条函数。'},
 'survival':{chapter:1,title:'用1−Y计算存活概率及其影响值',description:'Y=1是30日死亡；1−Y才是30日存活。本章的终点是第30日的存活状态。'},
});
function rowCell(value,key,alignment,id,extra=''){
 const attr=alignment==='patient'?`data-record="${key}"`:alignment==='outcome'?`data-outcome="${key}"`:`data-feature="${escape(key)}"`;
 return `<span class="ov-cell ${extra}" ${attr} data-owner="${escape(id)}" aria-label="${alignment==='patient'?'原始行i='+key:alignment==='outcome'?'结局y='+key:'系数'+key}，值${escape(pretty(value))}"><small>${alignment==='patient'?'i='+key:alignment==='outcome'?'y='+key:escape(key)}</small><b>${escape(pretty(value))}</b></span>`;
}
export function vector(data,id,{values,math,julia,label,alignment='patient',colour,dimension,sourceIds}={}){
 const obj=data.objects[id]||{},actual=values??obj.values;
 if(!Array.isArray(actual))throw Error(`Missing vector values ${id}`);
 const align=alignment==='patient'&&obj.alignment?obj.alignment:alignment;
 let keys,indexes;
 if(align==='patient'){indexes=data.displayIndices;keys=data.rowNumbers;}
 else if(align==='feature'){const features=obj.featureKeys||data.featureNames;indexes=[0,1,2,actual.length-1];keys=indexes.map(i=>features[i]||String(i+1));}
 else {indexes=actual.map((_,i)=>i);keys=[0,1];}
 const cells=indexes.map((i,j)=>rowCell(actual[i],keys[j],align,id,sourceIds?`ov-from-${sourceIds[i]}`:''));
 const dims=dimension||`${actual.length} × 1`;
 return `<div class="ov-object ov-vector ov-${colour||OBJECT_COLOURS[id]||'slate'}" data-object="${escape(id)}" data-dim="${escape(dims)}" data-alignment="${align}" data-full-length="${actual.length}"><header><span data-math-name="${escape(math||obj.symbol||id)}" ${data.mode!=='math'?`data-${data.mode}-name="${escape(data.mode==='r'?rObjectName(julia||id):julia||id)}"`:''}>${escape(data.mode==='math'?(math||obj.symbol||id):data.mode==='r'?rObjectName(julia||id):julia||id)}</span><small>${escape(label||obj.label||id)}</small></header><div class="ov-bracket">${cells.join('')}${align==='patient'?'<span class="ov-ellipsis" aria-label="还有未显示的患者行">⋮</span>':align==='feature'?'<span class="ov-ellipsis">显示前三项和末项；其余系数省略</span>':''}</div><footer><b>${escape(dims)}</b><span>${align==='patient'?'逐人向量':align==='outcome'?'结局支持向量':'系数向量；按特征排列'}</span></footer></div>`;
}
export function scalar(id,value,{math=id,julia=id,label='标量',colour=OBJECT_COLOURS[id]||'slate',unit='',mode='math'}={}){
 return `<div class="ov-object ov-scalar ov-${colour}" data-object="${escape(id)}" data-dim="1" data-value="${value}"><header><span data-math-name="${escape(math)}" ${mode!=='math'?`data-${mode}-name="${escape(mode==='r'?rObjectName(julia):julia)}"`:''}>${escape(mode==='math'?math:mode==='r'?rObjectName(julia):julia)}</span><small>${escape(label)}</small></header><strong>${escape(pretty(value))}</strong><footer>1个数${unit?' · '+escape(unit):''}</footer></div>`;
}
function matrix(data,{kind='design',scenario='observed'}={}){
 const raw=kind==='raw',base=kind==='baseline',julia=data.mode!=='math';
 const columns=raw?['sex','age','swang1','dth30']:base?(julia?['male','age','race','…12项病史']:['男性指标','年龄','种族','…12项病史']):(julia?['1','male','age_z','…14列']:['1','男性指标','年龄标准分','…14列']);
 const actualCols=raw?4:base?15:17,dims=`${data.n} × ${actualCols}`;
 const id=raw?'raw-records':base?'baseline-w':'design-matrix';
 const rows=data.shown.map(r=>{
  const values=raw?[r.x?'Male':'Female',f(r.age,1),r.a?'RHC':'No RHC',r.y?'Yes':'No']:base?[r.x,f(r.age,1),r.race,'保留']: [1,r.x,f(r.w[2],3),'保留'];
  return `<div class="ov-matrix-row" data-record="${r.rowNumber}"><small>i=${r.rowNumber}</small>${values.map((v,j)=>`<span class="${raw&&j===2?'ov-cell-amber':raw&&j===3?'ov-cell-blue':''}">${escape(v)}</span>`).join('')}</div>`;
 });
 return `<div class="ov-object ov-matrix ov-teal" data-object="${id}" data-dim="${dims}" data-alignment="patient"><header><span>${raw?(julia?'rows所含字段':'原始记录字段'):base?'W原始基线':julia?'design · Z':'设计矩阵 Z'}</span><small>${raw?'原文件63字段中仅截取这4列':base?'原始age/race保留，另有12项既往史':'17列=截距+男性指标+年龄标准分+2列种族+12项病史'}</small></header><div class="ov-matrix-head"><span>行序</span>${columns.map(c=>`<span>${escape(c)}</span>`).join('')}</div>${rows.join('')}<span class="ov-ellipsis">⋮ ${raw?'完整原CSV保留全部63字段':'未显示行与列仍参与计算'}</span><footer><b>${dims}</b><span>${raw?'这里截取的字段矩阵':'设计/基线矩阵'}</span></footer></div>`;
}
const expr=(label,content)=>`<div class="ov-expression-scroll" tabindex="0" role="region" aria-label="${escape(label)}，可横向滚动"><div class="ov-expression" role="group" aria-label="${escape(label)}">${content}</div></div>`;
const code=(source,language='Julia')=>`<div class="ov-code" data-code-language="${language.toLowerCase()}"><span>对应的可运行${language}</span><pre tabindex="0"><code>${escape(source)}</code></pre></div>`;
const model=(name,label)=>`<div class="ov-model"><b>${escape(name)}</b><span>${escape(label)}</span><small>输入记录，输出概率</small></div>`;
export function renderObjectStage(stage,input,state={}){
 const data={...input,mode:state.mode||'math'},meta=OBJECT_STAGES[stage];if(!meta)throw Error(`Unknown object stage ${stage}`);
 const r=data.mode==='r',julia=data.mode!=='math',token=syntax;
 const syntaxR=text=>token(r?rObjectToken(text):text);
 const v=(id,options)=>vector(data,id,options),s=(id,val,options)=>scalar(id,val,{mode:data.mode,...options});
 let body='',snippet='',note='';
 if(stage==='source'){
  body=expr('按原始行序将真实RHC记录编码成A和Y列',matrix(data,{kind:'raw'})+syntaxR(julia?'rhc_observations(rows)':'按字段编码')+arrow()+v('treatment-vector',{julia:'a',math:'A',label:'实际RHC，0/1编码'})+v('outcomes',{julia:'y',math:'Y',label:'实际30日死亡，0/1编码'}));
  snippet='rows = read_rhc_rows(DEFAULT_SOURCE)\nobservations = rhc_observations(rows)\ny = [person.y for person in observations]';
  note=`共${data.n}条真实记录。这里用原文件行序i对应各图的同一条记录。第${data.rowNumbers.join('、')}行的A、Y在后面的图中仍对应同一行。`;
 }
 if(stage==='fit'){
  const design=matrix(data),a=v('treatment-vector',{julia:'a',math:'A',label:'实际接受处理'}),y=v('outcomes',{julia:'y',math:'Y',label:'要预测的结果'});
  body=expr('17列设计矩阵与实际A合并成18列，再以Y为结果拟合Q',julia?
   syntaxR('q_fit = fit_logistic(hcat(')+`<div class="ov-concat"><div class="ov-choice">${design}${syntaxR(',')}${a}</div><strong>按列合并：${data.n} × 18</strong></div>`+syntaxR('),')+y+syntaxR(')')+arrow()+model('q_fit','拟合死亡风险函数'):
   y+syntaxR('给定')+`<div class="ov-concat"><div class="ov-choice">${design}${syntaxR('|')}${a}</div><strong>按列合并：${data.n} × 18</strong></div>`+arrow()+model('Q̂','拟合死亡风险函数'));
  body+=`<details class="ov-extra-fit"><summary>用同一基线矩阵拟合接受RHC的概率</summary>${expr('以设计矩阵预测实际处理A得到g模型',julia?syntaxR('g_fit = fit_logistic(')+design+syntaxR(',')+a+syntaxR(')')+arrow()+model('g_fit','拟合接受RHC的概率')+syntaxR('g_fit.probabilities')+arrow()+v('propensity',{julia:'g',math:'ĝ(W)'}):a+syntaxR('给定')+design+arrow()+model('ĝ','拟合接受RHC的概率')+syntaxR('对同一基线逐人预测')+arrow()+v('propensity',{julia:'g',math:'ĝ(W)'}))}</details>`;
  snippet='g_fit = fit_logistic(design, a)\nq_fit = fit_logistic(hcat(design, a), y)';
  note=julia?'以上是prepare_full函数内部的真实代码，a、y在拟合阶段为Float64向量（0.0/1.0，与原整数编码信息相同）。fit_logistic的参数顺序为(设计矩阵, 结果向量)。hcat将17列design与1列a按列合并，共18列；估计g时以17列design为输入、a为结果。':'拟合Q时，以实际死亡Y为结果，将17列设计矩阵Z与实际处理A按列合并为18列输入。拟合g时，以实际处理A为结果，使用17列Z作输入。两种模型都保留同一患者行序，输出逐人的风险或处理概率。';
 }
 if(stage==='predict'){
  const scenario=state.scenario||'one',one=scenario==='one',actual=scenario==='observed';
  const aid=actual?'treatment-vector':one?'prediction-a1':'prediction-a0',qid=actual?'qa':one?'q1':'q0',pname=actual?'a':one?'ones(n)':'zeros(n)';
  const concatenated=`<div class="ov-concat"><div class="ov-choice">${matrix(data)}${syntaxR(julia?',':'|')}${v(aid,{math:actual?'实际A':one?'全1':'全0',julia:pname,label:actual?'预测输入=实际A':one?'预测输入，全为1':'预测输入，全为0'})}</div><strong>${r?'cbind后的输入':julia?'hcat后的输入':'按列合并后的输入'}：${data.n} × 18</strong></div>`;
  body=expr('固定基线和系数更换预测输入A得到同一行序的预测向量',syntaxR(julia?'expit.(hcat(':'expit((')+concatenated+syntaxR(julia?') *':') ×')+v('q-coefficients',{julia:'q_fit.coefficients',math:'β̂Q',label:'同一套Q模型系数',alignment:'feature'})+syntaxR(r?'))':')')+arrow()+v(qid,{julia:qid,math:actual?'Q̂(A,W)':one?'Q̂(1,W)':'Q̂(0,W)',sourceIds:actual?data.A.map(a=>a?'q1':'q0'):undefined}));
  snippet=actual?'qa = expit.(hcat(design, a) * q_fit.coefficients)':`q${one?1:0} = expit.(hcat(design, ${pname}) * q_fit.coefficients)`;
  note='矩阵相乘：n×18乘18×1，先得n×1线性预测；expit逐个转回概率。系数行按特征排列，不与患者行i对应。原始实际A保持不变；改变的只是给同一模型的预测输入。';
 }
 if(stage==='select'){
  body=expr('实际A作为逐行选择开关从q1或q0生成qa',v('treatment-vector',{math:'A',julia:'fit.a'})+syntaxR('逐行选择')+`<div class="ov-choice">${v('q1',{julia:'q1',math:'Q̂(1,W)'})}${v('q0',{julia:'q0',math:'Q̂(0,W)'})}</div>`+arrow()+v('qa',{math:'Q̂(A,W)',julia:'qa',sourceIds:data.A.map(a=>a?'q1':'q0')}));
  snippet='qa = fit.a .* q1 + (1 .- fit.a) .* q0';
  note=julia?'.*是逐元素乘法，.+是逐元素相加；这里两个同长向量用+相加同样是逐元素。A=1的行取紫色q1，A=0的行取青色q0。两列分别来自全A=1与全A=0的模型调用。':'按实际A逐行选择：A=1时，A乘Q̂(1,W)保留该项，(1−A)乘Q̂(0,W)变为0；A=0时正好相反。两项相加得到Q̂(A,W)。两列分别来自全A=1与全A=0的模型调用。';
 }
 if(stage==='estimate'){
  body=expr('两个预测向量逐元素相减再平均成初始风险差',`<div class="ov-update-anchor"><span class="ov-method">TMLE：第8讲在这两列更新Q</span><div class="ov-choice">${v('q1',{julia:'q1',math:'Q̂(1,W)'})}${syntaxR('−')}${v('q0',{julia:'q0',math:'Q̂(0,W)'})}</div></div>`+arrow()+v('risk-difference',{julia:'q1 .- q0',math:'Q̂1−Q̂0',label:'同一基线下的模型预测差'})+syntaxR(julia?'sum(·) / n':'全n人平均')+arrow()+`<div class="ov-update-anchor">${s('initial-risk',data.initialRiskDifference,{math:'Ψ̂plug',julia:'initial_estimate',label:'初始代入风险差',colour:'purple',unit:'概率差'})}<span class="ov-method ov-method-aipw">AIPW：第8讲在输出端加校正</span></div>`);
  snippet='initial_estimate = sum(q1 .- q0) / n';
  note=`先产生${data.n}个预测差，再平均；当前初始结果约${f(100*data.initialRiskDifference,5)}个百分点。第8讲将用EIF指导两处校正。切换展示窗口时，这个全队列平均保持相同。`;
 }

 if(meta.chapter===1){
  const c=meanContamination(data,{t:state.t??.1,z:state.z??1}),mu=data.mean.meanY,g=data.grouped;
  const sv=(id,values,math,julia,label,colour='slate')=>v(id,{values,math,julia,label,colour,alignment:'outcome'});
  const prob=()=>sv('probability',g.p,'p(y) · 原P','p',`${g.counts[0]}/n与${g.counts[1]}/n`);
  const yy=()=>sv('support-y',g.y,'可能结局 y','support_y','两行：存活与死亡','blue');
  const dd=()=>sv('support-influence',g.D,'D(y;P)','support_D','始终减去原μ','orange');
  const pt=()=>sv('new-probability',c.newP,'pₜ(y)','p_t',`新概率，z=${c.z}, t=${f(c.t)}`);
  const mm=()=>s('risk',mu,{math:'μ · 固定原P',julia:['patient-mean','patient-if'].includes(stage)?'risk':'mu',label:julia?'同值：mu = risk；固定原P':'参考分布P的固定均值',unit:'概率'});
  const mt=()=>s('new-risk',c.newMean,{math:'μₜ',julia:'mu_t',label:'新分布均值',colour:'blue',unit:'概率'});
  const tt=()=>s('step-size',c.t,{math:'t',julia:'t',label:'替换比例；无量纲'});
  const deriv=()=>s('derivative',c.derivative,{math:'z−μ',julia:'derivative',label:'每单位替换比例的变化率',colour:'orange'});
  const weighted=(id,values,math,julia,label,colour='green')=>sv(id,values,math,julia,label,colour);
  const algebra=(lines)=>`<ol class="ov-algebra">${lines.map(([formula,why])=>`<li><code>${escape(formula)}</code><span>${why}</span></li>`).join('')}</ol>`;
  if(stage==='patient-mean'){
   body=expr('完整Y向量求和除以人数得到标量风险',syntaxR(julia?'sum(':'Σᵢ(')+v('outcomes',{math:'Yᵢ',julia:'y',label:'每人一个实际结局'})+syntaxR(')')+arrow()+s('events',data.mean.sumY,{math:'M=ΣᵢYᵢ',julia:'events',label:'全部死亡人数',unit:'人'})+syntaxR('÷')+s('sample-size',data.n,{math:'n',julia:'n',label:'全部记录数',unit:'人'})+arrow()+mm());
   snippet='events = sum(y)\nrisk = events / n';
   note=`这里每条记录的权重是1/${data.n}，总事件数${data.mean.sumY}；${julia?'mean':'对全体求平均'}只输出一个概率${f(mu)}。Y=0的行也进入分母。`;
  }
  if(stage==='weighted-mean'){
   body=`<div class="ov-grouping">按完整原CSV分组：Y=0有${g.counts[0]}人，Y=1有${g.counts[1]}人；除以${data.n}变成下面两项概率。i行到y行的切换发生在这里。</div>`+expr('原概率和可能结局逐元素相乘后求和',prob()+syntaxR(julia?'.*':'⊙')+yy()+arrow()+weighted('mean-contribution',g.py,'p(y)×y','p .* support_y','每组的均值贡献')+syntaxR(julia?'sum':'Σ 两组求和')+arrow()+mm());
   snippet='support_y = [0.0, 1.0]\np = [count(==(v), y) / n for v in support_y]\nmu = sum(p .* support_y)';
   note=julia?'⊙与Julia的.*都表示对应元素相乘。两项乘积相加即得加权平均，概率已经包含各组人数权重。mu与risk数值相同：risk强调样本比例，mu强调接下来固定的参考均值。后面μ固定为这个原参考分布P=P_n的均值。':'⊙表示两个向量的对应元素相乘，先得到每组的均值贡献。Σ表示将两项贡献相加；概率p(y)已经包含组人数权重。μ固定为原参考分布P=Pₙ的均值，在这里数值等于样本死亡比例。';
  }
  if(stage==='reweight'){
   body=expr('原概率保留1−t并添加t点质量得到新概率',syntaxR('(1 −')+tt()+syntaxR(')')+syntaxR(julia?'.*':'×')+prob()+syntaxR('+')+tt()+syntaxR(julia?'.*':'×')+sv('point-probability',c.pointP,'1{y=z}','point','δz的两项概率质量')+arrow()+pt());
   snippet='point = Float64.(support_y .== z)\np_t = (1 - t) .* p + t .* point';
   body+=expr('分开查看保留组件和新增组件',sv('retained-probability',c.retainedP,'(1−t)p','(1 - t) .* p',`总质量${f(1-c.t)}`)+syntaxR('+')+sv('added-probability',c.addedP,'tδz','t .* point',`总质量${f(c.t)}`)+arrow()+pt());
   note=julia?`.==逐项检查哪个结局等于z，Float64.把真假转换成1.0/0.0；新增项只进入该组。当前p_t总和${f(c.probabilitySum)}。两行依次表示存活、死亡的概率。`:`指示向量1{y=z}在选定的结局组为1、另一组为0；每项先乘新增质量t，再与保留的(1−t)p相加。当前新概率之和为${f(c.probabilitySum)}。两行依次表示存活、死亡的概率。`;
  }
  if(stage==='changed-mean'){
   body=expr('新概率和同一结局逐元素相乘再求和',pt()+syntaxR(julia?'.*':'⊙')+yy()+arrow()+weighted('new-contribution',c.weightedY,'pₜ(y)×y','p_t .* support_y','新均值的两组贡献')+syntaxR(julia?'sum':'Σ 两组求和')+arrow()+mt());
   body+=expr('新均值减固定原均值得到实际变化',mt()+syntaxR('−')+mm()+arrow()+s('mean-delta',c.delta,{math:'Δμ',julia:'delta',label:'新减旧',colour:'green',unit:'概率差'}));
   snippet='mu_t = sum(p_t .* support_y)\ndelta = mu_t - mu';
   note=`当前变化${f(c.delta)}概率差，即${f(c.delta*100)}个百分点。原μ不随t或z改变；只在右边的新分布均值重新计算。`;
  }
  if(stage==='change-rate'||stage==='linear-mean'){
   body=expr('实际变化除以替换步长与精确线性规则核对',s('mean-delta',c.delta,{math:'μₜ−μ',julia:'delta',label:'变化量',colour:'green'})+syntaxR('÷')+tt()+arrow()+(c.rate===null?'<div class="ov-undefined" data-quotient="undefined">t=0：0/0未定义；导数仍为z−μ</div>':s('change-rate',c.rate,{math:'(μₜ−μ)/t',julia:'rate',label:'有限步长变化率',colour:'orange'}))+syntaxR('；导数')+deriv());
   body+=algebra([
    ['μₜ = Σᵧ [(1−t)p(y) + t·1{y=z}]·y','p(y)是原概率；1{y=z}只在选中结局等于1。'],
    ['= (1−t)Σᵧ p(y)y + tΣᵧ 1{y=z}y','对每项使用分配律，再将不随y改变的1−t与t提出求和。'],
    ['= (1−t)μ + tz','第一项的和按定义是原μ；第二项仅留下y=z这一项。'],
    ['= μ − tμ + tz = μ + t(z−μ)','先展开(1−t)μ，再提出t；均值的线性使这一步精确成立。'],
    ['μₜ − μ = μ − tμ + tz − μ = −tμ + tz = t(z−μ)','新减旧：+μ与−μ相消，其余两项共同提出t。'],
    ['(μₜ−μ)/t = t(z−μ)/t = z−μ，t≠0','只在t非零时约去t；t=0时用极限定义导数。']]);
   snippet='derivative = z - mu\nrate = t == 0 ? missing : delta / t\nlinear_mean = mu + t * derivative';
   note=`原均值μ=${f(mu)}固定，当前z=${c.z}、t=${f(c.t)}。由概率加权直接得到μ_t=${f(c.newMean)}，线性式也为${f(c.linearMean)}，两种计算精确相等。控制器中的t=0专门保留商未定义的边界。`;
  }
  if(stage==='lookup-rate'||stage==='lookup-if'){
   body=expr('可能结局逐项减同一原均值得到影响函数表',yy()+syntaxR(julia?'.-':'− 每项都减')+mm()+arrow()+dd());
   body+=`<p class="ov-grouping">当前选z=${c.z}：D(${c.z};P)=${f(c.z)}−${f(mu)}=${f(c.derivative)}。函数的输入换了，原P和μ没有换。</p>`;
   snippet='support_D = support_y .- mu\nderivative = z - mu';
   note='D是函数名，括号中的z是输入，P标记参考分布；两个输出组成一条完整规则。乘t后才得到实际均值变化。输入随机Y时，规则固定，输出由抽到的结局决定。';
  }
  if(stage==='patient-if'){
   body=expr('实际每个Y减同一标量得到同顺序的IF向量',v('outcomes',{math:'实际Yᵢ',julia:'y'})+syntaxR(julia?'.-':'− 每项都减')+mm()+arrow()+v('influence',{math:'D(Yᵢ;P)',julia:'influence',label:'同一个i保留到输出'}));
   snippet='influence = y .- risk';
   note=julia?'此处返回5735项向量，前面的两行函数表返回两种可能值。i始终表示患者行，y=0/1表示结局组；两种行标签不混用。.-将一个标量广播（broadcast）到每个向量元素。':'此处输出5735项影响值向量；前面的函数表只有两种可能输出。每项实际Yᵢ减同一个固定参考均值μ，第i位患者的行序保留到输出。i表示患者，y=0、1表示结局组，两种行标不混用。';
  }
  if(stage==='mean-if'){
   body=expr('完整IF向量求和除n得到均值',syntaxR(julia?'sum(':'Σᵢ(')+v('influence',{math:'D(Yᵢ;P)',julia:'influence'})+syntaxR(') /')+s('sample-size',data.n,{math:'n',julia:'n',label:'全部人数',unit:'人'})+arrow()+s('mean-influence',data.mean.meanD,{math:'全n项平均D',julia:'mean_influence',label:'精确运算为0；数值计算近似为0',colour:'orange'}));
   snippet='mean_influence = sum(influence) / n';
   note=`这份数据的实际浮点输出是${data.mean.meanD.toExponential(3)}，图中以显示精度记0。这里每项减去本样本均值，因此对P_n平均为0。第0章5.2已用两组推导区分样本中心化与真实误差。`;
  }
  if(stage==='grouped-centre'){
   body=expr('旧概率乘旧IF并加总得到零',prob()+syntaxR(julia?'.*':'⊙')+dd()+arrow()+weighted('if-contribution',g.pD,'p(y)D(y;P)','p .* support_D','正负加权贡献')+syntaxR(julia?'sum':'Σ 两组求和')+arrow()+s('grouped-if-mean',g.meanD,{math:'E_P[D]',julia:'sum(p .* support_D)',label:'按原P加权',colour:'orange'}));
   body+=algebra([
    ['Σᵧ p(y)D(y;P) = Σᵧ p(y)(y−μ)','把影响函数D的规则y−μ代入；原μ对两组是同一个常数。'],
    ['= Σᵧ [p(y)y − p(y)μ]','每一组先按分配律展开，括号内两项都保留。'],
    ['= Σᵧ p(y)y − Σᵧ p(y)μ','有限求和的差等于两项求和之差。'],
    ['= μ − μΣᵧ p(y)','第一项按μ定义替换；第二项将不随y改变的μ提出。'],
    ['= μ − μ×1 = 0','合法概率之和为1。正负贡献相互抵消，总和为0。']]);
   snippet='support_D = support_y .- mu\ngrouped_mean_D = sum(p .* support_D)';
   note=`按原P的两项贡献分别为${f(g.pD[0])}和${f(g.pD[1])}。观察其中的负号；Y=0组在均值贡献中为0，但在IF贡献中不为0。`;
  }
  if(stage==='old-new'){
   body=expr('固定旧D只替换平均权重',pt()+syntaxR(julia?'.*':'⊙')+dd()+syntaxR(julia?'sum':'Σ 两组求和')+arrow()+s('old-d-new-mean',c.oldMeanD,{math:'E_Pt[D_P]',julia:'old_mean_D',label:'旧函数，按新权重平均',colour:'orange'}));
   body+=expr('明确另定义新D并核对重新中心化',yy()+syntaxR(julia?'.-':'−')+mt()+arrow()+sv('new-support-influence',c.newD,'D(y;Pₜ)','new_support_D','新函数：改为减新μₜ','orange'));
   body+=expr('新函数明确按新概率加权并求和验证为零',pt()+syntaxR(julia?'.*':'⊙')+sv('new-support-influence',c.newD,'D(y;Pₜ)','new_support_D','新函数，减μₜ','orange')+arrow()+weighted('new-if-contribution',c.weightedNewD,'pₜ(y)D(y;Pₜ)','p_t .* new_support_D','重新中心化后的贡献')+syntaxR(julia?'sum':'Σ 两组求和')+arrow()+s('new-d-new-mean',c.newMeanD,{math:'E_Pt[D_Pt]',julia:'new_mean_D',label:'新函数按新权重平均',colour:'orange'}));
   snippet='old_mean_D = sum(p_t .* support_D)\nnew_support_D = support_y .- mu_t\nnew_mean_D = sum(p_t .* new_support_D)';
   note=`旧D在新权重下均值${f(c.oldMeanD)}，等于μ_t−μ；新定义D_Pt在新权重下平均${f(c.newMeanD)}。两个函数各自以对应分布的均值为中心。`;
  }
  if(stage==='survival'){
   body=expr('逐人取1减Y再求平均得到生存概率',syntaxR(julia?'1 .−':'1 − 每项')+v('outcomes',{math:'Yᵢ',julia:'y'})+arrow()+v('survival-vector',{values:data.Y.map(y=>1-y),math:'1−Yᵢ',julia:'alive',label:'同一行的30日存活指标',colour:'blue'})+syntaxR(julia?'sum(·) / n':'全n人平均')+arrow()+s('survival-risk',1-mu,{math:'S(30)=1−μ',julia:'survival',label:'30日存活概率',colour:'blue'}));
   snippet='alive = 1 .- y\nsurvival = sum(alive) / n\nsurvival_influence = alive .- survival';
   note=`D_S=(1−Y)−(1−μ)=1−Y−1+μ=−Y+μ=−(Y−μ)。常数1的两项相消；30日存活概率${f(1-mu)}与原死亡风险之和为1。`;
  }
 }
 if(r){snippet=rStageCode(stage,state.scenario||'one');note=R_STAGE_NOTES[stage]+(meta.chapter===1?' 运行时，将工作簿的t、z设为当前控件值，原参考均值保持固定。':'');}
 return `<div class="ov-canvas-content" data-mode="${data.mode}"><div class="ov-reading-mode">${r?'R对象运算':julia?'Julia对象运算':'数学运算'}</div>${body}${julia?code(snippet,r?'R':'Julia'):''}<p class="ov-explanation">${note}${!r&&julia&&['source','patient-mean'].includes(stage)?' 图中n×1为向量竖排形状；Julia一维Vector的size为(n,)。':''}</p></div>`;
}
export function objectToolbar(chapter,data){
 return `<div class="ov-toolbar" data-object-toolbar="${chapter}">${chapter===0?'':`<fieldset><legend>本章对象图的阅读方式</legend><label><input type="radio" name="object-mode-${chapter}" value="math" checked> 数学对象</label><label><input type="radio" name="object-mode-${chapter}" value="julia"> Julia运算</label><label><input type="radio" name="object-mode-${chapter}" value="r"> R运算</label></fieldset>`}<div class="ov-row-controls"><button type="button" data-object-action="previous">上一组6行</button><button type="button" data-object-action="next">下一组6行</button><label>核对同一患者行<select data-object-selected>${data.rowNumbers.map(i=>`<option value="${i}">原始行 i=${i}</option>`).join('')}</select></label><button type="button" data-object-action="reset">重置对象图</button></div>${chapter===1?`<fieldset class="ov-perturb-controls"><legend>调整两类结局的概率</legend><label>接收权重的结局 z<select data-object-z><option value="1">1：30日死亡</option><option value="0">0：30日存活</option></select></label><label>替换比例 t <input type="range" data-object-t min="0" max="1" step="0.01" value="0.1"><output data-object-t-value>0.10（10%）</output></label></fieldset><p>本章文字与折叠的固定例题以z=1、t=0.1演算。这里的控件同步更新标有“真实数据对象”的图；其余例题保持题面原条件。</p>`:''}<p class="ov-status" role="status" aria-live="polite">显示原始第${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}行；运算始终使用全部${data.n}行。选中行i=${data.rowNumbers[0]}。</p><div class="ov-legend" aria-label="跨章一致的对象颜色"><span class="ov-blue">Y结局</span><span class="ov-amber">A处理</span><span class="ov-teal">基线矩阵</span><span class="ov-cyan">Q0预测</span><span class="ov-purple">Q1预测</span><span class="ov-orange">均值IF</span></div><p>矩阵（matrix）按行、列组织数据；向量（vector）按顺序列出一组数；标量（scalar）表示单个数值。每个对象都配有名称、维度和行标；切换前后6行可核对完整向量中的不同位置。图中n×1表示n项向量的数学竖排形状，每行一项。系数向量按特征排列，患者向量按行序i排列。Σ表示对完整向量求和；平均还须除以总项数。</p></div>`;
}
export function objectFigure(stage,data,{chapter=OBJECT_STAGES[stage]?.chapter,toolbar=false,id=`object-${chapter}-${stage}`,visualId='',extra=''}={}){
 const meta=OBJECT_STAGES[stage];if(!meta)throw Error('Object figure metadata missing');
 return `<figure class="object-figure" id="${id}" ${visualId?`data-visual-id="${visualId}"`: ''} data-object-stage="${stage}" data-object-chapter="${chapter}" aria-labelledby="object-title-${chapter}-${stage}"><div class="ov-eyebrow">用真实数据逐步计算</div><h3 id="object-title-${chapter}-${stage}">${meta.title}</h3><p>${meta.description}</p>${toolbar?objectToolbar(chapter,data):''}<div class="ov-canvas">${renderObjectStage(stage,data)}</div>${extra}<figcaption>数字来自同一RHC原CSV；小数仅为显示舍入。患者向量若出现，仅展示行序<span data-object-window>${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}</span>；计算使用完整${data.n}行。两项结局支持向量的行标为y=0、1。</figcaption></figure>`;
}
