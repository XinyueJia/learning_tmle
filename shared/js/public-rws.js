/** Public Ng2021 source audit. No clinical endpoint or effect estimator is exported. */
export const PUBLIC_DRUGS = Object.freeze(['Afatinib', 'Erlotinib', 'Gefitinib']);
const REQUIRED = ['Group_S','Age','Male','Smoking','ECOG','Progression','Death','Survived','Follow_up_month','PFS_month','EGFR_S'];
export function parsePublicCsv(text) {
  if (typeof text !== 'string') throw new TypeError('CSV text is required');
  text = text.replace(/^\uFEFF/,'');
  const table=[];let row=[],field='',quoted=false,closed=false;
  const endField=()=>{row.push(field);field='';closed=false;};
  const endRow=()=>{endField();table.push(row);row=[];};
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(quoted){if(c==='"'){if(text[i+1]==='"'){field+='"';i++;}else{quoted=false;closed=true;}}else field+=c;continue;}
    if(c===','){endField();continue;}
    if(c==='\n'||c==='\r'){endRow();if(c==='\r'&&text[i+1]==='\n')i++;continue;}
    if(c==='"'){if(field||closed)throw new SyntaxError('Unexpected quote in CSV');quoted=true;continue;}
    if(closed)throw new SyntaxError('Unexpected text after a quoted CSV field');field+=c;
  }
  if(quoted)throw new SyntaxError('Unterminated quoted CSV field');
  if(field||closed||row.length)endRow();
  if(table.length<2)throw new RangeError('Header and records are required');
  const headers=table.shift();
  if(headers.some(h=>!h)||new Set(headers).size!==headers.length)throw new RangeError('Unique non-empty CSV headers are required');
  return table.map((cells,i)=>{
    if(cells.length!==headers.length)throw new RangeError(`CSV row ${i+2} has the wrong number of fields`);
    return Object.fromEntries(headers.map((h,j)=>[h,cells[j]]));
  });
}
function number(row,key){const value=row[key];if(typeof value!=='string'||!value.trim()||!Number.isFinite(Number(value)))throw new TypeError(`${key} must contain a finite number`);return Number(value);}
export function validatePublicRows(rows){
  if(!Array.isArray(rows)||!rows.length)throw new TypeError('Non-empty public records are required');
  for(const row of rows){
    if(!row||REQUIRED.some(k=>!Object.hasOwn(row,k)))throw new TypeError('Required public source columns are missing');
    if(!PUBLIC_DRUGS.includes(row.Group_S))throw new RangeError('Unexpected initial drug label');
    for(const key of ['Male','Smoking','Progression','Death','Survived'])if(![0,1].includes(number(row,key)))throw new RangeError(`${key} must be binary`);
    if(number(row,'Survived')+number(row,'Death')!==1)throw new RangeError('Survived and Death disagree');
    if(number(row,'Age')<=0||number(row,'Age')>130)throw new RangeError('Age is outside the supported range');
    if(!Number.isInteger(number(row,'ECOG'))||number(row,'ECOG')<0||number(row,'ECOG')>4)throw new RangeError('Unexpected ECOG code');
    for(const key of ['Follow_up_month','PFS_month'])if(number(row,key)<=0)throw new RangeError(`${key} must be positive`);
    if(typeof row.EGFR_S!=='string'||!row.EGFR_S.trim())throw new TypeError('Mutation label is missing');
  }
  return rows;
}
export function auditPublicRows(rows,{horizon=12,drug='all'}={}){
  validatePublicRows(rows);
  if(typeof horizon!=='number'||!Number.isFinite(horizon)||horizon<=0)throw new RangeError('Positive finite horizon is required');
  if(typeof drug!=='string')throw new TypeError('Drug label is required');
  const selectedDrug=drug.toLowerCase(),known=PUBLIC_DRUGS.find(d=>d.toLowerCase()===selectedDrug);
  if(selectedDrug!=='all'&&!known)throw new RangeError('Unknown drug filter');
  const selected=rows.filter(r=>selectedDrug==='all'||r.Group_S===known);
  const count=predicate=>selected.filter(predicate).length;
  return {
    n:selected.length,horizon,drug:known||'all',
    byDrugCounts:Object.fromEntries(PUBLIC_DRUGS.map(d=>[d,count(r=>r.Group_S===d)])),
    deathWithoutProgression:count(r=>number(r,'Death')===1&&number(r,'Progression')===0),
    pfsExceedsFollowup:count(r=>number(r,'PFS_month')>number(r,'Follow_up_month')),
    mutationNegative:count(r=>r.EGFR_S.trim().toLowerCase()==='negative'),
    provisionalPfsEarlyNoProgression:count(r=>number(r,'Progression')===0&&number(r,'PFS_month')<horizon),
    provisionalOsEarlyAlive:count(r=>number(r,'Death')===0&&number(r,'Follow_up_month')<horizon),
    endpointAdmissible:false,endpointStatus:'unverified_time_status_pairing',
  };
}
export function preparePublicEndpoint(){throw new Error('Clinical endpoint is not validated: do not create a 12-month PFS outcome or clinical ATE/TMLE from these unverified time/status pairings.');}
