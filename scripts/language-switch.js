const languageLinks = [...document.querySelectorAll('[data-language]')].map(link => [link, link.getAttribute('href')]);
function updateLanguageLinks() {
  for (const [link, base] of languageLinks) link.href = base + location.search + location.hash;
}
updateLanguageLinks();
addEventListener('hashchange', updateLanguageLinks);
for (const picker of document.querySelectorAll('.language-picker')) {
  const trigger = picker.querySelector('summary');
  picker.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      picker.open = false;
      trigger.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!picker.contains(event.target)) picker.open = false;
  });
  picker.addEventListener('focusout', event => {
    if (!picker.contains(event.relatedTarget)) picker.open = false;
  });
}
