export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-tmle-overview]')){
 let step=0,view='target',row='1';
 function render(){
  const effective=step>=4?'target':view;
  root.dataset.toStep=String(step);root.dataset.toView=effective;
  root.querySelectorAll('[data-to-panel]').forEach(e=>e.hidden=Number(e.dataset.toPanel)!==step);
  root.querySelectorAll('[data-to-go]').forEach(e=>{if(Number(e.dataset.toGo)===step)e.setAttribute('aria-current','step');else e.removeAttribute('aria-current');});
  root.querySelectorAll('[data-to-from]').forEach(e=>{const first=Number(e.dataset.toFrom);e.hidden=first>step;e.classList.toggle('to-new',first===step);});
  root.querySelectorAll('[data-to-only]').forEach(e=>e.hidden=!e.dataset.toOnly.split(',').map(Number).includes(step));
  root.querySelectorAll('[data-to-state]').forEach(e=>e.hidden=e.dataset.toState!==effective);
  root.querySelectorAll('[data-to-view]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.toView===effective)));
  root.querySelectorAll('[data-to-flow-row]').forEach(e=>e.hidden=e.dataset.toFlowRow!==row);
  root.querySelector('[data-to-status]').innerHTML=`第${step+1}/6步：${root.querySelector(`[data-to-label="${step}"]`).innerHTML}`;
  root.querySelector('[data-to-table-note]').innerHTML=root.querySelector(`[data-to-note="${step}"]`).innerHTML;
  root.querySelector('[data-to-previous]').disabled=step===0;root.querySelector('[data-to-next]').disabled=step===5;
  root.querySelector('[data-to-row]').value=row;
 }
 function go(next){
  step=Math.max(0,Math.min(5,next));render();
  root.querySelectorAll('.to-scroll').forEach(e=>e.scrollLeft=0);
  const heading=root.querySelector('th.to-new'),area=heading?.closest('.to-scroll');
  if(area&&step>0)area.scrollLeft=Math.max(0,heading.getBoundingClientRect().left-area.getBoundingClientRect().left-64);
 }
 root.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-to-go'))go(Number(b.dataset.toGo));
  if(b.hasAttribute('data-to-previous'))go(step-1);
  if(b.hasAttribute('data-to-next'))go(step+1);
  if(b.hasAttribute('data-to-reset')){view='target';row='1';go(0);}
  if(b.hasAttribute('data-to-view')){view=b.dataset.toView;render();}
 });
 root.querySelector('[data-to-row]').addEventListener('change',e=>{row=e.target.value;render();});
 render();root.dataset.toMounted='true';
}

}
