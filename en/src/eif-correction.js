export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-eif-correction]')){
 const labels={initial:'EIF at the initial fitted distribution; both Q and g are initial fits.',aipw:'AIPW estimating function; keep initial Q and g and change only the final centre.',half:'Trial at ε*/2; Q changes while g and the empirical W distribution stay fixed.',tmle:'TMLE root found; use updated Q* and initial g.'};
 function select(key){
  for(const panel of root.querySelectorAll('[data-ec-panel]'))panel.hidden=panel.dataset.ecPanel!==key;
  for(const button of root.querySelectorAll('[data-ec-choice]'))button.setAttribute('aria-pressed',String(button.dataset.ecChoice===key));
  root.querySelector('[data-ec-status]').textContent='Current: '+labels[key];root.dataset.ecStage=key;
 }
 root.addEventListener('click',event=>{
  const key=event.target.closest('[data-ec-choice]')?.dataset.ecChoice;
  if(key)select(key);
  if(event.target.closest('[data-ec-reset]')){
   select('initial');for(const scroller of root.querySelectorAll('.diagram-scroll,.table-wrap'))scroller.scrollLeft=0;
   for(const details of root.querySelectorAll('details'))details.open=false;
  }
 });select('initial');root.dataset.ecMounted='true';
}

}
