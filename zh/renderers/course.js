import {SITE_NAME, SITE_TITLES} from '../../shared/js/site-config.js';
import {renderRhcPatientSummary} from './rhc-patient-summary.js';
import {renderTmleOverview} from './tmle-overview.js';
import {renderDrIntro} from './dr-intro.js';
import {renderOlsError} from './ols-error.js';
import {renderGlmScore} from './glm-score.js';
import {renderEifCorrection} from './eif-correction.js';
import {renderEstimationRoutes} from './estimation-routes.js';
import {renderPropensityBridge} from './propensity-bridge.js';
import {parallelChapterCode} from './parallel-code.js';
import {expandRLessons} from './r-code.js';
import {renderIfMotivation} from './if-motivation.js';
import {renderMeanError} from './mean-error.js';
import {renderIfNotation} from './if-notation.js';
import {renderQgVisual} from './qg-visual.js';
import {renderIfFunction} from './if-function.js';
import {traceMathTemplates} from './tmle-trace-maths.js';
import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises';
import { renderMarkdown } from '../../scripts/markdown.js';
import { renderChapter1Visuals } from './chapter1-visuals.js';
import {expandRhcLessons} from './rhc-code.js';
import {renderObjectVisuals} from './object-visuals.js';
import {objectLessonData} from '../../shared/js/object-data.js';
import {readRhc,rhcCounts,prepareRhc} from '../../shared/js/rhc.js';
import {RHC_COUNTS} from '../../shared/js/rhc-config.js';
import {createHash} from 'node:crypto';
import {RHC_SOURCE_SHA256} from '../../shared/js/rhc-config.js';
import { expandJuliaLessons } from './case-code.js';
import { expandChapter1Walkthrough } from './julia-walkthrough.js';
import {parsePublicCsv,auditPublicRows} from '../../shared/js/public-rws.js';
import { countsCsv, recordsCsv } from '../../shared/js/case-study.js';
const renderChapter0=(html,data,rows,fit)=>renderEifCorrection(renderEstimationRoutes(renderPropensityBridge([renderOlsError,renderIfFunction,renderMeanError,renderIfNotation,renderQgVisual,renderIfMotivation].reduce((page,render)=>render(page,data),html),rows),rows,fit),fit);
export async function buildChineseEdition() {
await mkdir('dist/zh', { recursive: true });
const rawRhc=await readFile('shared/data/public/rhc/source.csv');
if(createHash('sha256').update(rawRhc).digest('hex')!==RHC_SOURCE_SHA256||JSON.stringify(rhcCounts(readRhc(rawRhc.toString())))!==JSON.stringify(RHC_COUNTS))throw Error('RHC source/config mismatch');
const parsedRhc=readRhc(rawRhc.toString());
const rhcFit=prepareRhc(parsedRhc);
const objectData=objectLessonData(parsedRhc,rhcFit);
const publicNotice=`<p class="public-data-notice">案例数据：SUPPORT/RHC队列，共5735人，记录首24小时内是否接受RHC及30日死亡状态。<a href="public-data.html">患者摘要与数据来源 ↗</a></p>`;
const files = (await readdir('zh/src/chapters')).filter(f => /^ch\d\d\.md$/.test(f)).sort();
if (!files.length) throw Error('没有可交付章节');
const chapters = [];
for (const f of files) {
  const n = Number(f.slice(2, 4));
  const raw = await readFile(`zh/src/chapters/${f}`, 'utf8');
  const md = n===0 ? raw : await expandRLessons(await expandRhcLessons(await parallelChapterCode(raw,n)));
  const title = md.match(/^# (.+)/m)?.[1];
  if (!title || (n===0 ? !md.includes('class="dr-intro-models"') : !md.includes(`data-lab="${n}"`))) throw Error(`${f} 缺正文标题或实验`);
  const html = renderGlmScore(renderMarkdown(md).replace(/<pre>/g, '<pre tabindex="0" aria-label="代码，可横向滚动">'), objectData);
  chapters.push({ n, title, md, html: n === 1 ? renderChapter1Visuals(html,objectData) : renderObjectVisuals(n===8?html.replace('<div class="rhc-full" data-rhc-full></div>',`<div class="rhc-full" data-rhc-full>${traceMathTemplates()}</div>`):n===0?renderDrIntro(html,rhcFit):html,n,objectData) });
}
const overviewSource=await readFile('zh/src/tmle-overview.md','utf8');
await writeFile('dist/zh/EIF_Tutorial.md', '# '+SITE_TITLES.zh+'\n\n中文交互课程的可编辑讲义。公式保留 TeX 源，Julia与R代码来自实际可执行源码；静态配图和实验见 index.html。\n\n' + chapters.map(c=>c.n===0?c.md.replace('<div class="tmle-overview-placeholder"></div>',overviewSource):c.md).join('\n\n---\n\n'));
const introChapter=chapters.find(c=>c.n===0);
if(introChapter)introChapter.html=introChapter.html.replace('<div class="tmle-overview-placeholder"></div>',renderTmleOverview(overviewSource,rhcFit));
const firstChapter = chapters[0].n;
const mainChapterCount = chapters.filter(c => c.n > 0).length;
const nav = chapters.map(c => `<a href="#chapter-${c.n}" data-chapter="${c.n}"><span>${String(c.n).padStart(2,'0')}</span>${c.title.replace(/^第.*?章[：· —]+/, '')}</a>`).join('');

await mkdir('dist/zh/chapters', {recursive:true});
const chapterArticles = chapters.map((c, i) => `<article id="chapter-${c.n}" data-number="${c.n}" class="chapter" hidden><div class="chapter-meta">${c.n === 0 ? '概念导读 · 第0章' : `CHAPTER ${String(c.n).padStart(2,'0')} / ${String(mainChapterCount).padStart(2,'0')}`}</div>${c.html}<footer><button class="mark-read" type="button">标记为已学</button>${chapters[i+1] ? `<a class="next" href="#chapter-${chapters[i+1].n}">进入第${chapters[i+1].n}章 →</a>` : ''}</footer></article>`);
for(let i=0;i<chapters.length;i++)await writeFile(`dist/zh/chapters/chapter-${chapters[i].n}.html`,chapterArticles[i]);
const coursePage = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="从改变概率到效率界：逐步构建并验证 efficient influence function 的交互课程。"><title>${SITE_TITLES.zh}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"><link rel="stylesheet" href="src/object-visuals.css"><link rel="stylesheet" href="src/tmle-trace.css"><link rel="stylesheet" href="src/if-function.css"><link rel="stylesheet" href="src/qg-visual.css"><link rel="stylesheet" href="src/propensity-bridge.css"><link rel="stylesheet" href="src/estimation-routes.css"><link rel="stylesheet" href="src/eif-correction.css"><link rel="stylesheet" href="src/target-comparison.css"><link rel="stylesheet" href="src/if-notation.css"><link rel="stylesheet" href="src/mean-error.css"><link rel="stylesheet" href="src/ols-error.css"><link rel="stylesheet" href="src/glm-score.css"><link rel="stylesheet" href="src/if-motivation.css"><link rel="stylesheet" href="src/parallel-code.css"><link rel="stylesheet" href="src/dr-intro.css"><link rel="stylesheet" href="src/tmle-overview.css"></head><body><a class="skip" href="#main">跳到正文</a><div class="shell"><aside><a class="brand" href="#chapter-${firstChapter}">Learning TMLE<span>学习笔记</span></a><nav aria-label="章节导航">${nav}</nav><div class="rail-bottom"><p id="reading-status" aria-live="polite"></p><a href="sources.html">参考文献与延伸阅读 ↗</a><br><a href="EIF_Tutorial.md" download>下载可编辑讲义 ↓</a><br><a href="../shared/data/rhc-counts.csv" download>案例计数 CSV ↓</a><br><a href="../shared/julia/EIFCase.jl" download>Julia计算模块 ↓</a><br><a href="../shared/R/RHCCase.R" download>R计算模块 ↓</a><br><a href="case-study.html">案例与代码运行说明 ↗</a><br><a href="public-data.html">患者资料与数据来源 ↗</a></div></aside><main id="main" tabindex="-1"><header class="course-intro"><span class="eyebrow">自学笔记</span><p>${SITE_TITLES.zh}</p><small>以SUPPORT/RHC队列的30日死亡风险为例，推导EIF并计算AIPW与TMLE。</small>${publicNotice}</header><p id="chapter-loading" role="status" hidden></p>${chapters.map(c => `<article id="chapter-${c.n}" data-number="${c.n}" data-chapter-url="chapters/chapter-${c.n}.html" class="chapter" hidden></article>`).join('')}<p class="page-foot"><a href="sources.html">文献与数据来源</a></p></main></div><script type="module" src="src/app.js"></script></body></html>`;
await writeFile('dist/zh/index.html',coursePage);
const deepSource=await readFile('zh/src/supplements/ch00-details.md','utf8');
const deepMd=await expandRLessons(await expandRhcLessons(await parallelChapterCode(deepSource,0)));
const deepHtml=renderObjectVisuals(renderChapter0(renderGlmScore(renderMarkdown(deepMd).replace(/<pre>/g, '<pre tabindex="0" aria-label="代码，可横向滚动">'),objectData),objectData,parsedRhc,rhcFit),0,objectData);
const deepNotice='<p class="dr-supplement-back">第0章补充阅读 · <a href="index.html#chapter-0">返回精简导读</a>。按需查看具体推导、实验和代码。</p>';
await writeFile('dist/zh/chapter-0-details.html',coursePage.replace(/<article id="chapter-0"[^>]*><\/article>/,()=>chapterArticles[chapters.findIndex(c=>c.n===0)].replace(introChapter.html,()=>deepNotice+deepHtml)));
await cp('zh/src', 'dist/zh/src', { recursive: true });
await cp('zh/julia', 'dist/zh/julia', { recursive: true });
await cp('zh/R', 'dist/zh/R', {recursive:true});
const publicMd=await readFile('zh/src/public-data.md','utf8');
await writeFile('dist/zh/public-data.html',`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RHC患者资料与数据来源 · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"></head><body><main class="public-data-page"><a href="index.html#chapter-0">← 返回课程</a>${renderMarkdown(publicMd).replace('<div class="rhc-patient-summary-placeholder"></div>',()=>renderRhcPatientSummary(parsedRhc))}</main><script type="module" src="src/rhc-public-page.js"></script><script type="module" src="src/recall-popovers.js"></script></body></html>`);
const caseReadme = await readFile('zh/case-study/README.md', 'utf8');
await writeFile('dist/zh/case-study.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RHC案例与分析代码 · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← 返回课程</a>${renderMarkdown(caseReadme)}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
for (const [file, csv] of [['rhc-counts.csv', countsCsv()], ['rhc-records.csv', recordsCsv()]]) {
 await writeFile(`shared/data/${file}`,csv);
 await writeFile(`dist/shared/data/${file}`,csv);
 if (await readFile(`shared/data/${file}`, 'utf8') !== csv) throw Error(`Shared case data differ: ${file}`);
}
const sources = await readFile('zh/src/sources.md','utf8');
await writeFile('dist/zh/sources.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>文献 · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← 返回课程</a>${renderMarkdown(sources).replaceAll('href="AUDIT.md"', 'href="audit.html"')}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
console.log(`Built ${chapters.length} authored chapters; local MathML and fonts included.`);

// Keep legacy bookmarks useful without publishing author audit notes.
await writeFile('dist/zh/audit.html', `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>参考文献 · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"></head><body><main class="sources"><a href="sources.html">参考文献与延伸阅读</a></main><script>location.replace('sources.html'+location.search+location.hash);</script></body></html>`);
// The same blue/white design is applied last on every published Chinese page.
for(const file of ['index.html','chapter-0-details.html','sources.html','case-study.html','public-data.html','audit.html']){
 let page;try{page=await readFile(`dist/zh/${file}`,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
 const styles=[...page.matchAll(/<link rel="stylesheet"[^>]*>/g)],last=styles.at(-1);
 if(!last)throw Error(`Missing stylesheet insertion point: ${file}`);
 const at=last.index+last[0].length;
 page=page.slice(0,at)+'<link rel="stylesheet" href="src/reading-layout.css"><link rel="stylesheet" href="src/blue-theme.css">'+page.slice(at);
 await writeFile(`dist/zh/${file}`,page);
}


}
