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

const beginner = `R在控制台运行一行，也可以用Rscript顺序运行完整文件。直接复制到R控制台时，先把工作目录设为项目根目录；source()完整脚本或Rscript运行脚本时会自行定位项目。先读右侧表达式，再看左侧名字：\`risk <- events / n\`先算除法，再把结果保存为risk。名字指向对象；同一个名字可以接收新计算结果。

| 写法 | 本课用途 | 输出形状 |
| --- | --- | --- |
| \`c(0, 1)\` | 合并两个数 | 长度2向量 |
| \`observations$y\` | 按列名读取数据框 | 长度n向量 |
| \`length(y)\` / \`nrow(rows)\` | 数向量元素 / 数据行 | 一个整数 |
| \`x[1]\` / \`q[1, 2]\` | 按位置取向量元素 / 矩阵元素；从1开始 | 一个数 |
| \`*\`、\`/\`、\`+\`、\`-\` | 同行逐元素运算，标量可作用于整列 | 通常保留向量长度 |
| \`%*%\` | 矩阵乘法 | 维度由行列乘积决定 |
| \`sum(x)\` / \`mean(x)\` | 对完整向量求和 / 平均 | 一个数 |
| \`==\` / \`<-\` | 比较取逻辑值 / 赋值保存结果 | 逻辑对象 / 保存的对象 |
| \`function(v)\` / \`vapply(...)\` | 定义一次输入输出的规则 / 对每项应用规则 | 由函数和声明类型决定 |
| \`stopifnot(...)\` | 要求检查条件均成立 | 通过继续，失败停止 |

R的数值向量长度为n时，\`dim(y)\`通常为NULL；n×1是教学竖排形状。数据框（data.frame）按列保存不同变量，矩阵（matrix）保存同类型数值，列表（list）可同时保存设计矩阵、预测向量和标量。每条计算始终使用完整队列；两项结局支持与n位患者分别对齐。`;

function objectNames(names, mapping) {
  return names.map(name => {
    const object = mapping.objects?.[name] || mapping.columns?.[name];
    const detail = object ? ` · ${object.type} · ${object.dimensionText || (object.dimensions?.length ? object.dimensions.join(' × ') : '标量或容器')}` : '';
    return `<code>${escape(name)}</code>${escape(detail)}`;
  }).join('；');
}
export function rLineCards(mapping) {
  return mapping.lines.map(entry => {
    const formula = entry.formulaTex ? `\n\n$$\n${entry.formulaTex}\n$$\n` : '';
    return `<div class="r-line-card" data-r-line="${entry.line}">\n\n#### R第${entry.line}行\n\n\`\`\`r\n${entry.code}\n\`\`\`\n\n<p>输入：${objectNames(entry.inputs, mapping) || '本行定义的常量或程序环境'}。输出：${objectNames(entry.outputs, mapping) || '执行检查、显示或控制流程'}。</p>\n\n${escape(entry.operation)}${formula}\n\n</div>`;
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
    const traceNote = chapter === 'trace' ? '此工作簿默认TMLE_EPSILON=0，显示所试ε的预测与经验方程；求根步骤在第8讲独立脚本。\n\n' : '';
    const output = `${intro}${traceNote}输入是[同一公开RHC原CSV](../shared/data/public/rhc/source.csv)。共享定义：[RHCCase.R](../shared/R/RHCCase.R)与[EIFCase.R](../shared/R/EIFCase.R)。[完整R脚本](R/${stem}.R)使用base R，保留项目目录结构即可从任意工作目录运行。\n\n\`\`\`sh\nRscript --vanilla zh/R/${stem}.R\n\`\`\`\n\n\`\`\`r\n${script.trimEnd()}\n\`\`\`\n\n<details><summary>逐行解释：输入、输出、维度与数学式</summary>\n\n${rLineCards(mapping)}\n\n</details>`;
    md = md.replace(match[0], () => output);
  }
  return md;
}
