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

  const getVisibleLeash = () => [...document.querySelectorAll('[data-leash-path]')]
    .find((path) => getComputedStyle(path.closest('svg')).display !== 'none');

  const buildLeashGeometry = () => {
    const path = getVisibleLeash();
    const pageShell = document.querySelector('.page-shell');
    if (!path || !pageShell) return;

    const svg = path.closest('svg');
    const pageRect = pageShell.getBoundingClientRect();
    const width = Math.max(1, Math.round(pageRect.width));
    const height = Math.max(1, Math.round(pageShell.offsetHeight));
    const mobile = svg.classList.contains('leash-mobile');
    const side = mobile
      ? Math.max(14, Math.min(30, width * .04))
      : Math.max(36, Math.min(60, width * .042));
    const right = width - side;
    const boundaryGap = mobile ? 12 : 18;
    // Yatay geçişi daha uzun bir dikey aralığa yayarak x eksenindeki hızı düşür.
    const desiredTurnSpan = mobile ? 124 : 180;
    const sections = [...pageShell.children]
      .filter((element) => element.matches('section.section'));
    const getSectionContentBottom = (section) => [...section.children].reduce(
      (bottom, child) => Math.max(bottom, child.getBoundingClientRect().bottom - pageRect.top),
      section.getBoundingClientRect().top - pageRect.top
    );
    const lastSection = sections[sections.length - 1];
    const lastContent = lastSection?.querySelector('.visit-grid') || lastSection;
    const contentBottom = lastContent
      ? lastContent.getBoundingClientRect().bottom - pageRect.top
      : height - boundaryGap;
    const boundaries = sections.slice(0, -1).map((section) => {
      const boundary = section.getBoundingClientRect().bottom - pageRect.top - boundaryGap;
      const safeTurnStart = getSectionContentBottom(section) + (mobile ? 14 : 20);
      const maxSafeSpan = Math.max(36, boundary - safeTurnStart);

      return { boundary, span: Math.min(desiredTurnSpan, maxSafeSpan) };
    });

    let currentX = right;
    let previousY = 30;
    let d = `M ${currentX} ${previousY}`;

    boundaries.forEach(({ boundary, span }, index) => {
      const nextX = index % 2 === 0 ? side : right;
      const turnStart = Math.max(previousY + 70, boundary - span);
      const turnEnd = Math.min(boundary, turnStart + span);
      d += ` L ${currentX} ${turnStart}`;
      d += ` C ${currentX} ${turnStart + span * .45}, ${nextX} ${turnEnd - span * .45}, ${nextX} ${turnEnd}`;
      d += ` L ${nextX} ${boundary}`;
      currentX = nextX;
      previousY = boundary;
    });

    const finalContentGap = mobile ? 24 : 32;
    const desiredFinalSpan = mobile ? 118 : 160;
    const finishTurnStart = Math.max(previousY + 70, contentBottom + finalContentGap);
    const finishY = Math.min(
      height - (mobile ? 20 : 28),
      Math.max(finishTurnStart + desiredFinalSpan + 22, previousY + 120)
    );
    const finishSpan = Math.max(36, Math.min(desiredFinalSpan, finishY - finishTurnStart));
    const finishTurnEnd = Math.min(finishY, finishTurnStart + finishSpan);
    d += ` L ${currentX} ${finishTurnStart}`;
    d += ` C ${currentX} ${finishTurnStart + finishSpan * .45}, ${width / 2} ${finishTurnEnd - finishSpan * .45}, ${width / 2} ${finishTurnEnd}`;
    d += ` L ${width / 2} ${finishY}`;
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    svg.querySelectorAll('.leash-reveal, .leash-cast, .leash-edge, .leash-body, .leash-weave, .leash-stitch')
      .forEach((leashPath) => leashPath.setAttribute('d', d));
  };

  buildLeashGeometry();

  if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
    window.addEventListener('load', buildLeashGeometry);
    window.addEventListener('resize', buildLeashGeometry);
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
        // Yazının tasma kıvrımıyla üst üste gelmesini engellemek için güvenli bir mesafe bırakıyoruz.
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

  const setupLeash = () => {
    buildLeashGeometry();
    const path = getVisibleLeash();
    const clasp = document.querySelector('[data-leash-clasp]');
    if (!path || !clasp) return;

    ScrollTrigger.getById('leash-draw')?.kill();
    const length = path.getTotalLength();
    gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
    gsap.set(clasp, { opacity: 1, xPercent: 0, yPercent: 0 });

    const RING_X = 30;
    const RING_Y = 13;
    const viewBox = path.closest('svg').viewBox.baseVal;
    const firstY = path.getPointAtLength(0).y;
    const lastY = path.getPointAtLength(length).y;
    const getLengthAtY = (targetY) => {
      const clampedY = Math.max(firstY, Math.min(lastY, targetY));
      let low = 0;
      let high = length;

      for (let index = 0; index < 22; index += 1) {
        const middle = (low + high) / 2;
        if (path.getPointAtLength(middle).y < clampedY) low = middle;
        else high = middle;
      }

      return (low + high) / 2;
    };
    const placeClasp = (pathLength) => {
      const svg = path.closest('svg');
      const point = path.getPointAtLength(pathLength);
      const box = svg.getBoundingClientRect();
      const scaleX = box.width / viewBox.width;
      const scaleY = box.height / viewBox.height;
      const verticalProgress = (point.y - firstY) / Math.max(1, lastY - firstY);
      const swing = Math.sin(verticalProgress * Math.PI * 4) * 9;
      gsap.set(clasp, {
        x: point.x * scaleX - RING_X * scaleX,
        y: point.y * scaleY - RING_Y * scaleY,
        rotation: swing
      });
    };

    const updateLeash = (self) => {
      const targetY = firstY + ((lastY - firstY) * self.progress);
      const drawnLength = getLengthAtY(targetY);
      gsap.set(path, { strokeDashoffset: length - drawnLength });
      placeClasp(drawnLength);
    };

    placeClasp(0);
    const leashTrigger = ScrollTrigger.create({
      id: 'leash-draw',
      trigger: '.page-shell',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: updateLeash
    });
    updateLeash(leashTrigger);
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
