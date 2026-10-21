export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-eif-correction]')){
 const labels={initial:'初始拟合分布处的EIF；Q和g均为初始拟合。',aipw:'AIPW估计函数；保持初始Q和g，只改变最终中心。',half:'ε*/2处的试算；Q已改变，g和经验W分布固定。',tmle:'TMLE求根完成；使用更新Q*与初始g。'};
 function select(key){
  for(const panel of root.querySelectorAll('[data-ec-panel]'))panel.hidden=panel.dataset.ecPanel!==key;
  for(const button of root.querySelectorAll('[data-ec-choice]'))button.setAttribute('aria-pressed',String(button.dataset.ecChoice===key));
  root.querySelector('[data-ec-status]').textContent='当前：'+labels[key];root.dataset.ecStage=key;
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
