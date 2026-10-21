export function mount(scope = document) {
for(const root of scope.querySelectorAll('[data-ifn-visual]')){
 const select=root.querySelector('[data-ifn-select]');
 function show(){
  for(const row of root.querySelectorAll('[data-ifn-row]'))row.classList.toggle('ifn-selected',row.dataset.ifnRow===select.value);
  for(const equation of root.querySelectorAll('[data-ifn-equation]'))equation.hidden=equation.dataset.ifnEquation!==select.value;
 }
 select.addEventListener('change',show);
 root.querySelector('[data-ifn-reset]').addEventListener('click',()=>{select.selectedIndex=0;show();});
 show();root.dataset.ifnMounted='true';
}

for(const table of scope.querySelectorAll('.if-symbol-recap .table-wrap'))table.classList.add('diagram-scroll');

}
