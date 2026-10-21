import {getRhcData} from '../../shared/js/rhc-browser-data.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {renderObjectStage} from './object-grammar.js';
export async function mount(scope = document){
const chapters=[scope,...scope.querySelectorAll('.chapter')].filter(el=>el.matches?.('.chapter')).filter(ch=>ch.querySelector('[data-object-stage]'));
if(chapters.length){
 try{
  const {rows,fit}=await getRhcData();
  for(const chapter of chapters){
   const toolbar=chapter.querySelector('[data-object-toolbar]');if(!toolbar)throw Error('对象图缺少阅读控制');
   const mathematicalOnly=toolbar.dataset.objectToolbar==='0';
   const state={mode:'math',start:0,selected:1,scenario:'one',t:.1,z:1};
   const select=toolbar.querySelector('[data-object-selected]'),status=toolbar.querySelector('.ov-status');
   const figures=[...chapter.querySelectorAll('[data-object-stage]')];
   function highlight(row){for(const cell of chapter.querySelectorAll('[data-record]'))cell.classList.toggle('ov-row-selected',Number(cell.dataset.record)===row);}
   function render(){
    if(mathematicalOnly)state.mode='math';
    const data=objectLessonData(rows,fit,{start:state.start,count:6});
    for(const figure of figures){figure.querySelector('.ov-canvas').innerHTML=renderObjectStage(figure.dataset.objectStage,data,state);figure.dataset.objectMode=state.mode;for(const window of figure.querySelectorAll('[data-object-window]'))window.textContent=`${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}`;}
    select.innerHTML=data.rowNumbers.map(i=>`<option value="${i}" ${i===state.selected?'selected':''}>原始行 i=${i}</option>`).join('');
    status.textContent=`显示原始第${data.rowNumbers[0]}—${data.rowNumbers.at(-1)}行；所有拟合和平均仍用全部${data.n}行。核对行i=${state.selected}。`;
    toolbar.querySelector('[data-object-action=previous]').disabled=state.start===0;
    toolbar.querySelector('[data-object-action=next]').disabled=state.start+6>=rows.length;
    for(const radio of toolbar.querySelectorAll('[name^=object-mode]'))radio.checked=radio.value===state.mode;
    for(const field of chapter.querySelectorAll('[data-object-scenario]'))field.value=state.scenario;
    for(const field of toolbar.querySelectorAll('[data-object-z]'))field.value=String(state.z);
    for(const field of toolbar.querySelectorAll('[data-object-t]'))field.value=String(state.t);
    const output=toolbar.querySelector('[data-object-t-value]');if(output)output.textContent=`${state.t.toFixed(2)}（${Math.round(state.t*100)}%）`;
    highlight(state.selected);chapter.dataset.objectsMounted='true';
   }
   chapter.addEventListener('change',event=>{
    if(event.target.matches('[name^=object-mode]')){state.mode=event.target.value;render();}
    if(event.target.matches('[data-object-selected]')){state.selected=Number(event.target.value);highlight(state.selected);status.textContent=`正在核对原始行i=${state.selected}；所有同一i的对象同步标出。计算仍使用全部${rows.length}行。`;}
    if(event.target.matches('[data-object-z]')){state.z=Number(event.target.value);render();}
    if(event.target.matches('[data-object-scenario]')){state.scenario=event.target.value;render();}
   });
   chapter.addEventListener('eif:code-language',event=>{if(!mathematicalOnly&&event.detail.origin==='code'){state.mode=event.detail.language;render();}});
   chapter.addEventListener('input',event=>{if(event.target.matches('[data-object-t]')){state.t=Number(event.target.value);render();}});
   chapter.addEventListener('click',event=>{
    const action=event.target.closest('[data-object-action]')?.dataset.objectAction;if(!action)return;
    if(action==='previous')state.start=Math.max(0,state.start-6);
    if(action==='next')state.start=Math.min(rows.length-1,state.start+6);
    if(action==='reset')Object.assign(state,{mode:'math',start:0,selected:1,scenario:'one',t:.1,z:1});
    state.selected=state.start+1;render();
   });
   chapter.addEventListener('pointerover',event=>{const cell=event.target.closest('[data-record]');if(cell)highlight(Number(cell.dataset.record));});
   chapter.addEventListener('pointerleave',()=>highlight(state.selected));
   render();
  }
 }catch(error){for(const chapter of chapters){const status=chapter.querySelector('.ov-status');if(status){status.textContent=`对象实验未能初始化：${error.message}。保留构建时的原始数据图，不使用替代数据。`;status.setAttribute('role','alert');}}}
}

}
