/** Predicting with fixed fitted functions: neither records nor predictions are edited. */
export function mountQgVisual(root){
 const mode=root.querySelector('[data-qg-mode]'),row=root.querySelector('[data-qg-select-row]');
 function highlight(value){for(const cell of root.querySelectorAll('[data-qg-row]'))cell.classList.toggle('qg-selected-row',cell.dataset.qgRow===String(value));}
 function update(){
  root.dataset.qgMode=mode.value;
  for(const panel of root.querySelectorAll('[data-qg-call]'))panel.hidden=panel.dataset.qgCall!==mode.value;
  for(const column of root.querySelectorAll('[data-qg-comparison]'))column.classList.toggle('qg-active-output',column.dataset.qgComparison===mode.value);
  root.querySelector('[data-qg-status]').textContent=mode.selectedOptions[0].textContent+'；W、原始A/Y、已拟合函数和三列预测均保持不变。';
  highlight(row.value);
 }
 mode.addEventListener('change',update);row.addEventListener('change',()=>highlight(row.value));
 root.querySelector('[data-qg-reset]').addEventListener('click',()=>{mode.value='q1';row.selectedIndex=0;update();for(const scroller of root.querySelectorAll('.diagram-scroll'))scroller.scrollLeft=0;});
 root.addEventListener('pointerover',event=>{const cell=event.target.closest('[data-qg-row]');if(cell)highlight(cell.dataset.qgRow);});
 root.addEventListener('pointerleave',()=>highlight(row.value));
 update();root.dataset.qgMounted='true';
}
export function mount(scope = document){for(const root of scope.querySelectorAll('[data-qg-visual]'))mountQgVisual(root);}
