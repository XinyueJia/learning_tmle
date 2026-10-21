import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import katex from 'katex';

const root = fileURLToPath(new URL('../../', import.meta.url));
const read = path => readFileSync(new URL(path, new URL('../../', import.meta.url)), 'utf8');
const map = JSON.parse(read('zh/src/julia/object-map.json'));
const chapter = map.chapters.ch01;
const script = read(chapter.source).trimEnd().split('\n');
const byLine = Object.fromEntries(chapter.lines.map(entry => [entry.line, entry]));
const allEntries = [...chapter.lines, ...map.chapters.ch00.excerpts];

function validateEntry(entry) {
  assert(Array.isArray(entry.inputs));
  assert(Array.isArray(entry.outputs));
  assert(Array.isArray(entry.mathIds));
  for (const id of [...entry.inputs, ...entry.outputs]) assert(map.objects[id], `Unknown object ${id}`);
  for (const id of entry.mathIds) assert(map.allowedMathIds.includes(id), `Unknown mathematical role ${id}`);
  assert.equal(new Set(entry.inputs).size, entry.inputs.length);
  assert.equal(new Set(entry.outputs).size, entry.outputs.length);
  assert(entry.operation.length >= 20, `Missing beginner explanation for ${entry.line ?? entry.id}`);
  assert(!entry.inputs.some(id => entry.outputs.includes(id)), 'Inputs and returned objects have distinct roles');
  if (entry.formulaTex !== null) {
    assert.equal(typeof entry.formulaTex, 'string');
    katex.renderToString(entry.formulaTex, {throwOnError:true, strict:'error'});
  }
}

test('32-line real-cohort lesson remains the source of every executable line', () => {
  assert.equal(script.length, 32);
  assert.equal(chapter.lineCount, 32);
  const executable = script.flatMap((code, i) => code.trim() && !code.trimStart().startsWith('#') ? [i + 1] : []);
  assert.deepEqual(chapter.lines.map(entry => entry.line), executable);
  assert.equal(new Set(chapter.lines.map(entry => entry.line)).size, 17);
  for (const entry of chapter.lines) assert.equal(entry.code, script[entry.line - 1], `Source drift at line ${entry.line}`);
});

test('every mapped operation resolves typed objects and valid mathematical roles', () => {
  assert.equal(map.version, 1);
  for (const [id, object] of Object.entries(map.objects)) {
    assert.equal(object.id, id);
    assert.equal(typeof object.type, 'string');
    assert(Array.isArray(object.dimensions));
    assert(object.dimensionText.length > 5);
  }
  for (const entry of allEntries) validateEntry(entry);
  assert.deepEqual(byLine[3].mathIds, []);
  assert.equal(byLine[3].formulaTex, null, 'Module loading does not claim a statistical calculation');
  assert.equal(byLine[5].formulaTex, null);
});

test('counts, vector broadcasting and scalar means have separate input/output contracts', () => {
  assert.deepEqual(byLine[13].inputs, ['observations']);
  assert.deepEqual(byLine[13].outputs, ['outcomes']);
  assert.deepEqual(map.objects.outcomes.dimensions, ['n']);
  assert.equal(map.objects.outcomes.type, 'Vector{Int}');
  assert.deepEqual(byLine[15].inputs, ['outcomes']);
  assert.deepEqual(byLine[15].outputs, ['events']);
  assert.equal(map.objects.events.type, 'Int');
  assert.deepEqual(map.objects.events.dimensions, []);
  assert.deepEqual(byLine[17].inputs, ['events','sample-size']);
  assert.deepEqual(byLine[17].outputs, ['risk']);
  assert.deepEqual(map.objects.risk.dimensions, []);
  assert.equal(map.objects.risk.type, 'Float64');
  assert.deepEqual(byLine[19].broadcast, {operator:'.-',vector:'outcomes',scalar:'risk',output:'influence'});
  assert.deepEqual(map.objects.influence.dimensions, ['n']);
  assert.deepEqual(byLine[21].inputs, ['influence','sample-size']);
  assert.deepEqual(byLine[21].outputs, ['mean-influence']);
  assert.deepEqual(map.objects['mean-influence'].dimensions, []);
  assert.match(byLine[21].operation, /不是每个人的影响值都为 0/);
});

test('aggregation and terminal labels preserve which mean and which patient unit is used', () => {
  assert.deepEqual(map.objects['coarse-data'].dimensions, [], 'The returned record is not an eight-element Julia vector');
  assert.deepEqual(map.objects['coarse-data'].nestedDimensions.cells, [8]);
  assert.deepEqual(map.objects['check-values'].dimensions, [8]);
  assert.deepEqual(map.objects['check-mean'].dimensions, []);
  assert.deepEqual(byLine[27].inputs, ['check-risk','risk','mean-influence']);
  assert(!byLine[27].inputs.includes('check-mean'), 'The literal assertion does not test check.mean');
  assert.match(byLine[27].operation, /默认数值容差/);
  for (const number of [28,29,30,31]) {
    assert.equal(byLine[number].kind, 'print');
    assert.deepEqual(byLine[number].outputs, ['terminal-output']);
    assert.match(byLine[number].operation, /显示/);
  }
  assert.deepEqual(byLine[31].inputs, ['mean-influence','check-mean']);
  assert.match(byLine[30].operation, /两种可能结局/);
  assert.match(byLine[30].operation, /不是.*预测死亡概率/);
});

test('chapter 0 literal excerpts and references exactly match their declared source ranges', () => {
  for (const excerpt of map.chapters.ch00.excerpts) {
    const references = excerpt.kind === 'source-excerpt' ? [excerpt] : excerpt.sourceReferences;
    assert(references.length > 0);
    for (const reference of references) {
      const actual = read(reference.source).split('\n').slice(reference.startLine - 1, reference.endLine).join('\n');
      assert.equal(reference.code, actual, `Source drift in ${reference.source}:${reference.startLine}`);
    }
  }
});

test('raw baseline variables, fitted design and initial predictions are not conflated', () => {
  assert.deepEqual(map.objects['baseline-w'].dimensions, ['n',15]);
  assert.equal(map.objects['baseline-w'].sourceFields.length, 15);
  assert.deepEqual(map.objects['design-matrix'].dimensions, ['n',17]);
  assert.equal(map.objects['design-matrix'].featureNames.length, 17);
  assert.deepEqual(map.objects['design-matrix'].featureNames.slice(0,5), ['intercept','male','age_z','race_black','race_other']);
  const example = map.chapters.ch00.excerpts.find(entry => entry.id === 'initial-models');
  assert.equal(example.kind, 'runnable-api-example');
  assert.equal(example.source, null, 'An authored API example is not falsely labelled an existing source excerpt');
  assert(example.code.startsWith('fit = prepare_full(rows)'));
  assert(!example.code.includes('full_analysis'), 'A first-fit illustration must not execute TMLE targeting');
  assert(example.code.includes('qa = fit.a .* q1 + (1 .- fit.a) .* q0'));
  for (const id of ['propensity','q0','q1','qa']) assert.deepEqual(map.objects[id].dimensions, ['n']);
  const core = read('shared/julia/RHCCase.jl');
  assert.match(core, /export[\s\S]*?case_at, bisection_step, solve_case, FULL_FEATURES, prepare_full,/);
  assert.match(core, /q0 = expit\.\(hcat\(design, zeros\(n\)\)/);
  assert.match(core, /q1 = expit\.\(hcat\(design, ones\(n\)\)/);
});

const juliaBin = process.env.JULIA_BIN || 'julia';
const julia = spawnSync(juliaBin, ['--startup-file=no','--history-file=no','--version'], {encoding:'utf8'});
test('chapter 0 embedded API example runs on the same real rows and selects factual predictions', {skip:julia.status !== 0}, () => {
  const initial = map.chapters.ch00.excerpts.find(entry => entry.id === 'initial-models');
  const programme = [
    `include(${JSON.stringify(root + 'shared/julia/RHCCase.jl')})`,
    'using .RHCCase',
    ...map.chapters.ch00.excerpts.map(entry => entry.code),
    '@assert length(rows) == fit.n == data.n == 5735',
    '@assert size(fit.design) == (5735,17)',
    '@assert fit.y isa Vector{Float64}',
    '@assert sum(fit.y) == 1918',
    '@assert all(length(v) == fit.n for v in (g,q0,q1,qa))',
    '@assert all(0 .< g .< 1) && all(0 .< q0 .< 1) && all(0 .< q1 .< 1)',
    '@assert all(qa[i] == (fit.a[i] == 1 ? q1[i] : q0[i]) for i in 1:fit.n)',
    '@assert isapprox(mean_if(data).risk, 1918/5735)',
    `println("OBJECT_MAP_VERIFIED")`,
  ].join('\n');
  const result = spawnSync(juliaBin, ['--startup-file=no','--history-file=no','-e',programme], {cwd:root,encoding:'utf8',timeout:60000});
  assert.equal(result.status, 0, result.stderr || String(result.error));
  assert.match(result.stdout, /OBJECT_MAP_VERIFIED/);
  assert(initial.outputs.includes('qa'));
});
