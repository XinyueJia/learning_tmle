/** One vocabulary for formula operands, cumulative data columns and Julia tokens. */
export const TRACE_COLUMNS={
 a:{symbol:'Aᵢ',label:'实际RHC',colour:'amber',meaning:'实际接受RHC为1，否则0；原始数据，不随ε改变。',unit:'0/1'},
 y:{symbol:'Yᵢ',label:'30日死亡',colour:'blue',meaning:'实际30日全因死亡为1，否则0；提供拟合与残差计算的结局。',unit:'0/1'},
 q0:{symbol:'Q̂₀ᵢ',label:'A=0初始预测',colour:'cyan',meaning:'同一W输入A=0时，模型输出的初始死亡概率。',unit:'概率'},
 q1:{symbol:'Q̂₁ᵢ',label:'A=1初始预测',colour:'purple',meaning:'同一W输入A=1的初始死亡概率，使用同一套Q模型系数。',unit:'概率'},
 qa:{symbol:'Q̂Aᵢ',label:'实际臂初始预测',colour:'slate',meaning:'按实际A从Q̂1或Q̂0中逐行选择。',unit:'概率'},
 g:{symbol:'ĝᵢ',label:'拟合RHC概率',colour:'green',meaning:'给定同一基线W的初始处理概率；目标更新时固定。',unit:'概率'},
 h0:{symbol:'H₀ᵢ',label:'A=0更新权重',colour:'cyan',meaning:'−1/(1−ĝᵢ)，用于更新全A=0的预测，恒负。',unit:'逆概率权重'},
 h1:{symbol:'H₁ᵢ',label:'A=1更新权重',colour:'purple',meaning:'1/ĝᵢ，用于更新全A=1的预测，恒正。',unit:'逆概率权重'},
 h:{symbol:'H_Aᵢ',label:'实际臂更新权重H',colour:'orange',meaning:'更新回归的协变量（clever covariate）为A/ĝ−(1−A)/(1−ĝ)，按实际A选择H1或H0；由EIF残差项给出。',unit:'逆概率权重'},
 offset:{symbol:'o_Aᵢ',label:'实际臂offset',colour:'slate',meaning:'logit(Q̂Aᵢ)。初始预测的对数优势（log odds），系数固定为1。',unit:'log odds'},
 epsilon:{symbol:'ε',label:'共用更新参数',colour:'orange',meaning:'全体患者及两种处理共用的一个更新参数。',scalar:true,unit:'标量'},
 shift:{symbol:'εH_Aᵢ',label:'实际臂logit增量',colour:'orange',meaning:'同一标量ε逐项乘实际臂H，产生n项logit增量。',unit:'log odds变化'},
 eta:{symbol:'η_Aᵢ',label:'实际臂更新线性预测',colour:'slate',meaning:'固定offset加εH；这里在logit尺度相加。',unit:'log odds'},
 qstar_a:{symbol:'Qε,Aᵢ',label:'实际臂当前预测Qε',colour:'slate',meaning:'expit(η_Aᵢ)，把更新后的logit转回实际臂预测概率。',unit:'概率'},
 residual:{symbol:'Yᵢ−Qε,Aᵢ',label:'更新后残差',colour:'blue',meaning:'实际Y减去对应处理下的更新预测。',unit:'概率差'},
 score_contribution:{symbol:'H_Aᵢ(Yᵢ−Qε,Aᵢ)',label:'score贡献',colour:'orange',meaning:'每人的加权残差；对完整n人平均得到ε的似然score。',unit:'加权概率差'},
 offset0:{symbol:'o₀ᵢ',label:'A=0固定offset',colour:'cyan',meaning:'logit(Q̂₀ᵢ)，固定全A=0的初始logit预测。',unit:'log odds'},
 shift0:{symbol:'εH₀ᵢ',label:'A=0 logit增量',colour:'cyan',meaning:'共用标量ε逐项乘全A=0的H0，得到每人的logit增量。',unit:'log odds变化'},
 eta0:{symbol:'η₀ᵢ',label:'A=0更新logit',colour:'cyan',meaning:'offset0+εH0，是每人全A=0的更新线性预测。',unit:'log odds'},
 qstar0:{symbol:'Qε,0ᵢ',label:'A=0当前预测Qε',colour:'cyan',meaning:'expit(eta0)，同一患者在预测输入A=0下的更新概率。',unit:'概率'},
 offset1:{symbol:'o₁ᵢ',label:'A=1固定offset',colour:'purple',meaning:'logit(Q̂₁ᵢ)，固定全A=1的初始logit预测。',unit:'log odds'},
 shift1:{symbol:'εH₁ᵢ',label:'A=1 logit增量',colour:'purple',meaning:'同一ε乘H1；正ε沿A=1更新权重增加logit。',unit:'log odds变化'},
 eta1:{symbol:'η₁ᵢ',label:'A=1更新logit',colour:'purple',meaning:'offset1+εH1，是每人全A=1的更新线性预测。',unit:'log odds'},
 qstar1:{symbol:'Qε,1ᵢ',label:'A=1当前预测Qε',colour:'purple',meaning:'expit(eta1)，同一患者在预测输入A=1下的更新概率。',unit:'概率'},
 contrast:{symbol:'Δε,ᵢ',label:'逐人预测差',colour:'green',meaning:'同一W的两种模型预测之差Qε,1−Qε,0；对全n平均得到标准化风险差。',unit:'概率差'},
 psi:{symbol:'ψ̂ε',label:'当前代入风险差',colour:'green',meaning:'contrast的完整n人平均。求根后得到该路径的TMLE。',scalar:true,unit:'概率差'},
 centred:{symbol:'Δε,ᵢ−ψ̂ε',label:'中心化预测差',colour:'green',meaning:'每人contrast减同一个全n平均ψ；完整n人平均为0。',unit:'概率差'},
 eif:{symbol:'D̂ε,ᵢ',label:'逐人完整拟合EIF',colour:'orange',meaning:'score贡献加中心化预测差；只有全n平均才与score平均相同，逐人一般不同。',unit:'概率差'},
 n:{symbol:'n',label:'原始记录总数',colour:'slate',meaning:'全部原CSV患者人数；分页不改变它。',scalar:true,unit:'人'},
 score_mean:{symbol:'sₙ(ε)',label:'全体患者的score平均',colour:'orange',meaning:'sum(score_contribution)/n；求根使这些加权贡献的平均接近0。',scalar:true,unit:'平均加权概率差'},
 eif_mean:{symbol:'PₙD̂ε',label:'全体患者的EIF平均',colour:'orange',meaning:'sum(eif)/n；与score平均相同，用来核对更新方程。余项分析见正文第7节。',scalar:true,unit:'平均概率差'}
};
export const TRACE_STEPS=[
 {title:'保留真实记录',added:['a','y'],inputs:[],outputs:['a','y','n'],formulaTex:String.raw`(W_i,A_i,Y_i),\quad i=1,\ldots,n`,intro:'先固定研究数据：原始A/Y和基线W始终不改。表中行号i只表示原CSV行序；age、sex、race是W的部分预览，完整设计为17列。',prediction:'预测：后面更新模型时，实际A或Y会改变吗？',answer:'不会。改变的是拟合预测，不是患者已观察的处理或结局。'},
 {title:'加入三种初始预测',added:['q0','q1','qa'],inputs:['a'],outputs:['q0','q1','qa'],formulaTex:String.raw`\widehat Q_{A,i}=A_i\widehat Q_{1,i}+(1-A_i)\widehat Q_{0,i}`,intro:'同一W分别将模型输入A设为0和1得到两列预测；实际A只用于逐行选择qa。两次调用沿用相同基线与模型系数。',prediction:'预测：A=0这一行，qa应当复制q0还是q1？',answer:'复制q0。若A=1才复制q1；行i保持不变。'},
 {title:'由g计算实际臂和两种处理输入的H',added:['g','h0','h1','h'],inputs:['a','g'],outputs:['h0','h1','h'],formulaTex:String.raw`H_{0,i}=-\frac1{1-\widehat g_i},\quad H_{1,i}=\frac1{\widehat g_i},\quad H_{A,i}=\frac{A_i}{\widehat g_i}-\frac{1-A_i}{1-\widehat g_i}`,intro:'g预测RHC分配；H来自第4讲EIF的残差权重。实际臂H_A用于拟合ε，两种策略各自的H0/H1用于更新两列预测。初始g之后固定。',prediction:'预测：A=0的人H_A的符号是什么？',answer:'负号，因为实际H_A=H0=−1/(1−g)。全A=1的H1则始终为正。'},
 {title:'对初始预测取logit，得到固定offset',added:['offset'],inputs:['qa'],outputs:['offset'],formulaTex:String.raw`o_{A,i}=\operatorname{logit}(\widehat Q_{A,i})=\log\frac{\widehat Q_{A,i}}{1-\widehat Q_{A,i}}`,intro:'对初始预测概率qa取logit，得到固定偏置项offset；后续在这个尺度上相加更新。',prediction:'预测：初始风险小于0.5时，offset的符号是什么？',answer:'为负。q/(1−q)小于1，取对数后小于0。offset的单位为log odds。'},
 {title:'用同一个ε更新所有人的实际臂预测',added:['shift','eta','qstar_a'],inputs:['offset','epsilon','h'],outputs:['shift','eta','qstar_a'],formulaTex:String.raw`b_{A,i}=\epsilon H_{A,i},\quad\eta_{A,i}=o_{A,i}+b_{A,i},\quad Q_{\epsilon,A,i}=\operatorname{expit}(\eta_{A,i})`,intro:'先乘εH，再在logit尺度加到固定offset，最后expit转回概率。ε是全体共用的唯一新参数，尚未求根时这里称当前ε的预测。',prediction:'预测：ε=0时，更新预测是否等于初始预测？',answer:'等于。此时增量为0，expit(logit(q))=q；浮点运算只可能留下机器精度误差。'},
 {title:'计算逐人加权残差，再取平均',added:['residual','score_contribution'],inputs:['y','qstar_a','h'],outputs:['residual','score_contribution','score_mean'],formulaTex:String.raw`r_i=Y_i-Q_{\epsilon,A,i},\quad c_i=H_{A,i}r_i,\quad s_n(\epsilon)=\frac1n\sum_{i=1}^nc_i`,intro:'逐行相减和相乘后，必须对完整5735人求平均。ε的似然score就是这个平均加权残差；手填ε可观察方程值，二分或自动求根用于寻找它的零点。',prediction:'预测：sₙ(ε)接近0要求每个残差都为0吗？',answer:'不要求。它只要求完整n项带符号加权残差的平均接近0。'},
 {title:'将所有人的A=0预测更新为Qε,0',added:['offset0','shift0','eta0','qstar0'],inputs:['q0','epsilon','h0'],outputs:['offset0','shift0','eta0','qstar0'],formulaTex:String.raw`o_{0,i}=\operatorname{logit}(\widehat Q_{0,i}),\quad\eta_{0,i}=o_{0,i}+\epsilon H_{0,i},\quad Q_{\epsilon,0,i}=\operatorname{expit}(\eta_{0,i})`,intro:'对所有人都计算A=0预测，使用各自H0和初始q0的offset。沿用实际臂拟合得到的同一个ε，全列使用处理输入0。',prediction:'预测：ε为正时，这一列风险往哪边变？',answer:'H0为负，logit减少，expit单调递增，所以全A=0风险逐行下降。'},
 {title:'将所有人的A=1预测更新为Qε,1',added:['offset1','shift1','eta1','qstar1'],inputs:['q1','epsilon','h1'],outputs:['offset1','shift1','eta1','qstar1'],formulaTex:String.raw`o_{1,i}=\operatorname{logit}(\widehat Q_{1,i}),\quad\eta_{1,i}=o_{1,i}+\epsilon H_{1,i},\quad Q_{\epsilon,1,i}=\operatorname{expit}(\eta_{1,i})`,intro:'同样对每人计算A=1预测，使用H1，并保持同一ε、同一基线W和同一批患者。',prediction:'预测：一个实际A=0的人，也需要有qstar1吗？',answer:'需要。标准化要求每个W都有两种预测；qstar1记录输入A=1时的模型预测。'},
 {title:'逐人相减，再对整列平均',added:['contrast'],inputs:['qstar1','qstar0','n'],outputs:['contrast','psi'],formulaTex:String.raw`\Delta_{\epsilon,i}=Q_{\epsilon,1,i}-Q_{\epsilon,0,i},\quad\widehat\psi_\epsilon=\frac1n\sum_i\Delta_{\epsilon,i}`,intro:'先产生n项差值向量，再求一个完整队列平均。只有在求根得到ε̂后，该更新后的代入估计才是这里构建的TMLE；换显示窗口不会改变它。',prediction:'预测：能否只对实际RHC患者平均qstar1、对其余患者平均qstar0？',answer:'不能。那样两项用的是不同人群构成；这里两臂都对同一n人标准化。'},
 {title:'加上中心化预测差，核对完整EIF平均',added:['centred','eif'],inputs:['score_contribution','contrast','psi'],outputs:['centred','eif','eif_mean'],formulaTex:String.raw`\widehat D_{\epsilon,i}=c_i+(\Delta_{\epsilon,i}-\widehat\psi_\epsilon),\quad P_n(\Delta_\epsilon-\widehat\psi_\epsilon)=0,\quad P_n\widehat D_\epsilon=s_n(\epsilon)`,intro:'残差score贡献还须加上中心化预测差，才是完整拟合EIF。两列的逐人值通常不同；它们的全n平均相同是因为中心化项平均为零。',prediction:'预测：完整EIF平均为什么与score平均相同？',answer:'完整EIF等于score贡献加中心化预测差；后一列的完整样本平均按定义为0，因此两者平均相同。'}
];
export const escapeTrace=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const traceNumber=value=>Number.isInteger(value)?String(value):Math.abs(value)<5e-9?'0':value.toFixed(6);
export const traceLink=(key,text=TRACE_COLUMNS[key]?.symbol)=>{
 const c=TRACE_COLUMNS[key];if(!c)throw Error(`Unknown TMLE trace symbol ${key}`);
 return `<button type="button" class="trace-symbol ov-${c.colour}" data-trace-key="${key}" title="${escapeTrace(c.meaning)}" aria-label="${escapeTrace(c.symbol+'；代码变量 '+key+'；'+c.meaning)}">${escapeTrace(text)}</button>`;
};
export function traceFormula(step){
 const k=traceLink,sep='<span class="trace-equals"> = </span>',line=(lhs,...rhs)=>`<div class="trace-formula-line">${k(lhs)}${sep}${rhs.join('')}</div>`;
 return [
 ()=>`<div class="trace-formula-line">同一行 i： Wᵢ，${k('a')}，${k('y')}；共${k('n')}行</div>`,
 ()=>line('qa',k('a'),' × ',k('q1'),' + (1 − ',k('a'),') × ',k('q0')),
 ()=>line('h0','−1 / (1 − ',k('g'),')')+line('h1','1 / ',k('g'))+line('h',k('a'),' / ',k('g'),' − (1 − ',k('a'),') / (1 − ',k('g'),')'),
 ()=>line('offset','logit(',k('qa'),')'),
 ()=>line('shift',k('epsilon'),' × ',k('h'))+line('eta',k('offset'),' + ',k('shift'))+line('qstar_a','expit(',k('eta'),')'),
 ()=>line('residual',k('y'),' − ',k('qstar_a'))+line('score_contribution',k('h'),' × ',k('residual'))+line('score_mean','sum(',k('score_contribution'),') / ',k('n')),
 ()=>line('offset0','logit(',k('q0'),')')+line('shift0',k('epsilon'),' × ',k('h0'))+line('eta0',k('offset0'),' + ',k('shift0'))+line('qstar0','expit(',k('eta0'),')'),
 ()=>line('offset1','logit(',k('q1'),')')+line('shift1',k('epsilon'),' × ',k('h1'))+line('eta1',k('offset1'),' + ',k('shift1'))+line('qstar1','expit(',k('eta1'),')'),
 ()=>line('contrast',k('qstar1'),' − ',k('qstar0'))+line('psi','sum(',k('contrast'),') / ',k('n')),
 ()=>line('centred',k('contrast'),' − ',k('psi'))+line('eif',k('score_contribution'),' + ',k('centred'))+line('eif_mean','sum(',k('eif'),') / ',k('n'))
 ][step]();
}
/** Tokenisation leaves strings/comments literal; linked identifiers copy as normal Julia. */
export function traceCode(code,language='julia'){
 if(language==='r')return code.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[^\n]*|[A-Za-z_][A-Za-z_0-9]*)/g).map(token=>TRACE_COLUMNS[token]?traceLink(token,token):escapeTrace(token)).join('');
 return code.split(/("(?:\\.|[^"\\])*"|#[^\n]*|[A-Za-z_][A-Za-z_0-9]*)/g).map(token=>TRACE_COLUMNS[token]?traceLink(token,token):escapeTrace(token)).join('');
}
export function activeColumns(step){if(!Number.isInteger(step)||step<0||step>=TRACE_STEPS.length)throw Error('Invalid trace step');return TRACE_STEPS.slice(0,step+1).flatMap(s=>s.added);}
/** Concatenating the ten code panels must also be executable from a fresh Julia session. */
export function traceStepCode(mapping,stage){
 const step=TRACE_STEPS[stage];if(!step)throw Error('Invalid trace code step');
 if(mapping.source?.endsWith('.R'))return mapping.lines.filter(entry=>entry.step===stage);
 const wanted=new Set([...step.outputs,...(stage===0?['rows','fit']:[]),...(stage===2?['g']:[]),...(stage===4?['epsilon']:[])]);
 return mapping.lines.filter(entry=>entry.outputs.some(key=>wanted.has(key))||(stage===0&&/^(include\(|using )/.test(entry.code))||(stage===4&&entry.code.startsWith('isfinite(epsilon)')));
}
