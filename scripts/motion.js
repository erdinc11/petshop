(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const storyHeading = document.querySelector('[data-word-reveal]');

  if (storyHeading) {
    const words = storyHeading.textContent.trim().split(/\s+/);
    storyHeading.innerHTML = words.map((word) => `<span class="word">${word}</span>`).join(' ');
  }

  const revealWithoutGsap = () => {
    document.documentElement.classList.add('no-gsap');
    document.querySelectorAll('[data-reveal]').forEach((item) => item.classList.add('is-visible'));
  };

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    revealWithoutGsap();
    return;
  }

  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('motion-ready');

  gsap.from('.site-header', { y: -100, opacity: 0, duration: .85, ease: 'power3.out' });
  gsap.from('.hero-visual', { y: 50, rotate: -2, opacity: 0, duration: 1.15, delay: .15, ease: 'power3.out' });

  document.querySelectorAll('[data-reveal]').forEach((item) => {
    gsap.to(item, {
      y: 0,
      opacity: 1,
      duration: .85,
      ease: 'power3.out',
      scrollTrigger: { trigger: item, start: 'top 88%', once: true }
    });
  });

  const words = gsap.utils.toArray('.word');
  if (words.length) {
    gsap.to(words, {
      opacity: 1,
      stagger: .08,
      ease: 'none',
      scrollTrigger: {
        trigger: storyHeading,
        start: 'top 78%',
        end: 'bottom 38%',
        scrub: .6
      }
    });
  }

  document.querySelectorAll('[data-parallax-image]').forEach((frame) => {
    const image = frame.querySelector('img') || frame;
    gsap.fromTo(image,
      { scale: .9, opacity: .72 },
      {
        scale: 1,
        opacity: 1,
        ease: 'none',
        scrollTrigger: { trigger: frame, start: 'top 92%', end: 'center 55%', scrub: .6 }
      }
    );
  });

  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const section = document.querySelector('.store-story');
    const copy = document.querySelector('[data-pin-copy]');
    const image = section?.querySelector('.store-image');
    if (!section || !copy || !image) return undefined;

    gsap.set(copy, { position: 'relative', top: 'auto' });

    const pin = ScrollTrigger.create({
      trigger: copy,
      start: 'top 120px',
      end: () => {
        // Kırmızı tasma görselin altından yatay olarak geçiyor.
        // Yazının tasma üzerine inip üst üste gelmesini engellemek için,
        // yazının alt kenarının tasma hizasına (görselin altına) ulaşmadan güvenli bir mesafede durmasını sağlıyoruz.
        const safeMargin = 70;
        const maxTravel = (image.offsetTop + image.offsetHeight) - (copy.offsetTop + copy.offsetHeight) - safeMargin;
        return `+=${Math.max(0, maxTravel)}`;
      },
      pin: copy,
      pinSpacing: false,
      invalidateOnRefresh: true
    });

    return () => pin.kill();
  });

  const getVisibleLeash = () => [...document.querySelectorAll('[data-leash-path]')]
    .find((path) => getComputedStyle(path.closest('svg')).display !== 'none');

  const setupLeash = () => {
    const path = getVisibleLeash();
    const clasp = document.querySelector('[data-leash-clasp]');
    if (!path || !clasp) return;

    ScrollTrigger.getById('leash-draw')?.kill();
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(clasp, { opacity: 1, xPercent: 0, yPercent: 0 });

    const RING_X = 30;
    const RING_Y = 13;
    const placeClasp = (progress) => {
      const svg = path.closest('svg');
      const point = path.getPointAtLength(length * progress);
      const box = svg.getBoundingClientRect();
      const viewBox = svg.viewBox.baseVal;
      const scaleX = box.width / viewBox.width;
      const scaleY = box.height / viewBox.height;
      const swing = Math.sin(progress * Math.PI * 4) * 9;
      gsap.set(clasp, {
        x: point.x * scaleX - RING_X * scaleX,
        y: point.y * scaleY - RING_Y * scaleY,
        rotation: swing
      });
    };

    placeClasp(0);
    gsap.to(path, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        id: 'leash-draw',
        trigger: '.page-shell',
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => placeClasp(self.progress)
      }
    });
  };

  setupLeash();
  window.addEventListener('load', () => {
    setupLeash();
    ScrollTrigger.refresh();
  });

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      setupLeash();
      ScrollTrigger.refresh();
    }, 180);
  });
})();
