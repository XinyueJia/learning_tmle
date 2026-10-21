import {meanErrorData} from '../../shared/js/mean-error.js';
export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-ie-visual]')){
 const outcomes=JSON.parse(root.querySelector('[data-ie-outcomes]').textContent),mode=root.querySelector('[data-ie-mode]'),reference=root.querySelector('[data-ie-reference]');
 const status=root.querySelector('[data-ie-status]'),error=root.querySelector('[data-ie-error]');
 const f=value=>{const rounded=Math.abs(value)<5e-7?0:value;return(rounded>0?'+':'')+rounded.toFixed(6);};
 function update(){
  const key=mode.value;
  root.querySelector('[data-ie-assumption]').hidden=key!=='assumed';
  for(const element of root.querySelectorAll('[data-ie-only]'))element.hidden=element.dataset.ieOnly!==key;
  error.hidden=true;error.removeAttribute('role');root.dataset.ieMode=key;root.dataset.ieValid='true';
  if(key==='population'){status.textContent='True μ₀ is unknown; patient-level outputs and estimation error are expressed symbolically using μ₀.';return;}
  if(key==='empirical'){status.textContent='Showing intercept-only OLS residuals (also the estimated IF values here); the sample mean is subtracted from each patient’s outcome, so the average is 0.';return;}
  const value=reference.value.trim();
  if(value===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1){
   error.textContent='Enter an assumed probability m between 0 and 1. Adjust to the valid range to continue.';error.hidden=false;error.setAttribute('role','alert');root.dataset.ieValid='false';
   for(const el of root.querySelectorAll('[data-ie-assumed-value],[data-ie-distance],[data-ie-distance-copy],[data-ie-distance-pp],[data-ie-reference-value]'))el.textContent='—';
   status.textContent='Assumed probability m is outside the valid range; calculation paused.';return;
  }
  const state=meanErrorData(outcomes,Number(value));
  for(const element of root.querySelectorAll('[data-ie-assumed-value]'))element.textContent=f(state.referenceCentred.values[Number(element.dataset.ieAssumedValue)]);
  for(const element of root.querySelectorAll('[data-ie-distance],[data-ie-distance-copy]'))element.textContent=f(state.distance);
  root.querySelector('[data-ie-distance-pp]').textContent=(100*state.distance).toFixed(4);
  root.querySelector('[data-ie-reference-value]').textContent=Number(value).toFixed(6);
  status.textContent='Showing the distance between the sample mean and specified m; true population mean μ₀ remains symbolic.';
 }
 mode.addEventListener('change',update);reference.addEventListener('input',update);
 root.querySelector('[data-ie-reset]').addEventListener('click',()=>{mode.value='population';reference.value='0.3';update();for(const scroll of root.querySelectorAll('.diagram-scroll'))scroll.scrollLeft=0;});
 update();root.dataset.ieMounted='true';
}

}
