import {localiseJuliaComments} from './julia-display-comments.js';
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
    const definitions = localiseJuliaComments(moduleSource.slice(start + begin.length, stop).trim());
    const usage = (await readFile(`en/julia/lessons/ch${chapter}.jl`, 'utf8')).trim();
    if (!definitions || !usage) throw Error(`Julia chapter ${chapter} is incomplete`);
    source = source.replace(marker, () => `<details><summary>Julia: New calculations and runnable examples in this lecture</summary>\n\nThe following definitions come directly from the editable [EIFCase.jl](../shared/julia/EIFCase.jl). The complete module allows each lecture to be run independently; when learning in sequence, you only need to understand the new calculations in this lecture each time, without having to read subsequent functions in advance.\n\n\`\`\`julia\n${definitions}\n\`\`\`\n\nTo reproduce the calculation, run the [Chapter ${Number(chapter)} script](julia/lessons/ch${chapter}.jl) from a terminal at the project root:\n\n\`\`\`sh\njulia --startup-file=no --history-file=no en/julia/lessons/ch${chapter}.jl\n\`\`\`\n\nThe script reads the same synthetic counts without using the unknown true target. The runnable code is shown below:\n\n\`\`\`julia\n${usage}\n\`\`\`\n\n</details>`);
  }
  return source;
}
