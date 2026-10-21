import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { caseData } from '../../shared/js/case-study.js';

export function chapter1Sources(moduleSource, lessonSource) {
  const core = moduleSource.split('# BEGIN_CH01')[1]?.split('# END_CH01')[0]?.trim();
  if (!core || !lessonSource.trim()) throw Error('Chapter 1 Julia sources are missing');
  return { core, lesson: lessonSource.trim() };
}

// Author-reviewed source hashes make changes require a matching explanation review.
export function expandJuliaLineCards(guide, sources) {
  for (const [name, source] of Object.entries(sources)) {
    const expected = /<!-- julia-guide-source (core|lesson) sha256=([a-f0-9]{64}) -->/g;
    const hashes = [...guide.matchAll(expected)].filter(m => m[1] === name);
    const actual = createHash('sha256').update(source).digest('hex');
    if (hashes.length !== 1 || hashes[0][2] !== actual) throw Error(`Julia ${name} changed: review every line explanation and update its source hash`);
  }
  const seen = { core: new Set(), lesson: new Set() };
  let output = guide.replace(/<!-- julia-line (core|lesson):(\d+) -->([\s\S]*?)<!-- \/julia-line -->/g,
    (_, name, rawIndex, explanation) => {
      const index = Number(rawIndex), line = sources[name].split('\n')[index - 1];
      if (!line?.trim() || seen[name].has(index) || !explanation.trim()) throw Error(`Missing or duplicate Julia explanation ${name}:${index}`);
      seen[name].add(index);
      const label = name === 'core' ? '函数定义' : '运行脚本';
      return `<div class="julia-line-card" data-julia-part="${name}" data-julia-line="${index}">\n\n<p class="julia-line-label">${label} · 第${index}行</p>\n\n\`\`\`julia\n${line}\n\`\`\`\n\n${explanation.trim()}\n\n</div>`;
    });
  for (const [name, source] of Object.entries(sources)) {
    source.split('\n').forEach((line, i) => {
      if (line.trim() && !seen[name].has(i + 1)) throw Error(`Unexplained Julia line ${name}:${i + 1}`);
    });
  }
  if (/<!-- \/?julia-line/.test(output)) throw Error('Malformed Julia line marker');
  return output.replace(/<!-- julia-guide-source[^\n]+-->/g, '');
}

export function chapter1LoopTrace(rows) {
  const data = caseData(rows);
  const events = data.cells.reduce((sum, c) => sum + c.n * c.y, 0);
  const risk = events / data.n;
  let eventTotal = 0, weightedMean = 0;
  const trace = data.cells.map((cell, i) => {
    const increment = cell.n * cell.y;
    eventTotal += increment;
    const probability = cell.n / data.n, influence = cell.y - risk;
    const contribution = probability * influence;
    weightedMean += contribution;
    return { index: i + 1, ...cell, increment, eventTotal, probability, influence, contribution, weightedMean };
  });
  return { n: data.n, events, risk, trace };
}

const f = value => (Math.abs(value) < 5e-7 ? 0 : value).toFixed(6);
const traceTable = (label, heads, rows) => `<p>${label}</p>\n\n| ${heads.join(' | ')} |\n| ${heads.map(() => '---').join(' | ')} |\n${rows.map(row => `| ${row.join(' | ')} |`).join('\n')}`;

export async function expandChapter1Walkthrough(source) {
  const marker = '<div class="julia-walkthrough" data-julia-walkthrough="01"></div>';
  if (!source.includes(marker)) return source;
  const [guide, moduleSource, lesson, csv, output] = await Promise.all([
    readFile('zh/src/julia/ch01-walkthrough.md', 'utf8'), readFile('shared/julia/EIFCase.jl', 'utf8'),
    readFile('zh/julia/lessons/ch01.jl', 'utf8'), readFile('shared/data/rws-counts.csv', 'utf8'),
    readFile('zh/julia/lessons/ch01-output.txt', 'utf8'),
  ]);
  const rows = csv.trim().split(/\r?\n/).slice(1).map(line => {
    const [x, a, y, n] = line.split(',').map(Number); return { x, a, y, n };
  });
  const { trace } = chapter1LoopTrace(rows);
  let expanded = expandJuliaLineCards(guide, chapter1Sources(moduleSource, lesson));
  expanded = expanded.replace('<!-- julia-trace events -->', traceTable('循环一：累计观察终点事件人数',
    ['格序号j', '(X,A,Y)', '该格人数', '本次增加nⱼyⱼ', '累计终点事件人数'],
    trace.map(c => [c.index, `(${c.x},${c.a},${c.y})`, c.n, c.increment, c.eventTotal])));
  expanded = expanded.replace('<!-- julia-trace influence -->', traceTable('循环二：保存影响值并累计概率加权贡献',
    ['格序号j', '概率pⱼ', '影响值Dⱼ', '本格pⱼDⱼ', '累计加权平均'],
    trace.map(c => [c.index, f(c.probability), f(c.influence), f(c.contribution), f(c.weightedMean)])));
  expanded = expanded.replace('<!-- julia-output -->', `\`\`\`text\n${output.trim()}\n\`\`\``);
  return source.replace(marker, () => expanded);
}
