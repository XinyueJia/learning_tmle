import { Marked, Tokenizer } from 'marked';
import katex from 'katex';

const renderMath = (tex, displayMode) => katex.renderToString(tex, {
  displayMode, output: 'htmlAndMathml', throwOnError: true,
});

export const renderInlineMath = tex => `<span class="inline-math">${renderMath(tex, false)}</span>`;

const cjkLetter = value => /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(value || '');
const cjkPunctuation = value => /[\u2018-\u201f\u3001-\u303f\uff01-\uff65]/u.test(value || '') && /\p{P}/u.test(value);
const probePunctuation = source => source.replace(/[\u2018-\u201f\u3001-\u303f\uff01-\uff65]/gu,
  character => cjkPunctuation(character) ? '字' : character);

let activeLocale = 'zh';
const localised = (zh, en) => activeLocale === 'en' ? en : zh;

const parser = new Marked({ tokenizer: {
  emStrong(source, maskedSource, previous = '') {
    const ordinary = Tokenizer.prototype.emStrong.call(this, source, maskedSource, previous);
    if (ordinary) return ordinary;
    if (!source.startsWith('*')) return false;
    // Use Marked's own delimiter matching and masked code/link/escape regions.
    // Only the detection probe relaxes CJK punctuation; emitted text stays exact.
    const probe = { rules: this.rules, lexer: { inlineTokens: () => [] } };
    const found = Tokenizer.prototype.emStrong.call(probe,
      probePunctuation(source), probePunctuation(maskedSource), previous);
    if (!found || !['strong', 'em'].includes(found.type)) return false;
    const raw = source.slice(0, found.raw.length);
    const width = found.type === 'strong' ? 2 : 1, text = raw.slice(width, -width);
    const content = raw.replace(/^\*+|\*+$/g, '');
    const first = Array.from(content)[0], last = Array.from(content).at(-1);
    const next = Array.from(source.slice(raw.length))[0];
    if (!(cjkPunctuation(first) && cjkLetter(previous)) && !(cjkPunctuation(last) && cjkLetter(next))) return false;
    return { type: found.type, raw, text, tokens: this.lexer.inlineTokens(text) };
  },
}, extensions: [
  {
    name: 'formulaRecall', level: 'block',
    start: source => source.search(/> \*\*(?:符号回看：|Symbols:|Notation recap:)\*\*/),
    tokenizer(source) {
      // A one-paragraph Markdown note stays editable even in a plain reader.
      const match = /^> \*\*(?:符号回看：|Symbols:|Notation recap:)\*\*\s*([^\n]+)(?:\n|$)/.exec(source);
      if (match) return { type: 'formulaRecall', raw: match[0], source: match[1] };
    },
    renderer(token) { return renderFormulaRecall(token.source); },
  },
  {
    name: 'displayMath', level: 'block', start: source => source.indexOf('$$'),
    tokenizer(source) {
      const match = /^\$\$\s*\n?([\s\S]*?)\$\$(?:\n|$)/.exec(source);
      if (match) return { type: 'displayMath', raw: match[0], tex: match[1].trim() };
    },
    renderer(token) {
      return `<div class="equation" tabindex="0" aria-label="${localised('数学公式，可横向滚动', 'Mathematical formula; scroll horizontally')}">${renderMath(token.tex, true)}</div>`;
    },
  },
  {
    name: 'inlineMath', level: 'inline', start: source => source.indexOf('$'),
    tokenizer(source) {
      // Single dollars delimit a same-line formula; escaped dollars remain text.
      const match = /^\$(?!\$)((?:\\[^\n]|[^$\\\n])+?)\$(?!\$)/.exec(source);
      if (match) return { type: 'inlineMath', raw: match[0], tex: match[1].trim() };
    },
    renderer(token) {
      return renderInlineMath(token.tex);
    },
  },
] });

let recallSequence = 0;

export function renderFormulaRecall(source, locale = activeLocale) {
  const label = locale === 'en' ? 'Symbols' : '符号回看';
  const id = `symbol-recall-${++recallSequence}`;
  return `<div class="formula-recall" role="note" aria-label="${locale === 'en' ? 'Formula symbols and operations' : '公式符号与运算回看'}"><button class="recall-trigger" type="button" popovertarget="${id}" aria-controls="${id}" aria-expanded="false" aria-haspopup="dialog"><span aria-hidden="true">ⓘ</span> ${label}</button><div class="recall-popover" id="${id}" popover="auto" role="dialog" aria-modal="false" aria-labelledby="${id}-title" tabindex="-1"><div class="recall-header"><strong id="${id}-title">${label}${locale === 'en' ? ':' : '：'}</strong><button class="recall-close" type="button" popovertarget="${id}" popovertargetaction="hide" aria-label="${locale === 'en' ? 'Close symbol explanation' : '关闭符号回看'}">×</button></div><p>${parser.parseInline(source)}</p></div></div>`;
}

export function renderMarkdown(source, {locale = 'zh'} = {}) {
  const previousLocale = activeLocale;
  activeLocale = locale;
  try {
  // Parse each native-details body once. Protect the compiled fragment from a
  // second Markdown pass, which would corrupt Julia __DIR__ after blank lines.
  const details = [];
  const prepared = source.replace(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g,
    (_, summary, body) => {
      const index = details.length;
      details.push(`<details><summary>${parser.parseInline(summary)}</summary>\n${parser.parse(body)}\n</details>`);
      return `\n\n<!--course-rendered-details:${index}-->\n\n`;
    });
  const html = parser.parse(prepared).replace(/<!--course-rendered-details:(\d+)-->/g,
    (_, index) => details[Number(index)]);
  return html.replace(/<table>([\s\S]*?)<\/table>/g,
    (_, body) => `<div class="table-wrap" tabindex="0" role="region" aria-label="${localised('正文表格，可横向滚动', 'Table; scroll horizontally')}"><table>${body}</table></div>`);
  } finally { activeLocale = previousLocale; }
}
