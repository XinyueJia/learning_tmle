import {SITE_TITLES} from './site-config.js';
/** Retain visited chapter nodes: returning to a chapter preserves its controls. */
export function startChapterLoader({mount, afterShow = () => {}, language = 'en', doc = document}) {
  const win = doc.defaultView;
  const articles = [...doc.querySelectorAll('.chapter')];
  const pending = new Map(), visited = new Set();
  const main = doc.getElementById('main');
  let status = doc.getElementById('chapter-loading');
  if (!status) {
    status = doc.createElement('p'); status.id = 'chapter-loading';
    status.setAttribute('role', 'status'); main.prepend(status);
  }
  let revision = 0;
  const english = language === 'en';
  function progress() {
    doc.getElementById('reading-status').textContent = english
      ? `Read ${visited.size} / ${articles.length} chapters` : `已学 ${visited.size} / ${articles.length} 章`;
  }
  function load(article) {
    if (!pending.has(article)) {
      const task = (async () => {
        if (article.dataset.chapterUrl) {
          const response = await fetch(new URL(article.dataset.chapterUrl, doc.baseURI));
          if (!response.ok) throw Error(`HTTP ${response.status}`);
          const template = doc.createElement('template'); template.innerHTML = await response.text();
          const content = template.content.querySelector('article.chapter');
          if (!content || content.id !== article.id) throw Error('Unexpected chapter content');
          article.innerHTML = content.innerHTML;
        }
        await mount(article);
        article.querySelector('.mark-read')?.addEventListener('click', event => {
          visited.add(article.dataset.number);
          event.target.textContent = english ? 'Marked as read ✓' : '已标记为已学 ✓';
          progress();
        });
        article.dataset.chapterState = 'ready';
      })().catch(error => {
        pending.delete(article); article.replaceChildren();
        article.dataset.chapterState = 'error'; throw error;
      });
      pending.set(article, task);
    }
    return pending.get(article);
  }
  async function navigate({focus = false} = {}) {
    const current = ++revision;
    const number = win.location.hash.match(/^#chapter-(\d+)$/)?.[1];
    const active = articles.find(article => article.dataset.number === number) || articles[0];
    for (const article of articles) article.hidden = true;
    for (const link of doc.querySelectorAll('aside nav a[data-chapter]')) {
      if (link.dataset.chapter === active.dataset.number) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
    progress();
    status.hidden = false; status.setAttribute('role', 'status');
    status.textContent = english ? 'Loading chapter…' : '正在加载本章…';
    main.setAttribute('aria-busy', 'true');
    try {
      await load(active);
      if (current !== revision) return;
      active.hidden = false; status.hidden = true;
      doc.title = SITE_TITLES[language] || SITE_TITLES.en;
      win.requestAnimationFrame(afterShow);
      if (focus) { main.focus({preventScroll: true}); win.scrollTo(0, 0); }
    } catch {
      if (current !== revision) return;
      status.setAttribute('role', 'alert');
      status.textContent = english ? 'This chapter could not be loaded. ' : '本章加载失败。';
      const retry = doc.createElement('button'); retry.type = 'button';
      retry.textContent = english ? 'Try again' : '重试';
      retry.addEventListener('click', () => navigate({focus: true})); status.append(retry);
    } finally {
      if (current === revision) main.removeAttribute('aria-busy');
    }
  }
  win.addEventListener('hashchange', () => navigate({focus: true}));
  navigate();
}
