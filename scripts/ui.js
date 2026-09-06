(() => {
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  const closeMenu = () => {
    if (!menuToggle || !menu) return;
    menuToggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  };

  menuToggle?.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!open));
    menu?.classList.toggle('is-open', !open);
  });

  menu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  const panels = [...document.querySelectorAll('[data-panel]')];
  const activatePanel = (selected) => {
    panels.forEach((panel) => {
      const active = panel === selected;
      panel.classList.toggle('is-active', active);
      panel.querySelector('[data-panel-trigger]')?.setAttribute('aria-expanded', String(active));
    });
  };

  panels.forEach((panel) => {
    const trigger = panel.querySelector('[data-panel-trigger]');
    trigger?.addEventListener('click', () => activatePanel(panel));
    trigger?.addEventListener('mouseenter', () => {
      if (window.matchMedia('(min-width: 821px)').matches) activatePanel(panel);
    });
  });

  const slides = [...document.querySelectorAll('[data-slide]')];
  const carouselViewport = document.querySelector('.testimonial-viewport');
  const currentLabel = document.querySelector('[data-current-slide]');
  let currentSlide = 0;

  const syncCarouselHeight = () => {
    const activeSlide = slides[currentSlide];
    if (!activeSlide || !carouselViewport) return;

    const minHeight = parseFloat(getComputedStyle(carouselViewport).minHeight) || 0;
    const height = Math.max(minHeight, activeSlide.scrollHeight);
    carouselViewport.style.height = `${height}px`;
  };

  const showSlide = (index) => {
    if (!slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const current = slideIndex === currentSlide;
      slide.classList.toggle('is-current', current);
      slide.setAttribute('aria-hidden', String(!current));
    });
    if (currentLabel) currentLabel.textContent = String(currentSlide + 1).padStart(2, '0');
    syncCarouselHeight();
  };

  document.querySelector('[data-carousel-prev]')?.addEventListener('click', () => showSlide(currentSlide - 1));
  document.querySelector('[data-carousel-next]')?.addEventListener('click', () => showSlide(currentSlide + 1));

  syncCarouselHeight();
  window.addEventListener('load', syncCarouselHeight);
  window.addEventListener('resize', syncCarouselHeight);
  document.fonts?.ready.then(syncCarouselHeight);

  if (window.ResizeObserver) {
    const carouselResizeObserver = new ResizeObserver(syncCarouselHeight);
    slides.forEach((slide) => carouselResizeObserver.observe(slide));
  }

  const header = document.querySelector('[data-header]');
  let lastScroll = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    header?.classList.toggle('is-hidden', currentScroll > lastScroll && currentScroll > 220);
    lastScroll = currentScroll;
  }, { passive: true });

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
