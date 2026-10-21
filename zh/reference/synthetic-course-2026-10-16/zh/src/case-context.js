// Localised RWS context only; probabilities and observations live in shared/.
export const CASE_CONTEXT = Object.freeze({
  title: '上市后RWS · 抗肿瘤药疗效再评价',
  population: '同一适应证、同一治疗线且两种药物均可选的晚期非小细胞肺癌成年人',
  arm1: '首次启动研究药物A',
  arm0: '首次启动活性对照药物B',
  x0: '高基线预后风险',
  x1: '低基线预后风险',
  endpoint: '12个月内疾病进展或全因死亡',
  y1: '进展或全因死亡',
  y0: '无进展且存活',
  timeZero: '首次给药日；资格判定、用药分组和随访起点同步',
  contrast: '启动药物A减启动药物B的12个月终点事件风险差',
});
