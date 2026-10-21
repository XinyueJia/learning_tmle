import { readFile, writeFile, mkdir, readdir, cp } from 'node:fs/promises';
import { renderMarkdown } from '../../scripts/markdown.js';
import { renderChapter1Visuals } from './chapter1-visuals.js';
import { renderChapter0Visuals } from './chapter0-visuals.js';
import { expandJuliaLessons } from './case-code.js';
import { expandChapter1Walkthrough } from './julia-walkthrough.js';
import {parsePublicCsv,auditPublicRows} from '../../shared/js/public-rws.js';
import { countsCsv, recordsCsv } from '../../shared/js/case-study.js';
export async function buildChineseEdition() {
await mkdir('dist/zh', { recursive: true });
const publicAudit=auditPublicRows(parsePublicCsv(await readFile('shared/data/public/ng-2021-nsclc/source.csv','utf8')));
const publicNotice=`<p class="public-data-notice">真实资料已接入：<a href="public-data.html">${publicAudit.n}条公开肺癌用药记录与Julia核查实验 ↗</a>。八讲的200人表仍为完整结局下的合成数学例子；公开资料的12个月PFS定义尚未验证，未直接用于临床TMLE。</p>`;
const files = (await readdir('zh/src/chapters')).filter(f => /^ch\d\d\.md$/.test(f)).sort();
if (!files.length) throw Error('没有可交付章节');
const chapters = [];
for (const f of files) {
  const md = await expandJuliaLessons(await expandChapter1Walkthrough(await readFile(`zh/src/chapters/${f}`, 'utf8')));
  const n = Number(f.slice(2, 4));
  const title = md.match(/^# (.+)/m)?.[1];
  if (!title || !md.includes(`data-lab="${n}"`)) throw Error(`${f} 缺正文标题或实验`);
  const html = renderMarkdown(md).replace(/<pre>/g, '<pre tabindex="0" aria-label="代码，可横向滚动">');
  chapters.push({ n, title, md, html: n === 0 ? renderChapter0Visuals(html) : n === 1 ? renderChapter1Visuals(html) : html });
}
await writeFile('dist/zh/EIF_Tutorial.md', '# EIF：从分布到估计\n\n中文交互课程的可编辑讲义。公式保留 TeX 源，Julia定义来自实际可执行源码；静态配图和实验见 index.html。\n\n' + chapters.map(c=>c.md).join('\n\n---\n\n'));
const firstChapter = chapters[0].n;
const mainChapterCount = chapters.filter(c => c.n > 0).length;
const nav = chapters.map(c => `<a href="#chapter-${c.n}" data-chapter="${c.n}"><span>${String(c.n).padStart(2,'0')}</span>${c.title.replace(/^第.*?章[：· —]+/, '')}</a>`).join('');
await writeFile('dist/zh/index.html', `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="description" content="从改变概率到效率界：逐步构建并验证 efficient influence function 的交互课程。"><title>EIF · 从分布到估计</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"></head><body><a class="skip" href="#main">跳到正文</a><div class="shell"><aside><a class="brand" href="#chapter-${firstChapter}">EIF<span>从分布到估计</span></a><p class="rail-note">从基础应用生物统计出发</p><nav aria-label="章节导航">${nav}</nav><div class="rail-bottom"><p id="reading-status" aria-live="polite"></p><p>中文讲解 · 可计算实验<br>无需登录 · 本地运行</p><a href="sources.html">文献与数学边界 ↗</a><br><a href="EIF_Tutorial.md" download>下载可编辑讲义 ↓</a><br><a href="../shared/data/rws-counts.csv" download>案例计数 CSV ↓</a><br><a href="../shared/julia/EIFCase.jl" download>Julia完整源码 ↓</a><br><a href="case-study.html">案例与Julia运行说明 ↗</a><br><a href="public-data.html">真实公开RWS数据 ↗</a></div></aside><main id="main" tabindex="-1"><header class="course-intro"><span class="eyebrow">THE DISTRIBUTION IS THE INPUT</span><p>一个估计目标，为什么需要一个函数？</p><small>同一批上市后RWS合成记录：从药品疗效问题出发，构建梯度，逐讲用Julia完成TMLE。</small><p class="reader-note">只学过基础应用生物统计也可以从第0章导读开始：先明确想估计什么，再进入第1章均值推导。条件期望、求导与几何会随问题逐步引入；先跟数字例子，再预测、操作和读推导。长公式可横向滑动，或聚焦公式后按键盘左右键。“符号回看”可悬停、键盘聚焦或点按查看，按Esc或点外部关闭。</p>${publicNotice}</header>${chapters.map((c, i) => `<article id="chapter-${c.n}" data-number="${c.n}" class="chapter" hidden><div class="chapter-meta">${c.n === 0 ? '概念导读 · 第0章' : `CHAPTER ${String(c.n).padStart(2,'0')} / ${String(mainChapterCount).padStart(2,'0')}`}<span>推导 → 预测 → 实验 → 验证</span></div>${c.html}<footer><button class="mark-read" type="button">标记本章已学习</button>${chapters[i+1] ? `<a class="next" href="#chapter-${chapters[i+1].n}">进入第${chapters[i+1].n}章 →</a>` : ''}</footer></article>`).join('')}<p class="page-foot">八讲推导使用明确概率模型与固定合成记录；真实公开队列单列于资料核查页。<a href="sources.html">查看来源</a></p></main></div><script type="module" src="src/app.js"></script></body></html>`);
await cp('zh/src', 'dist/zh/src', { recursive: true });
await cp('zh/julia', 'dist/zh/julia', { recursive: true });
const publicMd=await readFile('zh/src/public-data.md','utf8');
await writeFile('dist/zh/public-data.html',`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>真实公开RWS数据 · EIF</title><link rel="icon" href="data:,"><link rel="stylesheet" href="../vendor/katex.min.css"><link rel="stylesheet" href="src/style.css"></head><body><main class="public-data-page"><a href="index.html#chapter-0">← 返回课程</a>${renderMarkdown(publicMd)}</main><script type="module" src="src/public-data.js"></script><script type="module" src="src/recall-popovers.js"></script></body></html>`);
const caseReadme = await readFile('zh/case-study/README.md', 'utf8');
await writeFile('dist/zh/case-study.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>固定案例与Julia · EIF</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← 返回课程</a>${publicNotice}${renderMarkdown(caseReadme)}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
for (const [file, csv] of [['rws-counts.csv', countsCsv()], ['rws-records.csv', recordsCsv()]]) {
 if (await readFile(`shared/data/${file}`, 'utf8') !== csv) throw Error(`Shared case data differ: ${file}`);
}
let sources = '';
try { sources = await readFile('zh/docs/SOURCES.md','utf8'); } catch { sources = '# 文献记录\n\n来源核验尚未完成。'; }
await writeFile('dist/zh/sources.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>文献 · EIF</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><main class="sources"><a href="index.html">← 返回课程</a>${renderMarkdown(sources).replaceAll('href="AUDIT.md"', 'href="audit.html"')}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
console.log(`Built ${chapters.length} authored chapters; local MathML and fonts included.`);

try {
 const audit = await readFile('zh/docs/AUDIT.md', 'utf8');
 await writeFile('dist/zh/audit.html', `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>原型审计 · EIF</title><link rel="icon" href="data:,"><link rel="stylesheet" href="src/style.css"><link rel="stylesheet" href="../vendor/katex.min.css"><main class="sources"><a href="sources.html">← 返回文献记录</a>${renderMarkdown(audit.replace(/\\\[([\s\S]*?)\\\]/g, (_,tex)=>`\n\n$$\n${tex}\n$$\n\n`))}</main><script type="module" src="src/recall-popovers.js"></script></html>`);
} catch { /* Source audit is optional during the first build. */ }

}
