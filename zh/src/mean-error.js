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
  if(key==='population'){status.textContent='真实μ₀未知，逐人输出和估计误差先用含μ₀的式子表示。';return;}
  if(key==='empirical'){status.textContent='现在显示只截距OLS残差（也是本例的估计IF值）；每人减去样本均值，所以平均为0。';return;}
  const value=reference.value.trim();
  if(value===''||!Number.isFinite(Number(value))||Number(value)<0||Number(value)>1){
   error.textContent='请输入0到1之间的假设概率m。调整到有效范围后继续试算。';error.hidden=false;error.setAttribute('role','alert');root.dataset.ieValid='false';
   for(const el of root.querySelectorAll('[data-ie-assumed-value],[data-ie-distance],[data-ie-distance-copy],[data-ie-distance-pp],[data-ie-reference-value]'))el.textContent='—';
   status.textContent='假设概率m超出范围，暂停试算。';return;
  }
  const state=meanErrorData(outcomes,Number(value));
  for(const element of root.querySelectorAll('[data-ie-assumed-value]'))element.textContent=f(state.referenceCentred.values[Number(element.dataset.ieAssumedValue)]);
  for(const element of root.querySelectorAll('[data-ie-distance],[data-ie-distance-copy]'))element.textContent=f(state.distance);
  root.querySelector('[data-ie-distance-pp]').textContent=(100*state.distance).toFixed(4);
  root.querySelector('[data-ie-reference-value]').textContent=Number(value).toFixed(6);
  status.textContent='当前显示样本均值与指定m的距离；真实总体均值μ₀仍以符号表示。';
 }
 mode.addEventListener('change',update);reference.addEventListener('input',update);
 root.querySelector('[data-ie-reset]').addEventListener('click',()=>{mode.value='population';reference.value='0.3';update();for(const scroll of root.querySelectorAll('.diagram-scroll'))scroll.scrollLeft=0;});
 update();root.dataset.ieMounted='true';
}

}
