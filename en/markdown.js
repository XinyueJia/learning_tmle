import {renderMarkdown as render, renderFormulaRecall as recall} from '../scripts/markdown.js';
export {renderInlineMath} from '../scripts/markdown.js';
export const renderMarkdown = source => render(source, {locale:'en'});
export const renderFormulaRecall = source => recall(source, 'en');
