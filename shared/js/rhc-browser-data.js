import {readRhc, prepareRhc} from './rhc.js';

// One original-data request and one initial fit per page, shared by visited chapters.
let pending;
export function getRhcData() {
  if (!pending) pending = (async () => {
    const response = await fetch(new URL('../data/public/rhc/source.csv', import.meta.url));
    if (!response.ok) throw Error(`RHC CSV: HTTP ${response.status}`);
    const rows = readRhc(await response.text());
    return {rows, fit: prepareRhc(rows)};
  })().catch(error => { pending = undefined; throw error; });
  return pending;
}
