export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-estimation-routes]')){
 const descriptions={gcomp:'g-computation predicts both risks for the full cohort, then averages prediction contrasts.',ipw:'IPW targets the full cohort by weighting observed outcomes before averaging.',psm:`PSM: target ${root.dataset.psmComplete==='true'?'all':'retained'} RHC recipients in this example; match first, then average within-pair outcome differences.`};
 function choose(key){
  for(const panel of root.querySelectorAll('[data-route-panel]'))panel.hidden=panel.dataset.routePanel!==key;
  for(const button of root.querySelectorAll('[data-route-choice]'))button.setAttribute('aria-pressed',String(button.dataset.routeChoice===key));
  root.querySelector('[data-route-status]').textContent='Reading: '+descriptions[key];
  root.dataset.selectedRoute=key;
 }
 root.addEventListener('click',event=>{
  const key=event.target.closest('[data-route-choice]')?.dataset.routeChoice;
  if(key)choose(key);
  if(event.target.closest('[data-route-reset]'))choose('gcomp');
 });
 choose('gcomp');
}

}
