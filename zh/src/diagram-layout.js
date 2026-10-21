/** Layout only: no data, estimates or mathematical operands are changed here. */
const ownedBy=(element,expression)=>element.closest('.ov-expression')===expression;
const rect=element=>element.getBoundingClientRect();
function alignExpression(expression){
 const objects=[...expression.querySelectorAll('.ov-object')].filter(e=>ownedBy(e,expression));
 const vectors=objects.filter(e=>['patient','outcome'].includes(e.dataset.alignment));
 for(const element of [...objects,...expression.querySelectorAll('.ov-syntax,.ov-arrow')])element.style.marginTop='';
 if(!vectors.length){expression.dataset.vectorLayout='false';return;}
 expression.dataset.vectorLayout='true';
 // Each observation/support row remains a row, even when the matrix is inside a concat frame.
 for(const alignment of ['patient','outcome']){
  const group=vectors.filter(e=>e.dataset.alignment===alignment);
  const entries=group.map(object=>({object,rows:[...object.querySelectorAll(alignment==='patient'?'[data-record]':'[data-outcome]')]})).filter(e=>e.rows.length);
  if(!entries.length)continue;
  const maxTop=Math.max(...entries.map(e=>rect(e.rows[0]).top));
  for(const {object,rows}of entries)object.style.marginTop=`${Math.max(0,maxTop-rect(rows[0]).top)}px`;
 }
 const rows=vectors.flatMap(object=>[...object.querySelectorAll(object.dataset.alignment==='patient'?'[data-record]':'[data-outcome]')]);
 if(!rows.length)return;
 const centre=(Math.min(...rows.map(e=>rect(e).top))+Math.max(...rows.map(e=>rect(e).bottom)))/2;
 for(const element of [...expression.querySelectorAll('.ov-syntax,.ov-arrow'),...objects.filter(e=>e.classList.contains('ov-scalar'))]){
  if(!ownedBy(element,expression))continue;
  const anchor=element.classList.contains('ov-scalar')?element.querySelector(':scope > strong'):element;
  const y=(rect(anchor).top+rect(anchor).bottom)/2;
  element.style.marginTop=`${Math.max(0,centre-y)}px`;
 }
 expression.dataset.rowsAligned='true';
}
export function layoutDiagrams(root=document){
 for(const scroller of root.querySelectorAll('.ov-expression-scroll,.diagram-scroll')){
  if(!scroller.getClientRects().length||scroller.clientWidth===0)continue;
  const expression=scroller.querySelector(':scope > .ov-expression');if(expression)alignExpression(expression);
  scroller.dataset.scrollReady='true';
 }
}
if(typeof document!=='undefined'){
 let pending=false;
 const schedule=()=>{if(pending)return;pending=true;requestAnimationFrame(()=>{pending=false;layoutDiagrams();});};
 const observer=new MutationObserver(records=>{if(records.some(r=>r.type==='childList'||r.attributeName==='hidden'))schedule();});
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
 new ResizeObserver(schedule).observe(document.querySelector('main')||document.body);
 document.addEventListener('toggle',schedule,true);window.addEventListener('resize',schedule);document.fonts?.ready.then(schedule);schedule();
}
