import {rObjectName,rObjectToken,rStageCode,R_STAGE_NOTES} from './r-object-code.js';
/** Shared build/browser renderer: real objects occupy the operands of each expression. */
import {meanContamination} from '../../shared/js/object-data.js';
export const OBJECT_COLOURS=Object.freeze({outcomes:'blue','outcome-vector':'blue','treatment-vector':'amber','prediction-a0':'amber','prediction-a1':'amber','baseline-w':'teal','design-matrix':'teal',q0:'cyan',q1:'purple',qa:'selected',propensity:'green','q-coefficients':'slate','g-coefficients':'slate',probability:'slate','support-y':'blue',influence:'orange','support-influence':'orange','mean-contribution':'green','if-contribution':'green',risk:'blue','sample-size':'slate',events:'blue','mean-influence':'orange'});
const OBJECT_LABELS=Object.freeze({"y": "Observed 30-day outcome", "a": "Observed RHC treatment", "design": "Full baseline design matrix", "g": "Predicted treatment probability", "q0": "Outcome prediction with A=0 for everyone", "q1": "Outcome prediction with A=1 for everyone", "qa": "Predictions selected row by row using observed A", "risk-difference": "Patient-level predicted risk difference", "influence": "Patient-level mean influence values", "p": "Empirical probabilities of both outcomes", "y-support": "Two possible outcomes", "D": "Mean influence values for both outcomes", "contrib": "Mean contributions of both outcomes", "influence-contrib": "Influence contributions of both outcomes", "scalar": "Full-cohort empirical event risk", "risk-scalar": "Initial standardised risk difference", "prediction-a0": "Prediction input A=0 for everyone", "prediction-a1": "Prediction input A=1 for everyone", "q-coefficients": "Fitted outcome regression coefficients", "g-coefficients": "Fitted treatment-model coefficients", "events": "Full-cohort 30-day event count", "sample-size": "Full-cohort patient count", "mean-influence": "Full-cohort mean of patient influence values", "baseline-w": "15 baseline variables (original age and race values)", "outcomes": "Observed 30-day outcome", "outcome-vector": "Observed 30-day outcome", "treatment-vector": "Observed RHC treatment", "design-matrix": "Full baseline design matrix", "propensity": "Predicted treatment probability", "probability": "Empirical probabilities of both outcomes", "support-y": "Two possible outcomes", "support-influence": "Mean influence values for both outcomes", "mean-contribution": "Mean contributions of both outcomes", "if-contribution": "Influence contributions of both outcomes", "risk": "Full-cohort empirical event risk"});
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const f=(value,digits=6)=>Number.isInteger(value)?String(value):Math.abs(value)<1e-12?'0':Number(value.toFixed(digits)).toString();
const pretty=value=>typeof value==='number'?f(value):String(value);
const syntax=text=>`<span class="ov-syntax${text.trim()&&/^[+−\-×÷⊙*/=|(),.\s\[\]{}:;]+$/u.test(text.trim())?' ov-operator':''}">${escape(text)}</span>`;
const arrow=()=>'<span class="ov-arrow" aria-label="gives">→</span>';
export const OBJECT_STAGES=Object.freeze({
 'source':{chapter:0,title:'Extract observed treatment and outcome from the same records',description:'Every column retains the original file order. A matrix holds several columns, a vector has one value per patient and a scalar is one number. Only a few rows are displayed; models and averages use all records.'},
 'fit':{chapter:0,title:'Fit death risk using baseline variables and observed treatment',description:'W contains 15 original baseline variables; Z is the encoded 17-column design matrix, including an intercept. The outcome model adds observed A, giving 18 columns. When estimating g, A becomes the response. Here we identify inputs and outputs; solving a regression is not a prerequisite.'},
 'predict':{chapter:0,title:'Keep baseline variables fixed and change prediction input A',description:'Hold design matrix Z and the fitted outcome regression coefficients fixed. Setting input A to all 1s or all 0s gives Q̂(1,W) or Q̂(0,W). Both vectors have n entries; the same row contains predictions for the same patient.'},
 'select':{chapter:0,title:'Observed A selects a prediction in each row',description:'Q̂(A,W) selects Q̂(1,W) or Q̂(0,W) using original A. Purple/cyan cells show the source, with consistent row labels i. Prediction inputs never overwrite original A or Y.'},
 'estimate':{chapter:0,title:'Subtract row by row, then average the full column',description:'Subtracting prediction columns gives another column of n numbers; averaging over everyone reduces it to a scalar. This is the initial plug-in estimate from the model specified in Chapter 8. The true clinical causal target remains unknown.'},
 'patient-mean':{chapter:1,title:'Sum all death indicators and divide by the patient count',description:'Each i identifies the same real patient. Sum all 5735 binary indicators to count deaths, then divide by n. The figure previews six rows.'},
 'weighted-mean':{chapter:1,title:'Group survivors and deaths to compute the same mean',description:'From here, the two rows represent outcomes y=0 and y=1. p is each group’s count divided by 5735; multiply elementwise, then sum.'},
 'reweight':{chapter:1,title:'Multiply original probabilities by 1−t, then add t to the selected outcome',description:'Keep original outcomes Y fixed and adjust the probability weights of the two outcome categories. Multiply each probability by 1−t, then add t only to selected outcome z. The weights still sum to 1.'},
 'changed-mean':{chapter:1,title:'Multiply new weights by the same outcome vector to obtain the new mean',description:'The outcome support remains 0 and 1. Reweight using pₜ, then subtract the fixed original mean to obtain the change.'},
 'change-rate':{chapter:1,title:'Divide the mean change by the replacement proportion to obtain a rate',description:'t is a dimensionless probability replacement proportion; z is the binary outcome receiving extra weight. The mean is exactly linear along this mixture path, so the rate is identical for every non-zero t.'},
 'linear-mean':{chapter:1,title:'Combine z=0 and z=1 in one linear formula',description:'Choosing z=0 or 1 changes only where extra weight is added. Original μ is fixed; the distributive law and cancellations below give an exact identity.'},
 'lookup-rate':{chapter:1,title:'Pair input outcomes with output rates in a function table',description:'We first compute rates for both inputs, then name this rule the influence function of the mean. Chapter 4 uses the same approach to derive the EIF of the standardised risk difference.'},
 'lookup-if':{chapter:1,title:'An influence function maps each possible observation to an influence value',description:'D(z;P)=z−μ. P fixes μ; the left column lists possible inputs and the right gives outputs for inputs 0 and 1.'},
 'patient-if':{chapter:1,title:'Apply the same rule to every patient to obtain a vector of influence values',description:'Subtract the same reference μ from each observed Y_i, giving 5735 outputs. Here P=P_n is fixed, so μ numerically equals the sample mean of these data.'},
 'mean-if':{chapter:1,title:'Sum the full influence vector, then divide by n',description:'The mean is zero because signed influence values cancel on averaging; individual entries may be positive or negative. Six rows are only a display window.'},
 'grouped-centre':{chapter:1,title:'Expand both weighted terms to explain the zero mean',description:'Weight by probabilities under original P. Factor out constant μ and use the fact that probabilities sum to 1; subtracting the two sums gives 0.'},
 'old-new':{chapter:1,title:'Keep the function fixed and change the averaging weights',description:'Original D_P always subtracts original μ. Average using p, then pₜ; only the first mean is guaranteed to be 0. Recentring gives D_Pt, a different function.'},
 'survival':{chapter:1,title:'Use 1−Y to compute survival probability and its influence values',description:'Y=1 denotes death within 30 days; 1−Y denotes 30-day survival. This chapter’s endpoint is survival status at day 30.'},
});
function rowCell(value,key,alignment,id,extra=''){
 const attr=alignment==='patient'?`data-record="${key}"`:alignment==='outcome'?`data-outcome="${key}"`:`data-feature="${escape(key)}"`;
 return `<span class="ov-cell ${extra}" ${attr} data-owner="${escape(id)}" aria-label="${alignment==='patient'?'Original row i='+key:alignment==='outcome'?'Outcome y='+key:'Coefficient '+key}, value ${escape(pretty(value))}"><small>${alignment==='patient'?'i='+key:alignment==='outcome'?'y='+key:escape(key)}</small><b>${escape(pretty(value))}</b></span>`;
}
export function vector(data,id,{values,math,julia,label,alignment='patient',colour,dimension,sourceIds}={}){
 const original=data.objects[id]||{},obj={...original,label:OBJECT_LABELS[id]||original.label},actual=values??obj.values;
 if(!Array.isArray(actual))throw Error(`Missing vector values ${id}`);
 const align=alignment==='patient'&&obj.alignment?obj.alignment:alignment;
 let keys,indexes;
 if(align==='patient'){indexes=data.displayIndices;keys=data.rowNumbers;}
 else if(align==='feature'){const features=obj.featureKeys||data.featureNames;indexes=[0,1,2,actual.length-1];keys=indexes.map(i=>features[i]||String(i+1));}
 else {indexes=actual.map((_,i)=>i);keys=[0,1];}
 const cells=indexes.map((i,j)=>rowCell(actual[i],keys[j],align,id,sourceIds?`ov-from-${sourceIds[i]}`:''));
 const dims=dimension||`${actual.length} × 1`;
 return `<div class="ov-object ov-vector ov-${colour||OBJECT_COLOURS[id]||'slate'}" data-object="${escape(id)}" data-dim="${escape(dims)}" data-alignment="${align}" data-full-length="${actual.length}"><header><span data-math-name="${escape(math||obj.symbol||id)}" ${data.mode!=='math'?`data-${data.mode}-name="${escape(data.mode==='r'?rObjectName(julia||id):julia||id)}"`:''}>${escape(data.mode==='math'?(math||obj.symbol||id):data.mode==='r'?rObjectName(julia||id):julia||id)}</span><small>${escape(label||obj.label||id)}</small></header><div class="ov-bracket">${cells.join('')}${align==='patient'?'<span class="ov-ellipsis" aria-label="More patient rows are not displayed">⋮</span>':align==='feature'?'<span class="ov-ellipsis">First three and last entries shown; other coefficients omitted</span>':''}</div><footer><b>${escape(dims)}</b><span>${align==='patient'?'Patient vector':align==='outcome'?'Outcome support vector':'Coefficient vector; ordered by feature'}</span></footer></div>`;
}
export function scalar(id,value,{math=id,julia=id,label='Scalar',colour=OBJECT_COLOURS[id]||'slate',unit='',mode='math'}={}){
 return `<div class="ov-object ov-scalar ov-${colour}" data-object="${escape(id)}" data-dim="1" data-value="${value}"><header><span data-math-name="${escape(math)}" ${mode!=='math'?`data-${mode}-name="${escape(mode==='r'?rObjectName(julia):julia)}"`:''}>${escape(mode==='math'?math:mode==='r'?rObjectName(julia):julia)}</span><small>${escape(label)}</small></header><strong>${escape(pretty(value))}</strong><footer>One number${unit?' · '+escape(unit):''}</footer></div>`;
}
function matrix(data,{kind='design',scenario='observed'}={}){
 const raw=kind==='raw',base=kind==='baseline',julia=data.mode!=='math';
 const columns=raw?['sex','age','swang1','dth30']:base?(julia?['male','age','race','…12 medical-history variables']:['Male indicator','Age','Race','…12 medical-history variables']):(julia?['1','male','age_z','…14 columns']:['1','Male indicator','Age z-score','…14 columns']);
 const actualCols=raw?4:base?15:17,dims=`${data.n} × ${actualCols}`;
 const id=raw?'raw-records':base?'baseline-w':'design-matrix';
 const rows=data.shown.map(r=>{
  const values=raw?[r.x?'Male':'Female',f(r.age,1),r.a?'RHC':'No RHC',r.y?'Yes':'No']:base?[r.x,f(r.age,1),r.race,'Retained']: [1,r.x,f(r.w[2],3),'Retained'];
  return `<div class="ov-matrix-row" data-record="${r.rowNumber}"><small>i=${r.rowNumber}</small>${values.map((v,j)=>`<span class="${raw&&j===2?'ov-cell-amber':raw&&j===3?'ov-cell-blue':''}">${escape(v)}</span>`).join('')}</div>`;
 });
 return `<div class="ov-object ov-matrix ov-teal" data-object="${id}" data-dim="${dims}" data-alignment="patient"><header><span>${raw?(julia?'Fields in rows':'Original record fields'):base?'W: original baseline':julia?'design · Z':'Design matrix Z'}</span><small>${raw?'Four of the original 63 fields shown':base?'Original age/race retained, plus 12 medical-history variables':'17 columns: intercept + male indicator + age z-score + 2 race columns + 12 history variables'}</small></header><div class="ov-matrix-head"><span>Row order</span>${columns.map(c=>`<span>${escape(c)}</span>`).join('')}</div>${rows.join('')}<span class="ov-ellipsis">⋮ ${raw?'Full original CSV retains all 63 fields':'Undisplayed rows and columns still enter calculations'}</span><footer><b>${dims}</b><span>${raw?'Matrix of the fields shown here':'Design/baseline matrix'}</span></footer></div>`;
}
const expr=(label,content)=>`<div class="ov-expression-scroll" tabindex="0" role="region" aria-label="${escape(label)}; scroll horizontally"><div class="ov-expression" role="group" aria-label="${escape(label)}">${content}</div></div>`;
const code=(source,language='Julia')=>`<div class="ov-code" data-code-language="${language.toLowerCase()}"><span>Corresponding executable ${language}</span><pre tabindex="0"><code>${escape(source)}</code></pre></div>`;
const model=(name,label)=>`<div class="ov-model"><b>${escape(name)}</b><span>${escape(label)}</span><small>Records in, probabilities out</small></div>`;
export function renderObjectStage(stage,input,state={}){
 const data={...input,mode:state.mode||'math'},meta=OBJECT_STAGES[stage];if(!meta)throw Error(`Unknown object stage ${stage}`);
 const r=data.mode==='r',julia=data.mode!=='math',token=syntax;
 const syntaxR=text=>token(r?rObjectToken(text):text);
 const v=(id,options)=>vector(data,id,options),s=(id,val,options)=>scalar(id,val,{mode:data.mode,...options});
 let body='',snippet='',note='';
 if(stage==='source'){
  body=expr('Encode real RHC records as A and Y in original row order',matrix(data,{kind:'raw'})+syntaxR(julia?'rhc_observations(rows)':'Encode fields')+arrow()+v('treatment-vector',{julia:'a',math:'A',label:'Observed RHC, binary coding'})+v('outcomes',{julia:'y',math:'Y',label:'Observed 30-day death, binary coding'}));
  snippet='rows = read_rhc_rows(DEFAULT_SOURCE)\nobservations = rhc_observations(rows)\ny = [person.y for person in observations]';
  note=`${data.n} real records. Original row i identifies the same record across figures. A and Y in rows ${data.rowNumbers.join(', ')} retain their row identities in later figures.`;
 }
 if(stage==='fit'){
  const design=matrix(data),a=v('treatment-vector',{julia:'a',math:'A',label:'Observed treatment'}),y=v('outcomes',{julia:'y',math:'Y',label:'Response to predict'});
  body=expr('Combine the 17-column design matrix and observed A into 18 columns, then fit Q with response Y',julia?
   syntaxR('q_fit = fit_logistic(hcat(')+`<div class="ov-concat"><div class="ov-choice">${design}${syntaxR(',')}${a}</div><strong>Bind columns: ${data.n} × 18</strong></div>`+syntaxR('),')+y+syntaxR(')')+arrow()+model('q_fit','Fitted outcome regression'):
   y+syntaxR('given')+`<div class="ov-concat"><div class="ov-choice">${design}${syntaxR('|')}${a}</div><strong>Bind columns: ${data.n} × 18</strong></div>`+arrow()+model('Q̂','Fitted outcome regression'));
  body+=`<details class="ov-extra-fit"><summary>Fit RHC probability using the same baseline matrix</summary>${expr('Predict observed A from the design matrix to obtain g',julia?syntaxR('g_fit = fit_logistic(')+design+syntaxR(',')+a+syntaxR(')')+arrow()+model('g_fit','Fitted RHC probability')+syntaxR('g_fit.probabilities')+arrow()+v('propensity',{julia:'g',math:'ĝ(W)'}):a+syntaxR('given')+design+arrow()+model('ĝ','Fitted RHC probability')+syntaxR('Predict for each patient at the same baseline')+arrow()+v('propensity',{julia:'g',math:'ĝ(W)'}))}</details>`;
  snippet='g_fit = fit_logistic(design, a)\nq_fit = fit_logistic(hcat(design, a), y)';
  note=julia?'These are actual lines inside prepare_full. During fitting, a and y are Float64 vectors (0.0/1.0, carrying the same information as integer coding). fit_logistic takes (design matrix, response vector). hcat binds 17 design columns and a into 18 columns; g uses 17 design columns to predict a.':'To fit Q, use observed death Y as response and bind the 17 columns of Z with observed A into 18 inputs. To fit g, use observed A as response and the 17 columns of Z as inputs. Both models preserve patient row order and output patient-level risks or treatment probabilities.';
 }
 if(stage==='predict'){
  const scenario=state.scenario||'one',one=scenario==='one',actual=scenario==='observed';
  const aid=actual?'treatment-vector':one?'prediction-a1':'prediction-a0',qid=actual?'qa':one?'q1':'q0',pname=actual?'a':one?'ones(n)':'zeros(n)';
  const concatenated=`<div class="ov-concat"><div class="ov-choice">${matrix(data)}${syntaxR(julia?',':'|')}${v(aid,{math:actual?'Observed A':one?'All 1s':'All 0s',julia:pname,label:actual?'Prediction input = observed A':one?'Prediction input: all 1s':'Prediction input: all 0s'})}</div><strong>${r?'Input after cbind':julia?'Input after hcat':'Input after column binding'}: ${data.n} × 18</strong></div>`;
  body=expr('Keep baseline and coefficients fixed, change input A and predict in the same row order',syntaxR(julia?'expit.(hcat(':'expit((')+concatenated+syntaxR(julia?') *':') ×')+v('q-coefficients',{julia:'q_fit.coefficients',math:'β̂Q',label:'Same outcome regression coefficients',alignment:'feature'})+syntaxR(r?'))':')')+arrow()+v(qid,{julia:qid,math:actual?'Q̂(A,W)':one?'Q̂(1,W)':'Q̂(0,W)',sourceIds:actual?data.A.map(a=>a?'q1':'q0'):undefined}));
  snippet=actual?'qa = expit.(hcat(design, a) * q_fit.coefficients)':`q${one?1:0} = expit.(hcat(design, ${pname}) * q_fit.coefficients)`;
  note='Multiplying the n×18 design matrix by the 18 coefficients gives n linear predictors. expit then converts each predictor to a probability. Coefficient rows follow features, not patient i. Original observed A stays fixed; only the prediction input to the same model changes.';
 }
 if(stage==='select'){
  body=expr('Use observed A to select q1 or q0 in each row to form qa',v('treatment-vector',{math:'A',julia:'fit.a'})+syntaxR('Select row by row')+`<div class="ov-choice">${v('q1',{julia:'q1',math:'Q̂(1,W)'})}${v('q0',{julia:'q0',math:'Q̂(0,W)'})}</div>`+arrow()+v('qa',{math:'Q̂(A,W)',julia:'qa',sourceIds:data.A.map(a=>a?'q1':'q0')}));
  snippet='qa = fit.a .* q1 + (1 .- fit.a) .* q0';
  note=julia?'.* multiplies elementwise and .+ adds elementwise; + between two equal-length vectors also adds elementwise here. A=1 selects purple q1; A=0 selects cyan q0. The columns come from model calls with A=1 and A=0 for everyone.':'Select by observed A in each row. When A=1, A retains Q̂(1,W) and (1−A) makes Q̂(0,W) zero; A=0 does the reverse. Their sum gives Q̂(A,W). Both columns come from model calls setting A=1 or A=0 for everyone.';
 }
 if(stage==='estimate'){
  body=expr('Subtract prediction vectors elementwise and average to obtain the initial risk difference',`<div class="ov-update-anchor"><span class="ov-method">TMLE: Chapter 8 updates Q in these columns</span><div class="ov-choice">${v('q1',{julia:'q1',math:'Q̂(1,W)'})}${syntaxR('−')}${v('q0',{julia:'q0',math:'Q̂(0,W)'})}</div></div>`+arrow()+v('risk-difference',{julia:'q1 .- q0',math:'Q̂1−Q̂0',label:'Model prediction contrast at the same baseline'})+syntaxR(julia?'sum(·) / n':'Mean over all n patients')+arrow()+`<div class="ov-update-anchor">${s('initial-risk',data.initialRiskDifference,{math:'Ψ̂plug',julia:'initial_estimate',label:'Initial plug-in risk difference',colour:'purple',unit:'Probability difference'})}<span class="ov-method ov-method-aipw">AIPW: Chapter 8 adds a correction to the output</span></div>`);
  snippet='initial_estimate = sum(q1 .- q0) / n';
  note=`First form ${data.n} prediction contrasts, then average; the initial result is about ${f(100*data.initialRiskDifference,5)} percentage points. Chapter 8 uses the EIF to guide two corrections. This full-cohort mean stays fixed when the display window changes.`;
 }

 if(meta.chapter===1){
  const c=meanContamination(data,{t:state.t??.1,z:state.z??1}),mu=data.mean.meanY,g=data.grouped;
  const sv=(id,values,math,julia,label,colour='slate')=>v(id,{values,math,julia,label,colour,alignment:'outcome'});
  const prob=()=>sv('probability',g.p,'p(y) · original P','p',`${g.counts[0]}/n and ${g.counts[1]}/n`);
  const yy=()=>sv('support-y',g.y,'Possible outcome y','support_y','Two rows: survival and death','blue');
  const dd=()=>sv('support-influence',g.D,'D(y;P)','support_D','Always subtract original μ','orange');
  const pt=()=>sv('new-probability',c.newP,'pₜ(y)','p_t',`New probability, z=${c.z}, t=${f(c.t)}`);
  const mm=()=>s('risk',mu,{math:'μ · fixed original P',julia:['patient-mean','patient-if'].includes(stage)?'risk':'mu',label:julia?'Equal values: mu = risk; original P fixed':'Fixed mean of reference distribution P',unit:'Probability'});
  const mt=()=>s('new-risk',c.newMean,{math:'μₜ',julia:'mu_t',label:'Mean under the new distribution',colour:'blue',unit:'Probability'});
  const tt=()=>s('step-size',c.t,{math:'t',julia:'t',label:'Replacement proportion; dimensionless'});
  const deriv=()=>s('derivative',c.derivative,{math:'z−μ',julia:'derivative',label:'Rate per unit replacement proportion',colour:'orange'});
  const weighted=(id,values,math,julia,label,colour='green')=>sv(id,values,math,julia,label,colour);
  const algebra=(lines)=>`<ol class="ov-algebra">${lines.map(([formula,why])=>`<li><code>${escape(formula)}</code><span>${why}</span></li>`).join('')}</ol>`;
  if(stage==='patient-mean'){
   body=expr('Sum the full Y vector and divide by the patient count to obtain scalar risk',syntaxR(julia?'sum(':'Σᵢ(')+v('outcomes',{math:'Yᵢ',julia:'y',label:'One observed outcome per patient'})+syntaxR(')')+arrow()+s('events',data.mean.sumY,{math:'M=ΣᵢYᵢ',julia:'events',label:'Total deaths',unit:'Patients'})+syntaxR('÷')+s('sample-size',data.n,{math:'n',julia:'n',label:'Total records',unit:'Patients'})+arrow()+mm());
   snippet='events = sum(y)\nrisk = events / n';
   note=`Each record has weight 1/${data.n}. Sum the ${data.mean.sumY} death indicators and divide by the cohort size to obtain one probability, ${f(mu)}. Rows with Y=0 also enter the denominator.`;
  }
  if(stage==='weighted-mean'){
   body=`<div class="ov-grouping">Group the full original CSV: ${g.counts[0]} patients have Y=0 and ${g.counts[1]} have Y=1. Dividing by ${data.n} gives the two probabilities below. Here row labels change from patient i to outcome y.</div>`+expr('Multiply original probabilities by possible outcomes elementwise, then sum',prob()+syntaxR(julia?'.*':'⊙')+yy()+arrow()+weighted('mean-contribution',g.py,'p(y)×y','p .* support_y','Each group’s mean contribution')+syntaxR(julia?'sum':'Σ sum both groups')+arrow()+mm());
   snippet='support_y = [0.0, 1.0]\np = [count(==(v), y) / n for v in support_y]\nmu = sum(p .* support_y)';
   note=julia?'Both ⊙ and Julia .* multiply corresponding elements. Sum both products for the weighted mean; probabilities already include group-size weights. mu and risk are numerically equal: risk emphasises the sample proportion, mu the reference mean held fixed next. From here μ is fixed at the mean of original reference distribution P=P_n.':'⊙ multiplies corresponding vector entries to obtain each group’s mean contribution. Σ adds both contributions; p(y) already contains group-size weights. μ is fixed at the mean of original reference distribution P=Pₙ, numerically equal here to the sample death proportion.';
  }
  if(stage==='reweight'){
   body=expr('Retain 1−t of original probabilities and add point mass t to obtain new probabilities',syntaxR('(1 −')+tt()+syntaxR(')')+syntaxR(julia?'.*':'×')+prob()+syntaxR('+')+tt()+syntaxR(julia?'.*':'×')+sv('point-probability',c.pointP,'1{y=z}','point','Point mass at the selected outcome')+arrow()+pt());
   snippet='point = Float64.(support_y .== z)\np_t = (1 - t) .* p + t .* point';
   body+=expr('Inspect retained and added components separately',sv('retained-probability',c.retainedP,'(1−t)p','(1 - t) .* p',`Total mass ${f(1-c.t)}`)+syntaxR('+')+sv('added-probability',c.addedP,'tδz','t .* point',`Total mass ${f(c.t)}`)+arrow()+pt());
   note=julia?`.== checks which outcome equals z; Float64. converts true/false to 1.0/0.0. The added mass enters only the selected outcome group. p_t currently sums to ${f(c.probabilitySum)}. Rows represent survival and death probabilities, respectively.`:`Indicator vector 1{y=z} is 1 in the selected outcome group and 0 in the other. Multiply by added mass t, then add retained (1−t)p. New probabilities sum to ${f(c.probabilitySum)}. Rows represent survival and death probabilities.`;
  }
  if(stage==='changed-mean'){
   body=expr('Multiply new probabilities by the same outcomes elementwise, then sum',pt()+syntaxR(julia?'.*':'⊙')+yy()+arrow()+weighted('new-contribution',c.weightedY,'pₜ(y)×y','p_t .* support_y','Both groups’ contributions to the new mean')+syntaxR(julia?'sum':'Σ sum both groups')+arrow()+mt());
   body+=expr('Subtract the fixed original mean from the new mean to obtain the change',mt()+syntaxR('−')+mm()+arrow()+s('mean-delta',c.delta,{math:'Δμ',julia:'delta',label:'New minus original',colour:'green',unit:'Probability difference'}));
   snippet='mu_t = sum(p_t .* support_y)\ndelta = mu_t - mu';
   note=`Current change: ${f(c.delta)} on the probability scale, or ${f(c.delta*100)} percentage points. Original μ stays fixed as t or z changes; only the new-distribution mean on the right is recomputed.`;
  }
  if(stage==='change-rate'||stage==='linear-mean'){
   body=expr('Divide actual change by replacement step size and compare with the exact linear rule',s('mean-delta',c.delta,{math:'μₜ−μ',julia:'delta',label:'Change',colour:'green'})+syntaxR('÷')+tt()+arrow()+(c.rate===null?'<div class="ov-undefined" data-quotient="undefined">t=0: 0/0 is undefined; the derivative remains z−μ</div>':s('change-rate',c.rate,{math:'(μₜ−μ)/t',julia:'rate',label:'Finite-step rate',colour:'orange'}))+syntaxR('; derivative')+deriv());
   body+=algebra([
    ['μₜ = Σᵧ [(1−t)p(y) + t·1{y=z}]·y','p(y) is the original probability; 1{y=z} equals 1 only at the selected outcome.'],
    ['= (1−t)Σᵧ p(y)y + tΣᵧ 1{y=z}y','Distribute each term, then factor 1−t and t out of the sum because they do not depend on y.'],
    ['= (1−t)μ + tz','The first sum is original μ by definition; only y=z remains in the second.'],
    ['= μ − tμ + tz = μ + t(z−μ)','Expand (1−t)μ, then factor out t; linearity of the mean makes this exact.'],
    ['μₜ − μ = μ − tμ + tz − μ = −tμ + tz = t(z−μ)','New minus original: +μ and −μ cancel; factor t out of the remaining terms.'],
    ['(μₜ−μ)/t = t(z−μ)/t = z−μ, t≠0','Cancel t only when t is non-zero; at t=0 define the derivative by a limit.']]);
   snippet='derivative = z - mu\nrate = t == 0 ? missing : delta / t\nlinear_mean = mu + t * derivative';
   note=`Original mean μ=${f(mu)} is fixed; currently z=${c.z}, t=${f(c.t)}. Direct weighting gives μ_t=${f(c.newMean)}; the linear formula gives ${f(c.linearMean)}. The two formulas are algebraically identical. The control retains t=0 to expose the undefined quotient at this boundary.`;
  }
  if(stage==='lookup-rate'||stage==='lookup-if'){
   body=expr('Subtract the same original mean from each possible outcome to form the influence-function table',yy()+syntaxR(julia?'.-':'− subtract from each')+mm()+arrow()+dd());
   body+=`<p class="ov-grouping">Selected z=${c.z}: D(${c.z};P)=${f(c.z)}−${f(mu)}=${f(c.derivative)}. The function input changes; original P and μ stay fixed.</p>`;
   snippet='support_D = support_y .- mu\nderivative = z - mu';
   note='D names the function, z in parentheses is the input and P identifies the reference distribution. Both outputs specify the complete rule. Multiply by t for actual mean change. With random input Y the rule is fixed and the sampled outcome determines the output.';
  }
  if(stage==='patient-if'){
   body=expr('Subtract the same scalar from every observed Y to obtain an IF vector in the same order',v('outcomes',{math:'Observed Yᵢ',julia:'y'})+syntaxR(julia?'.-':'− subtract from each')+mm()+arrow()+v('influence',{math:'D(Yᵢ;P)',julia:'influence',label:'Same i retained in the output'}));
   snippet='influence = y .- risk';
   note=julia?'This returns a 5735-element vector; the earlier two-row table gives two possible values. i always labels patients and y=0/1 labels outcome groups. .- broadcasts a scalar to each vector element.':'This outputs 5735 influence values; the earlier table has two possible outputs. Subtract the same fixed reference mean μ from each observed Yᵢ, preserving patient i in the output. i labels patients; y=0,1 labels outcome groups.';
  }
  if(stage==='mean-if'){
   body=expr('Sum the full IF vector and divide by n to obtain its mean',syntaxR(julia?'sum(':'Σᵢ(')+v('influence',{math:'D(Yᵢ;P)',julia:'influence'})+syntaxR(') /')+s('sample-size',data.n,{math:'n',julia:'n',label:'All patients',unit:'Patients'})+arrow()+s('mean-influence',data.mean.meanD,{math:'Mean D over all n entries',julia:'mean_influence',label:'Exactly 0 algebraically; approximately 0 numerically',colour:'orange'}));
   snippet='mean_influence = sum(influence) / n';
   note=`The actual floating-point result is ${data.mean.meanD.toExponential(3)}, displayed as 0 at this precision. Every entry subtracts this sample’s mean, so its P_n mean is 0. Chapter 1, Section 4 uses two groups to distinguish sample centring from true error.`;
  }
  if(stage==='grouped-centre'){
   body=expr('Multiply original probabilities by original IF values and sum to obtain zero',prob()+syntaxR(julia?'.*':'⊙')+dd()+arrow()+weighted('if-contribution',g.pD,'p(y)D(y;P)','p .* support_D','Signed weighted contributions')+syntaxR(julia?'sum':'Σ sum both groups')+arrow()+s('grouped-if-mean',g.meanD,{math:'E_P[D]',julia:'sum(p .* support_D)',label:'Weighted under original P',colour:'orange'}));
   body+=algebra([
    ['Σᵧ p(y)D(y;P) = Σᵧ p(y)(y−μ)','Substitute the rule D=y−μ; original μ is the same constant for both groups.'],
    ['= Σᵧ [p(y)y − p(y)μ]','Distribute within each group, retaining both bracketed terms.'],
    ['= Σᵧ p(y)y − Σᵧ p(y)μ','The finite sum of differences equals the difference of sums.'],
    ['= μ − μΣᵧ p(y)','Use the definition of μ in the first term; factor μ out of the second because it does not vary with y.'],
    ['= μ − μ×1 = 0','Valid probabilities sum to 1. Positive and negative contributions cancel to give 0.']]);
   snippet='support_D = support_y .- mu\ngrouped_mean_D = sum(p .* support_D)';
   note=`The two contributions under original P are ${f(g.pD[0])} and ${f(g.pD[1])}. Observe the negative sign: the Y=0 group contributes 0 to the mean, but contributes a non-zero IF term.`;
  }
  if(stage==='old-new'){
   body=expr('Hold original D fixed and change only the averaging weights',pt()+syntaxR(julia?'.*':'⊙')+dd()+syntaxR(julia?'sum':'Σ sum both groups')+arrow()+s('old-d-new-mean',c.oldMeanD,{math:'E_Pt[D_P]',julia:'old_mean_D',label:'Original function averaged with new weights',colour:'orange'}));
   body+=expr('Define a distinct new D and check recentring',yy()+syntaxR(julia?'.-':'−')+mt()+arrow()+sv('new-support-influence',c.newD,'D(y;Pₜ)','new_support_D','New function: subtract new μₜ','orange'));
   body+=expr('Weight the new function by new probabilities and verify a zero sum',pt()+syntaxR(julia?'.*':'⊙')+sv('new-support-influence',c.newD,'D(y;Pₜ)','new_support_D','New function, subtract μₜ','orange')+arrow()+weighted('new-if-contribution',c.weightedNewD,'pₜ(y)D(y;Pₜ)','p_t .* new_support_D','Contributions after recentring')+syntaxR(julia?'sum':'Σ sum both groups')+arrow()+s('new-d-new-mean',c.newMeanD,{math:'E_Pt[D_Pt]',julia:'new_mean_D',label:'New function averaged with new weights',colour:'orange'}));
   snippet='old_mean_D = sum(p_t .* support_D)\nnew_support_D = support_y .- mu_t\nnew_mean_D = sum(p_t .* new_support_D)';
   note=`Original D has mean ${f(c.oldMeanD)} under new weights, equal to μ_t−μ; newly defined D_Pt has mean ${f(c.newMeanD)} under new weights. Each function is centred at its corresponding distribution’s mean.`;
  }
  if(stage==='survival'){
   body=expr('Compute 1−Y for each patient and average to obtain survival probability',syntaxR(julia?'1 .−':'1 − each')+v('outcomes',{math:'Yᵢ',julia:'y'})+arrow()+v('survival-vector',{values:data.Y.map(y=>1-y),math:'1−Yᵢ',julia:'alive',label:'30-day survival indicator in the same row',colour:'blue'})+syntaxR(julia?'sum(·) / n':'Mean over all n patients')+arrow()+s('survival-risk',1-mu,{math:'S(30)=1−μ',julia:'survival',label:'30-day survival probability',colour:'blue'}));
   snippet='alive = 1 .- y\nsurvival = sum(alive) / n\nsurvival_influence = alive .- survival';
   note=`D_S=(1−Y)−(1−μ)=1−Y−1+μ=−Y+μ=−(Y−μ). The constant 1 terms cancel; survival probability ${f(1-mu)} and original death risk sum to 1.`;
  }
 }
 if(r){snippet=rStageCode(stage,state.scenario||'one');note=R_STAGE_NOTES[stage]+(meta.chapter===1?' When running the workbook, set t and z to the current controls; keep the original reference mean fixed.':'');}
 return `<div class="ov-canvas-content" data-mode="${data.mode}"><div class="ov-reading-mode">${r?'R object operations':julia?'Julia object operations':'Mathematical operations'}</div>${body}${julia?code(snippet,r?'R':'Julia'):''}<p class="ov-explanation">${note}${!r&&julia&&['source','patient-mean'].includes(stage)?' n×1 shows the mathematical column shape; a one-dimensional Julia Vector has size (n,).':''}</p></div>`;
}
export function objectToolbar(chapter,data){
 return `<div class="ov-toolbar" data-object-toolbar="${chapter}">${chapter===0?'':`<fieldset><legend>Reading mode for this chapter’s object figures</legend><label><input type="radio" name="object-mode-${chapter}" value="math" checked> Mathematical objects</label><label><input type="radio" name="object-mode-${chapter}" value="julia"> Julia operations</label><label><input type="radio" name="object-mode-${chapter}" value="r"> R operations</label></fieldset>`}<div class="ov-row-controls"><button type="button" data-object-action="previous">Previous 6 rows</button><button type="button" data-object-action="next">Next 6 rows</button><label>Check the same patient row<select data-object-selected>${data.rowNumbers.map(i=>`<option value="${i}">Original row i=${i}</option>`).join('')}</select></label><button type="button" data-object-action="reset">Reset object figures</button></div>${chapter===1?`<fieldset class="ov-perturb-controls"><legend>Adjust probabilities of both outcome categories</legend><label>Outcome receiving weight z<select data-object-z><option value="1">1: 30-day death</option><option value="0">0: 30-day survival</option></select></label><label>Replacement proportion t <input type="range" data-object-t min="0" max="1" step="0.01" value="0.1"><output data-object-t-value>0.10 (10%)</output></label></fieldset><p>The text and folded worked examples use z=1, t=0.1. These controls synchronise figures labelled “Real-data objects”; other examples retain their stated settings.</p>`:''}<p class="ov-status" role="status" aria-live="polite">Showing original rows ${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}; operations always use all ${data.n} rows. Selected i=${data.rowNumbers[0]}.</p><div class="ov-legend" aria-label="Consistent object colours across chapters"><span class="ov-blue">Y outcome</span><span class="ov-amber">A treatment</span><span class="ov-teal">Baseline matrix</span><span class="ov-cyan">Q0 prediction</span><span class="ov-purple">Q1 prediction</span><span class="ov-orange">Mean IF</span></div><p>A matrix organises data in rows and columns; a vector lists values in order; a scalar is one number. Each object has a name, dimensions and row labels. Move through groups of six rows to inspect different positions in the full vector. n×1 shows the mathematical column shape, one entry per row. Coefficient vectors follow feature order; patient vectors follow row i. Σ sums the full vector; a mean also divides by the number of entries.</p></div>`;
}
export function objectFigure(stage,data,{chapter=OBJECT_STAGES[stage]?.chapter,toolbar=false,id=`object-${chapter}-${stage}`,visualId='',extra=''}={}){
 const meta=OBJECT_STAGES[stage];if(!meta)throw Error('Object figure metadata missing');
 return `<figure class="object-figure" id="${id}" ${visualId?`data-visual-id="${visualId}"`: ''} data-object-stage="${stage}" data-object-chapter="${chapter}" aria-labelledby="object-title-${chapter}-${stage}"><div class="ov-eyebrow">Compute step by step with real data</div><h3 id="object-title-${chapter}-${stage}">${meta.title}</h3><p>${meta.description}</p>${toolbar?objectToolbar(chapter,data):''}<div class="ov-canvas">${renderObjectStage(stage,data)}</div>${extra}<figcaption>Numbers come from the same original RHC CSV; decimals are rounded only for display. Patient vectors, where present, show only rows <span data-object-window>${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}</span>; calculations use all ${data.n} rows. The two-entry outcome support vector uses row labels y=0,1.</figcaption></figure>`;
}
