import {meanTransfer} from '../../shared/js/mean-transfer.js';
const f=value=>{const v=Math.abs(value)<5e-7?0:value;return(v>0?'+':'')+v.toFixed(6);};
export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-im-visual]')){
 const Y=JSON.parse(root.querySelector('[data-im-outcomes]').textContent),base=meanTransfer(Y,0),input=root.querySelector('[data-im-delta]'),slider=root.querySelector('[data-im-slider]');
 const error=root.querySelector('[data-im-error]'),status=root.querySelector('[data-im-status]');
 function update(){
  try{
   if(!input.value.trim())throw Error('Enter transfer amount δ.');
   const state=meanTransfer(Y,Number(input.value));slider.value=String(Math.round((state.delta-base.allowed[0])/(base.allowed[1]-base.allowed[0])*10000));slider.setAttribute('aria-valuetext','δ='+state.delta);
   root.dataset.imValid='true';error.hidden=true;error.removeAttribute('role');
   for(let y=0;y<=1;y++){
    root.querySelector(`[data-im-new="${y}"]`).textContent=(100*state.changedP[y]).toFixed(4)+'%';root.querySelector(`[data-im-bar="${y}"]`).style.width=100*state.changedP[y]+'%';
    root.querySelector(`[data-im-delta-p="${y}"]`).textContent=f(state.directionWeights[y]);root.querySelector(`[data-im-weights="${y}"]`).textContent=f(state.directionWeights[y]);root.querySelector(`[data-im-terms="${y}"]`).textContent=f(state.weightedTerms[y]);
   }
   root.querySelector('[data-im-new-mean]').textContent=(100*state.changedMean).toFixed(4)+'%';root.querySelector('[data-im-exact]').textContent=f(state.exactChange);root.querySelector('[data-im-paired]').textContent=f(state.pairedChange);root.querySelector('[data-im-prob-sum]').textContent=state.changedProbabilitySum.toFixed(6);
   const magnitude=Math.abs(state.delta);
   status.textContent=state.delta===0?'δ=0: neither outcome probability changes.':`Move probability ${magnitude.toFixed(6)} from ${state.delta>0?'survival':'death'} to ${state.delta>0?'death':'survival'}; both changes sum to 0 and original patient outcomes stay fixed.`;
   root.querySelector('[data-im-explanation]').textContent=state.delta===0?'With no probability change, both products and the mean change are 0.':`Survival: ${f(state.directionWeights[0])} × ${f(state.fixedInfluence[0])} = ${f(state.weightedTerms[0])}; death: ${f(state.directionWeights[1])} × ${f(state.fixedInfluence[1])} = ${f(state.weightedTerms[1])}. Their sum is ${f(state.pairedChange)}, or ${(100*state.pairedChange).toFixed(4)} percentage points.`;
  }catch{
   root.dataset.imValid='false';error.textContent=`δ must lie between ${base.allowed[0]} and ${base.allowed[1]} so both new probabilities are non-negative. The original distribution and original D stay fixed; correct the input to see the new result.`;error.hidden=false;error.setAttribute('role','alert');status.textContent='Calculation paused: adjust δ.';
   for(const element of root.querySelectorAll('[data-im-new],[data-im-delta-p],[data-im-weights],[data-im-terms],[data-im-new-mean],[data-im-exact],[data-im-paired],[data-im-prob-sum]'))element.textContent='—';
   for(const element of root.querySelectorAll('[data-im-bar]'))element.style.width='0%';root.querySelector('[data-im-explanation]').textContent='Enter a valid probability transfer to calculate.';
  }
 }
 input.addEventListener('input',update);slider.addEventListener('input',()=>{const position=Number(slider.value);const delta=position===0?base.allowed[0]:position===10000?base.allowed[1]:base.allowed[0]+(base.allowed[1]-base.allowed[0])*position/10000;input.value=String(delta);update();});
 root.addEventListener('click',event=>{const action=event.target.closest('[data-im-action]')?.dataset.imAction;if(!action)return;input.value=String({positive:.01,negative:-.01,lower:base.allowed[0],upper:base.allowed[1],reset:.01}[action]);update();if(action==='reset')for(const area of root.querySelectorAll('.diagram-scroll'))area.scrollLeft=0;});
 update();root.dataset.imMounted='true';
}

}
