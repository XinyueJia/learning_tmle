import {readFileSync} from 'node:fs';
import {TRACE_STEPS} from '../src/tmle-trace-view.js';
import {renderInlineMath} from '../../scripts/markdown.js';
export function traceMathTemplates(){const mapping=JSON.parse(readFileSync('zh/src/julia/ch08-trace.json','utf8'));return TRACE_STEPS.map((step,i)=>`<template data-trace-math="${i}">${renderInlineMath(step.formulaTex)}</template>`).join('')+JSON.parse(readFileSync('zh/src/R/ch08-trace.json','utf8')).lines.filter(e=>e.formulaTex).map(e=>`<template data-trace-r-line-math="${e.line}">${renderInlineMath(e.formulaTex)}</template>`).join('')+mapping.lines.filter(e=>e.formulaTex).map(e=>`<template data-trace-line-math="${e.line}">${renderInlineMath(e.formulaTex)}</template>`).join('');}
