import {readFile} from 'node:fs/promises';

const escape = value => String(value).replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const localFile = path => new URL(`../${path}`, import.meta.url);

/** A displayed explanation must correspond exactly to the actual executable line. */
export function validateRMapping(script, mapping) {
  const source = script.trimEnd().split('\n');
  if (source.length !== mapping.lineCount) throw Error(`R source line count changed: ${mapping.source}`);
  const executable = new Set(source.flatMap((code, index) =>
    code.trim() && !code.trimStart().startsWith('#') ? [index + 1] : []));
  const seen = new Set();
  for (const entry of mapping.lines) {
    if (!executable.has(entry.line) || seen.has(entry.line) || source[entry.line - 1] !== entry.code) {
      throw Error(`R source correspondence changed: ${mapping.source}:${entry.line}`);
    }
    if (!entry.operation || !Array.isArray(entry.inputs) || !Array.isArray(entry.outputs)
      || !Object.hasOwn(entry, 'formulaTex')) {
      throw Error(`Incomplete R explanation: ${mapping.source}:${entry.line}`);
    }
    seen.add(entry.line);
  }
  for (const line of executable) if (!seen.has(line)) throw Error(`Unexplained R line: ${mapping.source}:${line}`);
  return mapping;
}

const beginner = `R can run one line in the console or a complete file with Rscript. Before copying code directly into the console, set the working directory to the project root. A complete script run through source() or Rscript locates the project automatically. Read the expression on the right before the name on the left: \`risk <- events / n\` first computes the division, then stores the result as risk. The name points to the object; the same name can receive the result of a new calculation.

| Syntax | What it does | Output shape |
| --- | --- | --- |
| \`c(0, 1)\` | Combine two numbers | Vector of length 2 |
| \`observations$y\` | Read a data-frame column by name | Vector of length n |
| \`length(y)\` / \`nrow(rows)\` | Count vector elements / data rows | An integer |
| \`x[1]\` / \`q[1, 2]\` | Select vector or matrix elements by position, starting at 1 | A number |
| \`*\`, \`/\`, \`+\`, \`-\` | Calculate element by element; a scalar can operate on a whole column | Usually the vector length is preserved |
| \`%*%\` | Matrix multiplication | For an m×k matrix times a k×p matrix: m×p |
| \`sum(x)\` / \`mean(x)\` | Sum or average a complete vector | A number |
| \`==\` / \`<-\` | Test equality / assign a value | Logical object / saved object |
| \`function(v)\` / \`vapply(...)\` | Define a function / apply a function to each element | Determined by the function and declared return type |
| \`stopifnot(...)\` | Requires all check conditions to be met | Continue if passed, stop if failed |

For an R numeric vector of length n, \`dim(y)\` is usually NULL; n×1 is a teaching representation of a column. A data frame stores different variables in columns; a matrix stores numeric values of one type; a list may hold design matrices, prediction vectors and scalars together. Every calculation uses the full cohort; the two outcome support points and the n patient records are aligned separately.`;

function objectNames(names, mapping) {
  return names.map(name => {
    const object = mapping.objects?.[name] || mapping.columns?.[name];
    const detail = object ? ` · ${object.type} · ${object.dimensionText || (object.dimensions?.length ? object.dimensions.join(' × ') : 'scalar or container')}` : '';
    return `<code>${escape(name)}</code>${escape(detail)}`;
  }).join('; ');
}
export function rLineCards(mapping) {
  return mapping.lines.map(entry => {
    const formula = entry.formulaTex ? `\n\n$$\n${entry.formulaTex}\n$$\n` : '';
    return `<div class="r-line-card" data-r-line="${entry.line}">\n\n#### R line ${entry.line}\n\n\`\`\`r\n${entry.code}\n\`\`\`\n\n<p>Input: ${objectNames(entry.inputs, mapping) || 'constants or the current R environment'}. Output: ${objectNames(entry.outputs, mapping) || 'checks, displayed output or control flow'}.</p>\n\n${escape(entry.operation)}${formula}\n\n</div>`;
  }).join('\n\n');
}

/** Render source directly; JSON line correspondence is checked on every build. */
export async function expandRLessons(md) {
  for (const match of [...md.matchAll(/\{\{r-code:(ch0[0-8]|trace)\}\}/g)]) {
    const chapter = match[1], stem = chapter === 'trace' ? 'tmle_trace' : chapter;
    const mapName = chapter === 'trace' ? 'ch08-trace' : chapter;
    const [script, rawMap] = await Promise.all([
      readFile(localFile(`R/${stem}.R`), 'utf8'),
      readFile(localFile(`src/R/${mapName}.json`), 'utf8'),
    ]);
    const mapping = validateRMapping(script, JSON.parse(rawMap));
    const intro = chapter === 'ch01' ? `${beginner}\n\n` : '';
    const traceNote = chapter === 'trace' ? 'This workbook defaults to TMLE_EPSILON=0 and displays predictions and the empirical estimating equation at that trial ε. The separate Chapter 8 script solves for ε.\n\n' : '';
    const output = `${intro}${traceNote}The input is [the same original public RHC CSV](../shared/data/public/rhc/source.csv). Shared definitions: [RHCCase.R](../shared/R/RHCCase.R) and [EIFCase.R](../shared/R/EIFCase.R). [Complete R script](R/${stem}.R) uses base R and runs from any working directory if you retain the project directory structure.\n\n\`\`\`sh\nRscript --vanilla en/R/${stem}.R\n\`\`\`\n\n\`\`\`r\n${script.trimEnd()}\n\`\`\`\n\n<details><summary>Line-by-line explanation: input, output, dimensions and mathematical expressions</summary>\n\n${rLineCards(mapping)}\n\n</details>`;
    md = md.replace(match[0], () => output);
  }
  return md;
}
