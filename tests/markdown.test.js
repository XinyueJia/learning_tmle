import test from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown, renderFormulaRecall } from '../scripts/markdown.js';

test('inline TeX renders within its sentence with MathML and editable TeX annotation', () => {
  const html = renderMarkdown('原来的结果 $\\Psi(P)$，新结果 $\\Psi(P_t)$。');
  assert.equal((html.match(/class="inline-math"/g) || []).length, 2);
  assert.equal((html.match(/<math /g) || []).length, 2);
  assert(html.includes('<msub>'), 'P_t needs a mathematical subscript');
  assert(html.includes('encoding="application/x-tex">\\Psi(P_t)</annotation>'));
  assert(!html.includes('katex-display'));
  assert(!html.includes('$'));
  assert.match(html, /^<p>原来的结果 /);
});

test('display equations remain display equations, separately from inline TeX', () => {
  const html = renderMarkdown('先看 $P_t$。\n\n$$\n\\Psi(P_t)=\\mu+t(z-\\mu)\n$$\n');
  assert.equal((html.match(/class="equation"/g) || []).length, 1);
  assert.equal((html.match(/class="inline-math"/g) || []).length, 1);
  assert(html.includes('katex-display'));
  assert(!html.includes('$$'));
});

test('details summaries and answers render inline mathematics without swallowing text', () => {
  const html = renderMarkdown('<details><summary>为什么 $P_n f$ 不同？</summary>\n\n因为 $P_0 f=\\mathbb E_{P_0}[f]$ 使用总体权重。\n\n</details>');
  assert.equal((html.match(/class="inline-math"/g) || []).length, 2);
  assert(html.includes('<details><summary>为什么 '));
  assert(html.includes('使用总体权重。'));
  assert(!html.includes('$'));
});

test('table conditional notation stays in one cell and wide tables can scroll', () => {
  const html = renderMarkdown('| 条件均值 | 解释 |\n| --- | --- |\n| $\\mathbb E_P[Y\\mid A=1]$ | 组内平均 |');
  assert.equal((html.match(/<td>/g) || []).length, 2);
  assert.equal((html.match(/class="inline-math"/g) || []).length, 1);
  assert(html.includes('class="table-wrap" tabindex="0"'));
});

test('code and escaped currency stay literal; incomplete math is not consumed', () => {
  const html = renderMarkdown('代码 `$P_t$`，价格 \\$9，未闭合 $P_t。');
  assert(html.includes('<code>$P_t$</code>'));
  assert(html.includes('价格 $9'));
  assert(html.includes('未闭合 $P_t。'));
  assert(!html.includes('inline-math'));
});

test('invalid TeX fails the build rather than silently displaying a broken formula', () => {
  assert.throws(() => renderMarkdown('错误 $\\notARealMathCommand$。'), /Undefined control sequence/);
});

test('local symbol recalls render readable notes with mathematics and operation reminders', () => {
  const html = renderMarkdown('$$\nD(Y;P)=Y-\\mu\n$$\n\n> **符号回看：** $Y$ 是随机分数，$\\mu$ 是原均值。**这一步：** 每个分数减同一个均值。\n');
  assert.match(html, /class="equation"[\s\S]*class="formula-recall" role="note"/);
  assert.equal((html.match(/class="formula-recall"/g) || []).length, 1);
  assert.equal((html.match(/class="inline-math"/g) || []).length, 2);
  assert(html.includes('<strong>这一步：</strong>'));
  assert(html.includes('aria-label="公式符号与运算回看"'));
  assert(!html.includes('<blockquote>'));
  const figureNote = renderFormulaRecall('$P_t$ 是更新后的权重。');
  assert(figureNote.includes('encoding="application/x-tex">P_t</annotation>'));
  assert.throws(() => renderFormulaRecall('$\\notARealMathCommand$'), /Undefined control sequence/);
});

test('recalls stay with folded answers while quoted examples in code remain literal', () => {
  const html = renderMarkdown('<details><summary>答案</summary>\n\n$$\n\\Psi(P_t)=1.56\n$$\n\n> **符号回看：** $P_t$ 是本题的新分布。\n\n</details>\n\n```md\n> **符号回看：** $P_t$\n```\n\n> 普通引用。\n');
  assert.equal((html.match(/class="formula-recall"/g) || []).length, 1);
  assert.match(html, /<details>[\s\S]*class="formula-recall"[\s\S]*<\/details>/);
  assert(html.includes('&gt; **符号回看：** $P_t$'));
  assert(html.includes('<blockquote>\n<p>普通引用。</p>'));
});

test('multiline Julia code in folded sections is parsed once and preserves copyable source', () => {
  const code = 'include(joinpath(@__DIR__, "EIFCase.jl"))\n\n'
    + 'data = case_data(joinpath(@__DIR__, "counts.csv"))\n'
    + 'values = [c.y - 0.58 for c in data.cells]\n'
    + 'println("$(length(values)) records")\n';
  const html = renderMarkdown('<details><summary>Julia代码</summary>\n\n```julia\n' + code + '```\n\n</details>');
  const rendered = html.match(/<pre><code class="language-julia">([\s\S]*?)<\/code><\/pre>/)?.[1];
  assert(rendered, 'one intact fenced Julia block');
  assert.equal(rendered.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&gt;', '>').replaceAll('&lt;', '<').replaceAll('&amp;', '&'), code);
  assert.equal((rendered.match(/@__DIR__/g) || []).length, 2);
  assert(!/<(?:p|strong)>/.test(rendered), 'Markdown must not be inserted into code text');
  assert(!html.includes('course-rendered-details:'));
});

test('CJK punctuation next to prose renders bilingual strong terms without adding spaces', () => {
  for (const [source, expected] of [
    ['**识别（identification）**问的是', '<strong>识别（identification）</strong>问的是'],
    ['**estimator（估计量）**是规则；**estimate（估计值）**是结果', '<strong>estimator（估计量）</strong>是规则；<strong>estimate（估计值）</strong>是结果'],
    ['中文**（术语）**中文', '中文<strong>（术语）</strong>中文'],
    ['**符号：**这一步', '<strong>符号：</strong>这一步'],
    ['中文**“术语”**中文', '中文<strong>“术语”</strong>中文'],
    ['**识别（identification）**𠮷', '<strong>识别（identification）</strong>𠮷'],
  ]) assert.equal(renderMarkdown(source), `<p>${expected}</p>\n`);
});

test('CJK emphasis preserves nested emphasis, links and code rather than closing inside them', () => {
  const html = renderMarkdown('**含 `a）**b`、[链接](https://example.test/a**b) 和 *内层* 的术语（term）**后续');
  assert.equal(html, '<p><strong>含 <code>a）**b</code>、<a href="https://example.test/a**b">链接</a> 和 <em>内层</em> 的术语（term）</strong>后续</p>\n');
  assert.equal(renderMarkdown('***术语（term）***后续'), '<p><em><strong>术语（term）</strong></em>后续</p>\n');
  assert.equal(renderMarkdown('*术语（term）*后续'), '<p><em>术语（term）</em>后续</p>\n');
});

test('CJK formatting leaves escaped stars, fenced code, inline code and HTML attributes literal', () => {
  const html = renderMarkdown('`**识别（identification）**问`，\\*\\*术语（term）\\*\\*后续\n\n```julia\nprintln("**识别（identification）**问")\n```\n\n<span title="**说明（term）**后续">原文</span>');
  assert(html.includes('<code>**识别（identification）**问</code>'));
  assert(html.includes('，**术语（term）**后续'));
  assert(html.includes('println(&quot;**识别（identification）**问&quot;)'));
  assert(html.includes('title="**说明（term）**后续"'));
  assert(!html.includes('<strong>'));
  assert.equal(renderMarkdown('** term）**后续'), '<p>** term）**后续</p>\n');
  assert.equal(renderMarkdown('**术语（term）**English'), '<p>**术语（term）**English</p>\n');
});

test('CJK strong text renders inline mathematics and retains original TeX and Julia source', () => {
  const html = renderMarkdown('**含 $P^*$ 与 `@__DIR__` 的目标（target）**如下。\n\n$$\nD^*(O)=Y-\\mu\n$$');
  assert.match(html, /<strong>含 <span class="inline-math">[\s\S]*<code>@__DIR__<\/code> 的目标（target）<\/strong>如下/);
  assert(html.includes('encoding="application/x-tex">P^*</annotation>'));
  assert(html.includes('encoding="application/x-tex">D^*(O)=Y-\\mu</annotation>'));
  assert.equal((html.match(/class="equation"/g) || []).length,1);
});

test('CJK strong terms render in details summaries, answers, tables and formula recalls', () => {
  const html = renderMarkdown('<details><summary>**识别（identification）**问什么？</summary>\n\n**估计量（estimator）**是规则。\n\n| 术语 | 含义 |\n| --- | --- |\n| **正交（orthogonality）**表示 | 内积为零 |\n\n> **符号回看：** **基（basis）**是一组方向。\n\n</details>');
  for(const term of ['识别（identification）','估计量（estimator）','正交（orthogonality）','基（basis）']) assert(html.includes(`<strong>${term}</strong>`),term);
  assert.equal((html.match(/class="table-wrap"/g)||[]).length,1);
  assert.equal((html.match(/class="formula-recall"/g)||[]).length,1);
  assert(!html.includes('**'));
});

test('symbol recalls expose unique accessible popover controls without losing explanatory maths', () => {
  const first=renderFormulaRecall('$P_t$ 是新权重。**这一步：** 保持总和为1。');
  const second=renderFormulaRecall('另一组符号。');
  const id=first.match(/class="recall-popover" id="([^"]+)"/)[1];
  const other=second.match(/class="recall-popover" id="([^"]+)"/)[1];
  assert.notEqual(id,other);
  assert(first.includes(`popovertarget="${id}" aria-controls="${id}" aria-expanded="false" aria-haspopup="dialog"`));
  assert(first.includes('popover="auto" role="dialog" aria-modal="false"'));
  assert(first.includes(`aria-labelledby="${id}-title"`));
  assert(first.includes('popovertargetaction="hide" aria-label="关闭符号回看"'));
  assert(first.includes('encoding="application/x-tex">P_t</annotation>'));
  assert(first.includes('<strong>这一步：</strong>'));
});
