export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-estimation-routes]')){
 const descriptions={gcomp:'g-computation先为全队列预测两种风险，再平均预测差。',ipw:'IPW以全队列为目标，为实际结局加权后取平均。',psm:`PSM：本例${root.dataset.psmComplete==='true'?'全部':'保留的'}RHC处理者目标，先配对，再平均每对的结局差。`};
 function choose(key){
  for(const panel of root.querySelectorAll('[data-route-panel]'))panel.hidden=panel.dataset.routePanel!==key;
  for(const button of root.querySelectorAll('[data-route-choice]'))button.setAttribute('aria-pressed',String(button.dataset.routeChoice===key));
  root.querySelector('[data-route-status]').textContent='正在阅读'+descriptions[key];
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
