(() => {
  const APPROVED_KEY = 'ee_landing_approved';
  const currentUrl = new URL(location.href);
  const currentFile = currentUrl.pathname.split('/').pop().toLowerCase();

  if (currentFile === 'landing.html') {
    sessionStorage.removeItem(APPROVED_KEY);

    document.addEventListener('click', event => {
      const link = event.target.closest('[data-entry-page]');
      if (!link) return;

      const target = link.dataset.entryPage;
      if (!target) return;

      sessionStorage.setItem(APPROVED_KEY, 'true');
      event.preventDefault();
      location.href = new URL(target, currentUrl.href).href;
    });
    return;
  }

  if (currentFile === 'index.html') return;

  let approved = false;
  try {
    approved = sessionStorage.getItem(APPROVED_KEY) === 'true';
  } catch (error) {}

  if (approved) return;

  const landingUrl = currentUrl.pathname.includes('/admin-login/')
    ? new URL('../landing.html', currentUrl.href)
    : new URL('landing.html', currentUrl.href);
  location.replace(landingUrl.href);
})();
