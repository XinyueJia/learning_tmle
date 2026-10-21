/** Switching a function argument never changes the reference law or the source data. */
export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-if-function]')){
 const input=root.querySelector('[data-if-input]');
 const update=()=>{
  for(const panel of root.querySelectorAll('[data-if-result]'))panel.hidden=panel.dataset.ifResult!==input.value;
 };
 input.addEventListener('change',update);
 root.querySelector('[data-if-reset]').addEventListener('click',()=>{input.value=root.dataset.defaultInput;update();});
 update();
 root.dataset.ifMounted='true';
}

// Preserve whole formula operands in the first Q/g comparison on narrow screens.
for(const table of scope.querySelectorAll('.qg-introduction .table-wrap'))table.classList.add('diagram-scroll');

}
