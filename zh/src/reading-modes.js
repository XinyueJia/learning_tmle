/** Language selection is local to a chapter; mathematical objects stay language-neutral. */
export function mount(scope = document) {
for(const chapter of [scope,...scope.querySelectorAll('.chapter')].filter(el=>el.matches?.('.chapter'))){
 function setLanguage(language,origin){
  if(!['julia','r'].includes(language))throw Error('Unknown code language');
  chapter.dataset.codeLanguage=language;
  for(const select of chapter.querySelectorAll('[data-lesson-language],[data-trace-language]'))select.value=language;
  for(const panel of chapter.querySelectorAll('[data-lesson-panel]'))panel.hidden=panel.dataset.lessonPanel!==language;
  chapter.dispatchEvent(new CustomEvent('eif:code-language',{detail:{language,origin}}));
 }
 setLanguage('julia','initial');
 chapter.addEventListener('change',event=>{
  if(event.target.matches('[data-lesson-language],[data-trace-language]'))setLanguage(event.target.value,'code');
  else if(event.target.matches('[name^=object-mode]')&&['julia','r'].includes(event.target.value))setLanguage(event.target.value,'objects');
 });
}

}
