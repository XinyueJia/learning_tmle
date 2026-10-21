import {renderInlineMath as math} from '../../scripts/markdown.js';
import {RHC_MODEL} from '../../shared/js/rhc-model.js';
import {ate,fitFromOffsets,aipw,tmle} from '../../shared/js/math.js';

const pp=x=>(100*x).toFixed(4);
const nearZero=x=>Math.abs(x)<1e-9?x.toExponential(2):x.toFixed(6);
export function renderCalibration(initial,target){
 return `<figure class="to-calibration" data-to-calibration>
 <figcaption>在RHC分析中区分经验方程与真实估计误差</figcaption>
 <div class="to-calibration-grid">
 <div><h4>初始${math('\\widehat Q')} · 固定${math('\\widehat g')}</h4><p>风险差 <b>${pp(initial.estimate)} 个百分点</b></p><p>在实际记录上平均EIF（概率差）<br><b>${nearZero(initial.eif_mean)}</b></p></div>
 <div><h4>沿${math('H')}更新 → ${math('\\widehat Q^*')} · 同一${math('\\widehat g')}</h4><p>TMLE风险差 <b>${pp(target.estimate)} 个百分点</b></p><p>在相同记录上平均EIF（概率差）<br><b>${nearZero(target.eif_mean)} ≈ 0</b></p></div>
 </div>
 <p>两次平均都使用经验分布 ${math('P_n')}：每条记录权重为${math('1/5735')}。EIF内的${math('Q')}及风险差随更新改变，${math('g')}保持固定。</p>
 <div class="to-unknown"><b>真实总体 ${math('P_0')} 的目标：？</b><br>缺少这一端，就无法算出“本次估计 − 真实目标”，也无法由方程归零判断本次估计是否更准确。</div>
 </figure>`;
}
export function referenceScenarios(){
 return [[0,1,'Q正确，g有误差'],[.12,0,'g正确，Q有误差'],[.12,.5,'Q、g都有误差']].map(([b,lambda,label])=>{
  const fit=fitFromOffsets(RHC_MODEL,b,lambda),result=tmle(RHC_MODEL,fit);
  return {label,b,lambda,reference:ate(RHC_MODEL),initial:ate(fit),aipw:aipw(RHC_MODEL,fit),tmle:result.estimate,score:result.score,updated:result.updated};
 });
}
export function renderReferenceCalibration(){
 const rows=referenceScenarios(),target=rows[0].reference;
 const x=v=>80+(v+.12)/.24*420;
 const markers=[['initial','初始标准化'],['aipw','AIPW'],['tmle','TMLE']];
 return `<figure class="to-reference" data-to-reference><figcaption>在固定的RHC参考分布中，方程归零能否消除目标偏差？</figcaption>
 <p>只按sex调整 · 已知参考风险差 <b data-to-reference-target="${target}">${pp(target)} 个百分点</b> · 对全部参考概率求和</p>
 ${rows.map((r,j)=>`<section class="to-reference-case" data-to-reference-case="${j}">
 <h4>${r.label.replace(/[Qg]/g,symbol=>math(symbol))}</h4>
 <div class="to-scroll" tabindex="0" role="region" aria-label="${r.label}的三种结果与参考风险差，可横向滚动">
 <svg class="to-reference-chart" viewBox="0 0 610 165" role="img" aria-label="${r.label}：初始标准化${pp(r.initial)}，AIPW ${pp(r.aipw)}，TMLE ${pp(r.tmle)}，参考${pp(target)}，单位为百分点">
 <text x="${x(target)}" y="17" text-anchor="middle">参考目标</text>
 <line x1="${x(target)}" x2="${x(target)}" y1="23" y2="128" class="to-reference-line"/>
 ${markers.map(([key,label],i)=>`<text x="4" y="${46+i*34}">${label}</text><line x1="90" x2="500" y1="${42+i*34}" y2="${42+i*34}" class="to-reference-axis"/><circle cx="${x(r[key])}" cy="${42+i*34}" r="6" class="to-reference-dot to-dot-${key}"/><text x="520" y="${46+i*34}" data-to-ref-value="${r[key]}" data-to-ref-kind="${key}">${pp(r[key])}</text>`).join('')}
 ${[-.1,0,.1].map(v=>`<text x="${x(v)}" y="153" text-anchor="middle">${100*v}</text>`).join('')}<text x="520" y="153">百分点</text></svg>
 </div>
 <div class="to-reference-results"><span>更新后方程平均（概率差） <b data-to-ref-score="${r.score}">${nearZero(r.score)} ≈ 0</b></span><span>TMLE − 参考目标 <b data-to-ref-error="${r.tmle-target}">${Math.abs(r.tmle-target)<1e-9?'≈ 0':pp(r.tmle-target)} 个百分点</b></span></div>
 </section>`).join('')}<p class="to-data-note">虚线固定在同一个参考目标；三个圆点表示三种计算结果。所有情形都解出方程的根；第三种情形仍留有参考偏差。此处没有重新抽样，展示的是固定参考分布中的模型误差。</p></figure>`;
}
