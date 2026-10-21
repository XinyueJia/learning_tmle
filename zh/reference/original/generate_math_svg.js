/* Convert an array of LaTeX strings to self-contained SVG fragments via MathJax.
   No network access or browser dependency is needed at build time. */
const fs=require('fs');
const {mathjax}=require('mathjax-full/js/mathjax.js');
const {TeX}=require('mathjax-full/js/input/tex.js');
const {SVG}=require('mathjax-full/js/output/svg.js');
const {liteAdaptor}=require('mathjax-full/js/adaptors/liteAdaptor.js');
const {RegisterHTMLHandler}=require('mathjax-full/js/handlers/html.js');
const {AllPackages}=require('mathjax-full/js/input/tex/AllPackages.js');
const adaptor=liteAdaptor();RegisterHTMLHandler(adaptor);
const doc=mathjax.document('',{InputJax:new TeX({packages:AllPackages}),OutputJax:new SVG({fontCache:'local'})});
const formulas=JSON.parse(fs.readFileSync(0,'utf8'));
const out=formulas.map(tex=>{
 const svg=adaptor.outerHTML(doc.convert(tex,{display:true}));
 if(svg.includes('<merror')||svg.includes('data-mjx-error')) throw Error('Invalid LaTeX: '+tex);
 return svg;
});
process.stdout.write(JSON.stringify(out));
