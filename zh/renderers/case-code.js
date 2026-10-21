import { readFile } from 'node:fs/promises';

// Display the tested Julia definitions, rather than maintain a second prose copy.
export async function expandJuliaLessons(source) {
  const markers = [...source.matchAll(/<div class="julia-source" data-julia-lesson="(0[1-8])"><\/div>/g)];
  if (!markers.length) return source;
  const moduleSource = await readFile('shared/julia/EIFCase.jl', 'utf8');
  for (const [marker, chapter] of markers) {
    const begin = `# BEGIN_CH${chapter}`;
    const end = `# END_CH${chapter}`;
    const start = moduleSource.indexOf(begin);
    const stop = moduleSource.indexOf(end, start);
    if (start < 0 || stop < start) throw Error(`Julia chapter ${chapter} definitions are missing`);
    const definitions = moduleSource.slice(start + begin.length, stop).trim();
    const usage = (await readFile(`zh/julia/lessons/ch${chapter}.jl`, 'utf8')).trim();
    if (!definitions || !usage) throw Error(`Julia chapter ${chapter} is incomplete`);
    source = source.replace(marker, () => `<details><summary>Julia：本讲新增的计算与可运行例子</summary>\n\n下面的定义直接来自可编辑的 [EIFCase.jl](../shared/julia/EIFCase.jl)。完整模块让各讲可以独立运行；按顺序学习时，每次只需理解本讲新增的计算，不必提前阅读后续函数。\n\n\`\`\`julia\n${definitions}\n\`\`\`\n\n将项目中的 [第${Number(chapter)}讲脚本](julia/lessons/ch${chapter}.jl) 在项目根目录的终端执行即可复算：\n\n\`\`\`sh\njulia --startup-file=no --history-file=no zh/julia/lessons/ch${chapter}.jl\n\`\`\`\n\n脚本读取同一份合成计数，不使用未知真值；下面保留其完整可编辑调用：\n\n\`\`\`julia\n${usage}\n\`\`\`\n\n</details>`);
  }
  return source;
}
