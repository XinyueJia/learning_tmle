import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync('zh/src/blue-theme.css','utf8');
const colour=name=>{const result=css.match(new RegExp(`--theme-${name}:\\s*(#[a-fA-F0-9]{6})`));assert(result,name);return result[1].toLowerCase();};
const luminance=hex=>{const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
const ratio=(a,b)=>{const [lo,hi]=[luminance(a),luminance(b)].sort((x,y)=>x-y);return(hi+.05)/(lo+.05);};

test('all five published pages load the same local blue-white theme last',()=>{
 for(const page of ['index','public-data','case-study','sources','audit']){
  const html=readFileSync(`dist/zh/${page}.html`,'utf8');
  const styles=[...html.matchAll(/<link rel="stylesheet"[^>]*>/g)];
  assert.equal(styles.at(-1)[0],'<link rel="stylesheet" href="src/blue-theme.css">',page);
  assert.equal(styles.filter(m=>m[0].includes('blue-theme.css')).length,1);
 }
 assert.equal(colour('navy'),'#011451');assert.equal(colour('white'),'#ffffff');assert.equal(colour('blue'),'#005398');
});
test('theme body/navigation/link/control/focus pairs meet their declared WCAG contrast thresholds',()=>{
 const checks=[['white','navy',4.5],['rail-text','navy',4.5],['ink','white',4.5],['ink','panel',4.5],['muted','white',4.5],['muted','panel',4.5],['blue','white',4.5],['blue','panel',4.5],['navy','panel-strong',4.5],['focus','white',3],['focus-on-navy','navy',3],['control-border','white',3],['control-border','panel',3]];
 for(const [fg,bg,min]of checks)assert(ratio(colour(fg),colour(bg))>=min,`${fg}/${bg}`);
});
test('theme keeps object identity and system preferences without remote assets or CSS hiding maths',()=>{
 assert(!/@import|url\(|filter:|!important/.test(css.replace(/\/\*[\s\S]*?\*\//g,'')));
 assert(css.includes('@media print'));assert(css.includes('prefers-reduced-motion'));assert(css.includes('forced-colors'));
 assert(!/\.katex[^}]*display:\s*none/.test(css));
 for(const name of ['blue','amber','cyan','purple','orange'])assert(!new RegExp(`\\.ov-${name}\\s*\\{`).test(css),'Object palette belongs to shared identity layer');
});
