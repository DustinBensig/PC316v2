  const navigationLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
  const navigationSections = navigationLinks
    .map(link => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  function setActiveNavigation(section) {
    for (const link of navigationLinks) {
      const isActive = link.hash === `#${section.id}`;
      link.classList.toggle('active', isActive);

      if (isActive) {
        link.setAttribute('aria-current', 'location');
      } else {
        link.removeAttribute('aria-current');
      }
    }
  }

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      const visibleSection = entries
        .filter(entry => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (visibleSection) {
        setActiveNavigation(visibleSection.target);
      }
    }, { threshold: [0.25, 0.5, 0.75] });

    navigationSections.forEach(section => observer.observe(section));
  }

 navigationLinks.forEach(link => {
  link.addEventListener('click', event => {
    const section = document.querySelector(link.hash);

    if (section) {
      event.preventDefault();

      setActiveNavigation(section);

      section.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

const animatedElements = document.querySelectorAll(
  '.info-card, .contact-panel'
);

if ('IntersectionObserver' in window) {
  const animationObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        animationObserver.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.15
  });

  animatedElements.forEach(element => {
    element.classList.add('reveal');
    animationObserver.observe(element);
  });
}