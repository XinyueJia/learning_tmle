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
import { renderMarkdown } from '../markdown.js';
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
export async function buildEnglishEdition() {
await mkdir('dist/en', { recursive: true });
const rawRhc=await readFile('shared/data/public/rhc/source.csv');
if(createHash('sha256').update(rawRhc).digest('hex')!==RHC_SOURCE_SHA256||JSON.stringify(rhcCounts(readRhc(rawRhc.toString())))!==JSON.stringify(RHC_COUNTS))throw Error('RHC source/config mismatch');
const parsedRhc=readRhc(rawRhc.toString());
const rhcFit=prepareRhc(parsedRhc);
const objectData=objectLessonData(parsedRhc,rhcFit);
const publicNotice=`<p class="public-data-notice">Data: 5,735 critically ill patients in the SUPPORT/RHC cohort, with RHC status during the first 24 hours and mortality within 30 days. <a href="public-data.html">Patient summary and data sources ↗</a></p>`;
const files = (await readdir('en/src/chapters')).filter(f => /^ch\d\d\.md$/.test(f)).sort();
if (!files.length) throw Error('No authored chapters found');
const chapters = [];
for (const f of files) {
  const n = Number(f.slice(2, 4));
  const raw = await readFile(`en/src/chapters/${f}`, 'utf8');
  const md = n===0 ? raw : await expandRLessons(await expandRhcLessons(await parallelChapterCode(raw,n)));
  const title = md.match(/^# (.+)/m)?.[1];
  if (!title || (n===0 ? !md.includes('class="dr-intro-models"') : !md.includes(`data-lab="${n}"`))) throw Error(`${f} is missing its heading or experiment`);
  const html = renderGlmScore(renderMarkdown(md).replace(/<pre>/g, '<pre tabindex="0" aria-label="Code; scroll horizontally">'), objectData);
  chapters.push({ n, title, md, html: n === 1 ? renderChapter1Visuals(html,objectData) : renderObjectVisuals(n===8?html.replace('<div class="rhc-full" data-rhc-full></div>',`<div class="rhc-full" data-rhc-full>${traceMathTemplates()}</div>`):n===0?renderDrIntro(html,rhcFit):html,n,objectData) });
}
const overviewSource=await readFile('en/src/tmle-overview.md','utf8');
await writeFile('dist/en/EIF_Tutorial.md', '# '+SITE_TITLES.en+'\n\nEditable English course notes. Formulae retain their TeX source; Julia and R code is read from executable files. See index.html for computed illustrations and experiments.\n\n' + chapters.map(c=>c.n===0?c.md.replace('<div class="tmle-overview-placeholder"></div>',overviewSource):c.md).join('\n\n---\n\n'));
const introChapter=chapters.find(c=>c.n===0);
if(introChapter)introChapter.html=introChapter.html.replace('<div class="tmle-overview-placeholder"></div>',renderTmleOverview(overviewSource,rhcFit));
const firstChapter = chapters[0].n;
const mainChapterCount = chapters.filter(c => c.n > 0).length;
const nav = chapters.map(c => `<a href="#chapter-${c.n}" data-chapter="${c.n}"><span>${String(c.n).padStart(2,'0')}</span>${c.title.replace(/^Chapter \d+:\s*/, '')}</a>`).join('');

await mkdir('dist/en/chapters', {recursive:true});
const chapterArticles = chapters.map((c, i) => `<article id="chapter-${c.n}" data-number="${c.n}" class="chapter" hidden><div class="chapter-meta">${c.n === 0 ? 'Introduction · Chapter 0' : `CHAPTER ${String(c.n).padStart(2,'0')} / ${String(mainChapterCount).padStart(2,'0')}`}</div>${c.html}<footer><button class="mark-read" type="button">Mark as read</button>${chapters[i+1] ? `<a class="next" href="#chapter-${chapters[i+1].n}">Go to Chapter ${chapters[i+1].n} →</a>` : ''}</footer></article>`);
for(let i=0;i<chapters.length;i++)await writeFile(`dist/en/chapters/chapter-${chapters[i].n}.html`,chapterArticles[i]);
const coursePage = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="Construct and verify the efficient influence function, from changing probabilities to efficiency bounds."><title>${SITE_TITLES.en}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"><link rel="stylesheet" href="src/object-visuals.css"><link rel="stylesheet" href="src/tmle-trace.css"><link rel="stylesheet" href="src/if-function.css"><link rel="stylesheet" href="src/qg-visual.css"><link rel="stylesheet" href="src/propensity-bridge.css"><link rel="stylesheet" href="src/estimation-routes.css"><link rel="stylesheet" href="src/eif-correction.css"><link rel="stylesheet" href="src/target-comparison.css"><link rel="stylesheet" href="src/if-notation.css"><link rel="stylesheet" href="src/mean-error.css"><link rel="stylesheet" href="src/ols-error.css"><link rel="stylesheet" href="src/glm-score.css"><link rel="stylesheet" href="src/if-motivation.css"><link rel="stylesheet" href="src/parallel-code.css"><link rel="stylesheet" href="src/dr-intro.css"><link rel="stylesheet" href="src/tmle-overview.css"></head><body><a class="skip" href="#main">Skip to content</a><div class="shell"><aside><a class="brand" href="#chapter-${firstChapter}">Learning TMLE<span>Study notes</span></a><nav aria-label="Chapter navigation">${nav}</nav><div class="rail-bottom"><p id="reading-status" aria-live="polite"></p><a href="sources.html">References and further reading ↗</a><br><a href="EIF_Tutorial.md" download>Course notes (Markdown) ↓</a><br><a href="../shared/data/rhc-counts.csv" download>Cohort counts (CSV) ↓</a><br><a href="../shared/julia/EIFCase.jl" download>Julia computation module ↓</a><br><a href="../shared/R/RHCCase.R" download>R computation module ↓</a><br><a href="case-study.html">Study and analysis settings ↗</a><br><a href="public-data.html">Patient summary and sources ↗</a></div></aside><main id="main" tabindex="-1"><header class="course-intro"><span class="eyebrow">SELF-STUDY NOTES</span><p>${SITE_TITLES.en}</p><small>Derive the EIF and compute AIPW and TMLE estimates using 30-day mortality in the SUPPORT/RHC cohort.</small>${publicNotice}</header><p id="chapter-loading" role="status" hidden></p>${chapters.map(c => `<article id="chapter-${c.n}" data-number="${c.n}" data-chapter-url="chapters/chapter-${c.n}.html" class="chapter" hidden></article>`).join('')}<p class="page-foot"><a href="sources.html">References and data sources</a></p></main></div><script type="module" src="src/app.js"></script></body></html>`;
await writeFile('dist/en/index.html',coursePage);
await cp('en/src', 'dist/en/src', { recursive: true });
await cp('en/julia', 'dist/en/julia', { recursive: true });
await cp('en/R', 'dist/en/R', {recursive:true});
const publicMd=await readFile('en/src/public-data.md','utf8');
await writeFile('dist/en/public-data.html',`<!doctype html><html lang="en-GB"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RHC patient summary and data sources · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"></head><body><main class="public-data-page"><a href="index.html#chapter-0">← Back to the course</a>${renderMarkdown(publicMd).replace('<div class="rhc-patient-summary-placeholder"></div>',()=>renderRhcPatientSummary(parsedRhc))}</main><script type="module" src="src/rhc-public-page.js"></script><script type="module" src="src/recall-popovers.js"></script></body></html>`);
const caseReadme = await readFile('en/case-study/README.md', 'utf8');
await writeFile('dist/en/case-study.html', `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>RHC study and analysis settings · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← Back to the course</a>${renderMarkdown(caseReadme)}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
for (const [file, csv] of [['rhc-counts.csv', countsCsv()], ['rhc-records.csv', recordsCsv()]]) {
 await writeFile(`shared/data/${file}`,csv);
 await writeFile(`dist/shared/data/${file}`,csv);
 if (await readFile(`shared/data/${file}`, 'utf8') !== csv) throw Error(`Shared case data differ: ${file}`);
}
const sources = await readFile('en/src/sources.md','utf8');
await writeFile('dist/en/sources.html', `<!doctype html><html lang="en-GB"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>References · ${SITE_NAME}</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← Back to the course</a>${renderMarkdown(sources)}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
console.log(`Built ${chapters.length} authored chapters; local MathML and fonts included.`);

// The same blue/white design is applied last on every published Chinese page.
for(const file of ['index.html','sources.html','case-study.html','public-data.html']){
 let page;try{page=await readFile(`dist/en/${file}`,'utf8');}catch(error){if(error.code==='ENOENT')continue;throw error;}
 const styles=[...page.matchAll(/<link rel="stylesheet"[^>]*>/g)],last=styles.at(-1);
 if(!last)throw Error(`Missing stylesheet insertion point: ${file}`);
 const at=last.index+last[0].length;
 page=page.slice(0,at)+'<link rel="stylesheet" href="src/reading-layout.css"><link rel="stylesheet" href="src/blue-theme.css">'+page.slice(at);
 await writeFile(`dist/en/${file}`,page);
}


}
