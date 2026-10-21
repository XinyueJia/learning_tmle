/** Frozen source-derived summaries. scripts/build.js checks against the original 5735 rows. */
export const RHC_SOURCE_SHA256='9ef4ab578be4b40ad5d97d3a7e08ffdc1f9f76aeeefee51b4996e4221556f8e8';
export const RHC_COUNTS=Object.freeze([1143,494,558,348,1320,594,796,482].map((n,i)=>Object.freeze({x:Math.floor(i/4),a:Math.floor(i/2)%2,y:i%2,n})));
export const RHC_N=RHC_COUNTS.reduce((s,c)=>s+c.n,0);
export const RHC_EVENTS=RHC_COUNTS.reduce((s,c)=>s+c.n*c.y,0);
export const RHC_MEAN=RHC_EVENTS/RHC_N;
