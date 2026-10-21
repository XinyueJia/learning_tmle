import {fromJoint} from './math.js';
import {RHC_COUNTS,RHC_N,RHC_MEAN} from './rhc-config.js';
export const RHC_MODEL=fromJoint(RHC_COUNTS.map(c=>({...c,p:c.n/RHC_N})));
export const RHC_MEAN_MODEL=Object.freeze({values:Object.freeze([0,1]),probabilities:Object.freeze([1-RHC_MEAN,RHC_MEAN])});
