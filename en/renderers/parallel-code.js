import {readFile} from 'node:fs/promises';
export const languageControl=()=>'<div class="lesson-language-control"><label>Code language in this chapter <select data-lesson-language><option value="julia">Julia operations</option><option value="r">R operations</option></select></label><span>Use the same RHC data and the same mathematical objectives</span></div>';
const panels=(julia,r)=>`${languageControl()}\n\n<div class="lesson-code-panel" data-lesson-panel="julia">\n\n${julia}\n\n</div>\n\n<div class="lesson-code-panel" data-lesson-panel="r" hidden>\n\n${r}\n\n</div>\n\n`;
/** Keep authored Julia explanations intact alongside source-validated R workbooks. */
export async function parallelChapterCode(md,n){
 const id=String(n).padStart(2,'0'),r=`{{r-code:ch${id}}}`;
 if(n===0){
  const script=await readFile('en/julia/object_ch00.jl','utf8');
  const julia='[Download initial model workbook](julia/object_ch00.jl)\n\n```sh\njulia --startup-file=no --history-file=no en/julia/object_ch00.jl\n```\n\n```julia\n'+script.trim()+'\n```';
  // A learner-facing heading may change during editing; use the stable chapter mount.
  const marker='<div class="case-workbench" data-case-study="0"></div>';
  if(!md.includes(marker))throw Error('Missing parallel code slot ch00');
  return md.replace(marker,'## Use code to calculate initial predictions from raw records\n\n'+panels(julia,r)+marker);
 }
 const marker=`<div class="rhc-julia" data-rhc-julia="${id}"></div>`,at=md.indexOf(marker);
 if(at<0)throw Error(`Missing parallel code slot ch${id}`);
 const heads=[...md.slice(0,at).matchAll(/^## .*Julia[^\n]*\n/gm)],heading=heads.at(-1);
 if(!heading)return md.replace(marker,'## Code workbook: input, operation and output\n\n'+panels(marker,r));
 const start=heading.index,after=md.slice(start+heading[0].length),next=after.search(/^## /m);
 let end=next<0?md.length:start+heading[0].length+next;
 const workbench=md.indexOf('<div class="case-workbench"',at);
 if(workbench>=0&&workbench<end)end=workbench;
 const julia=md.slice(start+heading[0].length,end),title=heading[0].replace('Julia','code');
 return md.slice(0,start)+title+'\n'+panels(julia,r)+md.slice(end);
}
