import {meanTransfer} from '../../shared/js/mean-transfer.js';
const f=value=>{const v=Math.abs(value)<5e-7?0:value;return(v>0?'+':'')+v.toFixed(6);};
export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-im-visual]')){
 const Y=JSON.parse(root.querySelector('[data-im-outcomes]').textContent),base=meanTransfer(Y,0),input=root.querySelector('[data-im-delta]'),slider=root.querySelector('[data-im-slider]');
 const error=root.querySelector('[data-im-error]'),status=root.querySelector('[data-im-status]');
 function update(){
  try{
   if(!input.value.trim())throw Error('请填写转移量δ。');
   const state=meanTransfer(Y,Number(input.value));slider.value=String(Math.round((state.delta-base.allowed[0])/(base.allowed[1]-base.allowed[0])*10000));slider.setAttribute('aria-valuetext','δ='+state.delta);
   root.dataset.imValid='true';error.hidden=true;error.removeAttribute('role');
   for(let y=0;y<=1;y++){
    root.querySelector(`[data-im-new="${y}"]`).textContent=(100*state.changedP[y]).toFixed(4)+'%';root.querySelector(`[data-im-bar="${y}"]`).style.width=100*state.changedP[y]+'%';
    root.querySelector(`[data-im-delta-p="${y}"]`).textContent=f(state.directionWeights[y]);root.querySelector(`[data-im-weights="${y}"]`).textContent=f(state.directionWeights[y]);root.querySelector(`[data-im-terms="${y}"]`).textContent=f(state.weightedTerms[y]);
   }
   root.querySelector('[data-im-new-mean]').textContent=(100*state.changedMean).toFixed(4)+'%';root.querySelector('[data-im-exact]').textContent=f(state.exactChange);root.querySelector('[data-im-paired]').textContent=f(state.pairedChange);root.querySelector('[data-im-prob-sum]').textContent=state.changedProbabilitySum.toFixed(6);
   const magnitude=Math.abs(state.delta);
   status.textContent=state.delta===0?'δ=0：两类概率都不改变。':`从${state.delta>0?'存活':'死亡'}类取走${magnitude.toFixed(6)}概率，加到${state.delta>0?'死亡':'存活'}类；两类改变量的和为0，原患者结局不变。`;
   root.querySelector('[data-im-explanation]').textContent=state.delta===0?'没有概率变化，两项乘积都为0，均值变化也为0。':`存活类：${f(state.directionWeights[0])} × ${f(state.fixedInfluence[0])} = ${f(state.weightedTerms[0])}；死亡类：${f(state.directionWeights[1])} × ${f(state.fixedInfluence[1])} = ${f(state.weightedTerms[1])}。两项相加 ${f(state.pairedChange)}，即 ${(100*state.pairedChange).toFixed(4)} 个百分点。`;
  }catch{
   root.dataset.imValid='false';error.textContent=`δ必须在${base.allowed[0]}到${base.allowed[1]}之间，使两类新概率都非负。原分布与旧D保持不变；请修正输入后查看新结果。`;error.hidden=false;error.setAttribute('role','alert');status.textContent='暂停试算：请调整δ。';
   for(const element of root.querySelectorAll('[data-im-new],[data-im-delta-p],[data-im-weights],[data-im-terms],[data-im-new-mean],[data-im-exact],[data-im-paired],[data-im-prob-sum]'))element.textContent='—';
   for(const element of root.querySelectorAll('[data-im-bar]'))element.style.width='0%';root.querySelector('[data-im-explanation]').textContent='输入合法的概率转移量后再计算。';
  }
 }
 input.addEventListener('input',update);slider.addEventListener('input',()=>{const position=Number(slider.value);const delta=position===0?base.allowed[0]:position===10000?base.allowed[1]:base.allowed[0]+(base.allowed[1]-base.allowed[0])*position/10000;input.value=String(delta);update();});
 root.addEventListener('click',event=>{const action=event.target.closest('[data-im-action]')?.dataset.imAction;if(!action)return;input.value=String({positive:.01,negative:-.01,lower:base.allowed[0],upper:base.allowed[1],reset:.01}[action]);update();if(action==='reset')for(const area of root.querySelectorAll('.diagram-scroll'))area.scrollLeft=0;});
 update();root.dataset.imMounted='true';
}

}
