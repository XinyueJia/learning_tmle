import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync, mkdtempSync, rmSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {tmpdir, homedir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import katex from 'katex';
import {readRhc, prepareRhc, solveRhc} from '../../shared/js/rhc.js';
import {tmleTrace} from '../../shared/js/tmle-trace.js';

const root=fileURLToPath(new URL('../../',import.meta.url));
const read=path=>readFileSync(join(root,path),'utf8');
const mapping=JSON.parse(read('zh/src/julia/ch08-trace.json'));
const source=read(mapping.source);
const scalarKeys=['n','epsilon','psi','score_mean','eif_mean'];
const vectorKeys=Object.keys(mapping.columns).filter(key=>!['rows','fit',...scalarKeys].includes(key));
const near=(a,b,tol=2e-10)=>assert(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} differs from ${b} beyond ${tol}`);
const average=values=>values.reduce((total,value)=>total+value,0)/values.length;

function validateMap(text,map){
 const lines=text.trimEnd().split('\n');
 assert.equal(lines.length,map.lineCount,'Source line count drift');
 const executable=lines.flatMap((line,i)=>line.trim()&&!line.trimStart().startsWith('#')?[i+1]:[]);
 assert.deepEqual(map.lines.map(entry=>entry.line),executable,'Missing or duplicated explanation');
 for(const entry of map.lines){
  assert.equal(entry.code,lines[entry.line-1],`Source drift at line ${entry.line}`);
  assert(entry.operation.length>=30,`Missing beginner operation at ${entry.line}`);
  for(const key of [...entry.inputs,...entry.outputs]){
   assert(map.columns[key],`Unknown variable ${key}`);
   assert.deepEqual(entry.dimensions[key],map.columns[key].dimensions);
  }
  const assigned=entry.code.match(/^(\w+) = /)?.[1];
  if(assigned)assert.deepEqual(entry.outputs,[assigned],`Output key must be actual variable ${assigned}`);
  if(entry.formulaTex!==null)katex.renderToString(entry.formulaTex,{throwOnError:true,strict:'error'});
 }
}

test('every executable workbook line has exact source, operation, dimensions and parseable formula',()=>{
 assert.equal(mapping.version,1);
 assert.equal(mapping.source,'zh/julia/tmle_trace.jl');
 validateMap(source,mapping);
 assert.equal(mapping.lines.length,40);
 const assignments=mapping.lines.filter(entry=>/^\w+ = /.test(entry.code));
 assert.deepEqual(new Set(assignments.map(entry=>entry.outputs[0])),new Set(Object.keys(mapping.columns)));
 for(const key of vectorKeys){
  assert.deepEqual(mapping.columns[key].dimensions,['n']);
  assert.equal(mapping.columns[key].type,'Vector{Float64}');
 }
 for(const key of scalarKeys)assert.deepEqual(mapping.columns[key].dimensions,[]);
 assert.equal(mapping.columns.n.type,'Int');
 assert(!source.includes('solve_full('),'Default workbook evaluates a chosen epsilon without solving first');
});

test('source edits, missing explanations and duplicated lines fail correspondence checks',()=>{
 assert.throws(()=>validateMap(source.replace('shift = epsilon .* h','shift = epsilon .+ h'),mapping),/Source drift/);
 const missing=structuredClone(mapping);missing.lines=missing.lines.filter(entry=>entry.outputs[0]!=='residual');
 assert.throws(()=>validateMap(source,missing),/Missing or duplicated/);
 const duplicate=structuredClone(mapping);duplicate.lines.push(duplicate.lines[0]);
 assert.throws(()=>validateMap(source,duplicate),/Missing or duplicated/);
 const invalid=structuredClone(mapping);invalid.lines.find(entry=>entry.outputs[0]==='qa').inputs.push('unobserved-column');
 assert.throws(()=>validateMap(source,invalid),/Unknown variable/);
});

test('both arms have explicit offset, scalar-times-direction shift, eta and expit columns',()=>{
 const byOutput=Object.fromEntries(mapping.lines.filter(entry=>entry.outputs.length).map(entry=>[entry.outputs[0],entry]));
 for(const suffix of ['0','1']){
  assert.equal(byOutput[`offset${suffix}`].code,`offset${suffix} = logit.(q${suffix})`);
  assert.deepEqual(byOutput[`shift${suffix}`].inputs,['epsilon',`h${suffix}`]);
  assert.deepEqual(byOutput[`eta${suffix}`].inputs,[`offset${suffix}`,`shift${suffix}`]);
  assert.equal(byOutput[`qstar${suffix}`].code,`qstar${suffix} = expit.(eta${suffix})`);
 }
 assert.equal(byOutput.h.code,'h = a ./ g .- (1 .- a) ./ (1 .- g)');
 assert.equal(byOutput.psi.code,'psi = sum(contrast) / n');
 assert.equal(byOutput.score_mean.code,'score_mean = sum(score_contribution) / n');
 assert.equal(byOutput.eif_mean.code,'eif_mean = sum(eif) / n');
 assert.match(byOutput.shift.operation,/标量逐项乘/);
 assert.match(byOutput.psi.operation,/全部5735人/);
 assert.match(byOutput.centred.operation,/不是每一项都为0/);
});


test('display mathematics shares one vocabulary with the current epsilon interface',()=>{
 const columns=mapping.columns;
 assert.equal(columns.score_contribution.symbol,'c_i');
 assert.equal(columns.centred.symbol,String.raw`\Delta_{\epsilon,i}-\widehat\psi_\epsilon`);
 assert.equal(columns.contrast.symbol,String.raw`\Delta_{\epsilon,i}`);
 assert.equal(columns.h.symbol,'H_{A,i}');
 assert.equal(columns.offset.symbol,'o_{A,i}');
 assert.equal(columns.shift.symbol,'b_{A,i}');
 assert.equal(columns.eta.symbol,String.raw`\eta_{A,i}`);
 assert.equal(columns.score_mean.symbol,String.raw`s_n(\epsilon)`);
 const byOutput=Object.fromEntries(mapping.lines.filter(entry=>entry.outputs.length).map(entry=>[entry.outputs[0],entry]));
 assert.equal(byOutput.score_contribution.formulaTex,'c_i=H_{A,i}r_i');
 assert.equal(byOutput.centred.formulaTex,columns.centred.symbol);
 for(const [key,arm] of [['qstar_a','A'],['qstar0','0'],['qstar1','1']]){
  const symbol=String.raw`Q_{\epsilon,${arm},i}`;
  assert.equal(columns[key].symbol,symbol);
  assert(byOutput[key].formulaTex.startsWith(symbol+'='));
 }
 for(const entry of mapping.lines){
  if(entry.formulaTex===null)continue;
  assert(!entry.formulaTex.includes(String.raw`\tau`),'Contrast is Delta throughout');
  assert(!/q\^\*|Q\^\*/.test(entry.formulaTex),'An arbitrary epsilon is not labelled as the solved update');
  assert(!entry.formulaTex.includes('s_i'),'c_i is the only score-contribution symbol');
 }
});

function installedJulia(){
 if(process.env.JULIA_BIN)return process.env.JULIA_BIN;
 const directory=join(homedir(),'.julia','juliaup');
 if(existsSync(directory)){
  for(const version of readdirSync(directory).sort().reverse()){
   const binary=join(directory,version,'Julia-1.12.app','Contents','Resources','julia','bin','julia');
   if(existsSync(binary))return binary;
   const plain=join(directory,version,'bin','julia');
   if(existsSync(plain))return plain;
  }
 }
 return 'julia';
}
const binary=installedJulia();
const available=spawnSync(binary,['--startup-file=no','--history-file=no','--version'],{encoding:'utf8'});

function runWorkbook(epsilon,depot){
 const emission=vectorKeys.map(key=>`println("TRACE\\t${key}\\t", join(${key}, ","))`).join('\n');
 const programme=[
  `include(${JSON.stringify(join(root,mapping.source))})`,
  '@assert length(rows) == n == 5735 && sum(y) == 1918',
  '@assert size(fit.design) == (n,17)',
  '@assert a == fit.a && y == fit.y && g == fit.g && q0 == fit.q0 && q1 == fit.q1',
  '@assert all(qstar_a[i] ≈ (a[i] == 1 ? qstar1[i] : qstar0[i]) for i in 1:n)',
  'reference = full_at(fit, epsilon)',
  '@assert isapprox(psi, reference.estimate; atol=1e-12,rtol=0)',
  '@assert isapprox(score_mean, reference.score; atol=1e-12,rtol=0)',
  '@assert isapprox(eif_mean, reference.eif_mean; atol=1e-12,rtol=0)',
  '@assert maximum(abs.(qstar0 .- reference.q0)) < 1e-12',
  '@assert maximum(abs.(qstar1 .- reference.q1)) < 1e-12',
  'delta = 1e-6',
  'likelihood_at(t) = sum(y .* log.(expit.(offset .+ t .* h)) .+ (1 .- y) .* log1p.(-expit.(offset .+ t .* h))) / n',
  'likelihood = likelihood_at(epsilon)',
  'derivative = (likelihood_at(epsilon+delta) - likelihood_at(epsilon-delta)) / (2delta)',
  'slope = -sum(h.^2 .* qstar_a .* (1 .- qstar_a)) / n',
  '@assert abs(derivative - score_mean) < 1e-8',
  '@assert abs(sum(centred)/n) < 1e-12 && abs(eif_mean-score_mean) < 1e-12',
  '@assert all(isfinite, [offset; offset0; offset1; h; h0; h1; shift; shift0; shift1; eta; eta0; eta1; eif])',
  emission,
  'println("SUMMARY\\t",join([n,epsilon,psi,score_mean,eif_mean,likelihood,derivative,slope],","))',
 ].join('\n');
 const env={...process.env,JULIA_DEPOT_PATH:depot};
 if(epsilon===undefined)delete env.TMLE_EPSILON;else env.TMLE_EPSILON=String(epsilon);
 const result=spawnSync(binary,['--startup-file=no','--history-file=no','--compiled-modules=no','-e',programme],{cwd:root,env,encoding:'utf8',timeout:90000,maxBuffer:32*1024*1024});
 assert.equal(result.status,0,result.stderr||String(result.error));
 const vectors={};let summary;
 for(const line of result.stdout.split('\n')){
  if(line.startsWith('TRACE\t')){const[,key,values]=line.split('\t');vectors[key]=values.split(',').map(Number);}
  if(line.startsWith('SUMMARY\t'))summary=line.slice(8).split(',').map(Number);
 }
 assert(summary,'Workbook summary emitted');
 assert.deepEqual(Object.keys(vectors),vectorKeys);
 return {vectors,summary};
}

test('real Julia workbook at zero, positive, negative and solved epsilon matches all JS columns', {skip:available.status!==0,timeout:90000},()=>{
 const fit=prepareRhc(readRhc(read('shared/data/public/rhc/source.csv')));
 const solved=solveRhc(fit),depot=mkdtempSync(join(tmpdir(),'tmle-julia-trace-'));
 const observed=JSON.stringify(fit.rows.map(row=>[row.a,row.y]));
 try{
  for(const epsilon of [undefined,0.002,-0.002,solved.epsilon]){
   const actual=runWorkbook(epsilon,depot),expected=tmleTrace(fit,epsilon??0);
   assert.deepEqual(new Set(vectorKeys),new Set(Object.keys(expected.vectors)));
   for(const key of vectorKeys){
    assert.equal(actual.vectors[key].length,5735,key);
    actual.vectors[key].forEach((value,i)=>near(value,expected.vectors[key][i],3e-10));
   }
   const[n,eps,psi,score,eifMean,likelihood,derivative,slope]=actual.summary;
   assert.equal(n,5735);assert.equal(eps,epsilon??0);
   near(psi,expected.summary.estimate);near(score,expected.summary.score);near(eifMean,expected.summary.eif_mean);
   near(likelihood,expected.summary.log_likelihood);near(slope,expected.summary.slope);near(derivative,score,1e-8);
   const v=actual.vectors;
   for(const key of ['g','q0','q1','qa','qstar_a','qstar0','qstar1'])assert(v[key].every(p=>p>0&&p<1));
   assert.deepEqual(v.a,fit.rows.map(row=>row.a));assert.deepEqual(v.y,fit.rows.map(row=>row.y));
   near(average(v.score_contribution),score,1e-12);near(average(v.eif),eifMean,1e-12);near(average(v.centred),0,1e-12);
   if(epsilon===undefined){v.shift.forEach(value=>near(value,0,0));v.qstar0.forEach((value,i)=>near(value,v.q0[i],1e-12));}
   if(epsilon===solved.epsilon){assert(Math.abs(score)<2e-12);assert(Math.abs(eifMean)<2e-12);}
  }
  assert.equal(JSON.stringify(fit.rows.map(row=>[row.a,row.y])),observed);
 }finally{rmSync(depot,{recursive:true,force:true});}
});


test('non-finite epsilon and floating-point prediction boundaries fail without clipping', {skip:available.status!==0,timeout:30000},()=>{
 const depot=mkdtempSync(join(tmpdir(),'tmle-julia-trace-errors-'));
 try{
  for(const [epsilon,message] of [['Inf',/TMLE_EPSILON must be finite/],['1000000',/AssertionError/]]){
   const result=spawnSync(binary,['--startup-file=no','--history-file=no','--compiled-modules=no',join(root,mapping.source)],{cwd:root,env:{...process.env,JULIA_DEPOT_PATH:depot,TMLE_EPSILON:epsilon},encoding:'utf8',timeout:30000});
   assert.notEqual(result.status,0);
   assert.match(result.stderr,message);
  }
 }finally{rmSync(depot,{recursive:true,force:true});}
});
