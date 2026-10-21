import {objectFigure} from '../src/object-grammar.js';
export function renderObjectVisuals(html,chapter,data){
 return html.replace(/<div class="object-placeholder" data-object-stage="([a-z-]+)"><\/div>/g,(_,stage)=>objectFigure(stage,data,{chapter,toolbar:stage==='source'}));
}
