// Local explanatory panels: transient hover/focus, or click to keep reading.
export function mountRecallPopovers(doc = document) {
  if (doc.documentElement.dataset.recallsMounted === 'true') return;
  doc.documentElement.dataset.recallsMounted = 'true';
  const win = doc.defaultView;
  let active = null, timer = null, closing = false;
  const cancelClose = () => { win.clearTimeout(timer); timer = null; };
  const native = panel => typeof panel.showPopover === 'function';
  const visible = panel => native(panel) ? panel.matches(':popover-open') : panel.classList.contains('is-open');

  function close({ restoreFocus = false, explicit = false } = {}) {
    cancelClose();
    if (!active) return;
    const entry = active;
    active = null;
    entry.pinned = false;
    entry.suppressed = explicit;
    entry.trigger.setAttribute('aria-expanded', 'false');
    closing = true;
    try {
      if (native(entry.panel)) { if (visible(entry.panel)) entry.panel.hidePopover(); }
      else entry.panel.classList.remove('is-open');
    } finally { closing = false; }
    if (restoreFocus && entry.trigger.isConnected) {
      entry.suppressed = true;
      entry.trigger.focus({ preventScroll: true });
    }
  }

  function position(entry) {
    const anchor = entry.trigger.getBoundingClientRect(), panel = entry.panel;
    const view = win.visualViewport;
    const gap = 16, offset = 8, width = view?.width || win.innerWidth, height = view?.height || win.innerHeight;
    const x = view?.offsetLeft || 0, y = view?.offsetTop || 0;
    panel.style.maxWidth = `${Math.max(1, width - 2 * gap)}px`;
    panel.style.maxHeight = `${Math.max(1, Math.min(height * .6, 440, height - 2 * gap))}px`;
    if (anchor.bottom < y || anchor.top > y + height) { close(); return; }
    const box = panel.getBoundingClientRect();
    const left = Math.max(x + gap, Math.min(anchor.left, x + width - box.width - gap));
    const below = anchor.bottom + offset;
    const top = below + box.height <= y + height - gap ? below : Math.max(y + gap, anchor.top - offset - box.height);
    panel.style.left = `${left}px`;
    panel.style.top = `${Math.min(top, Math.max(y + gap, y + height - box.height - gap))}px`;
    for (const math of panel.querySelectorAll('.inline-math')) {
      if (math.scrollWidth > math.clientWidth + 1) math.tabIndex = 0;
      else math.removeAttribute('tabindex');
    }
  }

  function open(entry, reason) {
    if (closing) return;
    if (entry.suppressed && reason !== 'click') return;
    if (reason === 'hover' && active && active !== entry &&
        (active.pinned || active.panel.contains(doc.activeElement))) return;
    cancelClose();
    if (active !== entry) { close(); active = entry; }
    entry.suppressed = false;
    if (reason === 'click') entry.pinned = true;
    entry.trigger.setAttribute('aria-expanded', 'true');
    if (native(entry.panel)) { if (!visible(entry.panel)) entry.panel.showPopover(); }
    else entry.panel.classList.add('is-open');
    position(entry);
  }

  function scheduleClose(entry) {
    cancelClose();
    timer = win.setTimeout(() => {
      if (active !== entry || entry.pinned || entry.wrapper.contains(doc.activeElement) ||
          entry.trigger.matches(':hover') || entry.panel.matches(':hover')) return;
      close();
    }, 180);
  }

  const attached = new WeakSet();
  function attach(scope = doc) {
  for (const wrapper of scope.querySelectorAll('.formula-recall')) {
    if(attached.has(wrapper))continue;
    attached.add(wrapper);
    const trigger = wrapper.querySelector('.recall-trigger'), panel = wrapper.querySelector('.recall-popover');
    if (!trigger || !panel) continue;
    const entry = { wrapper, trigger, panel, pinned: false, suppressed: false };
    trigger.addEventListener('pointerenter', event => {
      if (event.pointerType !== 'touch' && win.matchMedia('(hover: hover) and (pointer: fine)').matches) open(entry, 'hover');
    });
    trigger.addEventListener('pointerleave', () => { entry.suppressed = false; scheduleClose(entry); });
    panel.addEventListener('pointerenter', cancelClose);
    panel.addEventListener('pointerleave', () => scheduleClose(entry));
    wrapper.addEventListener('focusin', event => {
      if (event.target === trigger) open(entry, 'focus');
      else cancelClose();
    });
    wrapper.addEventListener('focusout', event => {
      if (!wrapper.contains(event.relatedTarget)) { entry.suppressed = false; scheduleClose(entry); }
    });
    trigger.addEventListener('click', event => {
      event.preventDefault(); // Hover may already have opened the native popover.
      if (active === entry && entry.pinned) { close({ explicit: true }); return; }
      open(entry, 'click');
      panel.focus({ preventScroll: true });
    });
    panel.querySelector('.recall-close').addEventListener('click', event => {
      event.preventDefault();
      close({ restoreFocus: true, explicit: true });
    });
    panel.addEventListener('toggle', event => {
      const isOpen = event.newState === 'open';
      trigger.setAttribute('aria-expanded', String(isOpen));
      if (!isOpen && active === entry) { active = null; entry.pinned = false; }
    });
  }

  }
  attach();
  doc.addEventListener('eif:chapter-ready', event => attach(event.detail.article));

  doc.addEventListener('pointerdown', event => {
    if (active && !active.wrapper.contains(event.target)) close({ explicit: true });
  }, true);
  doc.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      close({ restoreFocus: active.panel.contains(doc.activeElement), explicit: true });
    }
  }, true);
  doc.addEventListener('scroll', event => {
    if (active && !active.panel.contains(event.target)) position(active);
  }, true);
  doc.addEventListener('toggle', event => {
    if (active && event.target.tagName === 'DETAILS' && !event.target.open && event.target.contains(active.wrapper)) close();
  }, true);
  win.addEventListener('hashchange', () => close());
  const reposition = () => { if (active) position(active); };
  win.addEventListener('resize', reposition);
  win.visualViewport?.addEventListener('resize', reposition);
  win.visualViewport?.addEventListener('scroll', reposition);
  doc.fonts?.ready.then(() => { if (active) position(active); });
}

if (typeof document !== 'undefined') mountRecallPopovers(document);
