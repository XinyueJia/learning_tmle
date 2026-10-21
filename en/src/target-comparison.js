export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-target-comparison]')){
 function select(a){
  for(const panel of root.querySelectorAll('[data-tq-panel]'))panel.hidden=panel.dataset.tqPanel!==a;
  for(const button of root.querySelectorAll('[data-tq-choice]'))button.setAttribute('aria-pressed',String(button.dataset.tqChoice===a));
  root.querySelector('[data-tq-status]').textContent=`Comparing the ${a==='1'?'RHC':'no-RHC'} arm; both methods use the same initial fit.`;
  root.dataset.tqArm=a;
 }
 root.addEventListener('click',event=>{
  const a=event.target.closest('[data-tq-choice]')?.dataset.tqChoice;
  if(a!==undefined)select(a);
  if(event.target.closest('[data-tq-reset]')){
   select('1');for(const scroller of root.querySelectorAll('.diagram-scroll'))scroller.scrollLeft=0;
   for(const detail of root.querySelectorAll('details'))detail.open=false;
  }
 });select('1');root.dataset.tqMounted='true';
}

}
