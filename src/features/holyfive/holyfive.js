var MOTION = {
  durationFast: 0.2,
  durationNormal: 0.32,
  durationSlow: 0.5,
  durationReveal: 0.6,
  durationRevealLong: 1.1,
  durationMenuOpen: 0.6,
  durationMenuClose: 0.6,
  easeEnter: 'power3.out',
  easeExit: 'power3.in',
  staggerChar: 0.02,
  staggerItem: 0.05,
  staggerMenuLink: 0.08,
  staggerMenuSocial: 0.05,
  staggerMenuClose: 0.03
};

// Ekran ładowania
window.addEventListener('load', function() {
  setTimeout(function() {
      const loadingScreen = document.getElementById('loadingScreen');
      const pageContent = document.getElementById('pageContent');
      
      loadingScreen.classList.add('hidden');
      pageContent.classList.remove('hidden');
      
      // Wymuszenie reflowu i odświeżenie ScrollTrigger po pokazaniu treści (pełna szerokość przy pierwszym wczytaniu)
      void document.body.offsetHeight;
      if (typeof ScrollTrigger !== 'undefined') {
          ScrollTrigger.refresh();
      }
      
      setTimeout(function() {
          loadingScreen.style.display = 'none';
      }, 400);
  }, 1500);
});

// Ukrywanie/pokazywanie headera zależnie od kierunku scrollowania (po wstawieniu partiali)
document.addEventListener('hfLayoutReady', function () {
  const topHeader = document.querySelector('.top-header');
  if (!topHeader) {
      return;
  }

  let lastScrollY = window.scrollY;
  let ticking = false;
  const scrollThreshold = 4;
  const topRevealZone = 120;

  const syncHeaderState = () => {
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;

      if (currentScrollY <= topRevealZone) {
          topHeader.classList.remove('is-scrolled');
          if (currentScrollY <= 0) {
              topHeader.classList.remove('is-hidden');
          } else if (delta > scrollThreshold) {
              topHeader.classList.add('is-hidden');
          } else if (delta < -scrollThreshold) {
              topHeader.classList.remove('is-hidden');
          }
      } else {
          topHeader.classList.add('is-scrolled');
          if (delta > scrollThreshold) {
              topHeader.classList.add('is-hidden');
          } else if (delta < -scrollThreshold) {
              topHeader.classList.remove('is-hidden');
          }
      }

      lastScrollY = currentScrollY;
      ticking = false;
  };

  syncHeaderState();

  window.addEventListener('scroll', function () {
      const currentScrollY = window.scrollY;
      if (currentScrollY <= topRevealZone) {
          syncHeaderState();
          return;
      }
      if (!ticking) {
          window.requestAnimationFrame(syncHeaderState);
          ticking = true;
      }
  }, { passive: true });
});

/* Footer: efekt fizyki socjali (jak CODE(4)), najazd na logo przypina je, reszta spada i odbija (po wstawieniu partiali) */
document.addEventListener('hfLayoutReady', function() {
  var wrap = document.querySelector(".footer-social-physics-wrap");
  var socialBlock = wrap ? wrap.querySelector(".social-icons") : null;
  var links = socialBlock ? Array.prototype.slice.call(socialBlock.querySelectorAll(".menu-social-link")) : [];
  if (!wrap || !links.length || typeof Matter === "undefined" || typeof gsap === "undefined") return;

  var Engine = Matter.Engine, World = Matter.World, Bodies = Matter.Bodies, Body = Matter.Body;
  var engine = null, tagElements = [], tagBodies = [], rafId = null, tagsContainer = null;
  var isHovered = false, tagDropTimer = null, pinnedIndex = -1;
  var pinnedLink = null, pinnedLeaveHandler = null;
  var restoreTimeout = null; /* płynne ponowne pojawianie się przycisków */

  function createTags(pinned) {
    cleanupTags(true);
    pinnedIndex = pinned;

    /* Najpierw odczyt pozycji przy nienaruszonym layoutcie – bez przeskoku */
    var wrapRect = wrap.getBoundingClientRect();
    var cw = wrap.offsetWidth;
    var ch = wrap.offsetHeight;
    if (cw <= 0 || ch <= 0) return;

    var tagSizes = [];
    var linkRects = [];
    for (var i = 0; i < links.length; i++) {
      var r = links[i].getBoundingClientRect();
      tagSizes.push({ width: r.width, height: r.height });
      linkRects.push({
        left: r.left - wrapRect.left,
        top: r.top - wrapRect.top
      });
    }

    /* Wybrana ikona zostaje oryginałem w DOM – tylko powiększenie i kolor, zero przeskoku */
    wrap.classList.add('is-physics-active');
    pinnedLink = links[pinnedIndex];
    pinnedLink.classList.add('social-link-pinned');
    pinnedLeaveHandler = function() {
      isHovered = false;
      if (tagDropTimer) tagDropTimer.kill();
      tagDropTimer = null;
      var visibleClones = tagElements.filter(Boolean);
      if (visibleClones.length) {
        gsap.to(visibleClones, { opacity: 0, duration: 0.25, ease: 'power2.out', onComplete: cleanupTags });
      } else {
        cleanupTags();
      }
    };
    pinnedLink.addEventListener('mouseleave', pinnedLeaveHandler);

    tagsContainer = document.createElement('div');
    tagsContainer.className = 'social-physics-tags-container';
    wrap.appendChild(tagsContainer);

    engine = Engine.create({ gravity: { x: 0, y: 2 } });
    var floorY = ch + 120;
    var floor = Bodies.rectangle(cw / 2, floorY, cw * 3, 30, { isStatic: true });
    World.add(engine.world, floor);

    var fallDelayIndex = 0;
    for (var j = 0; j < links.length; j++) {
      if (j === pinnedIndex) {
        tagElements.push(null);
        tagBodies.push(null);
        continue;
      }
      var linkClone = links[j].cloneNode(true);
      linkClone.classList.add('social-physics-tag');
      linkClone.setAttribute('aria-hidden', 'true');
      tagsContainer.appendChild(linkClone);

      var tw = tagSizes[j].width;
      var th = tagSizes[j].height;
      var startX = linkRects[j].left + tw / 2;
      var startY = linkRects[j].top + th / 2;
      var angle = (Math.random() - 0.5) * 0.4;
      var body = Bodies.rectangle(startX, startY, tw, th, {
        chamfer: { radius: Math.min(tw, th) / 2 },
        restitution: 0.15,
        friction: 0.6,
        density: 0.002
      });
      Body.setAngle(body, angle);
      World.add(engine.world, body);
      tagElements.push(linkClone);
      tagBodies.push(body);

      gsap.to(linkClone, {
        opacity: 1,
        duration: 0.3,
        delay: fallDelayIndex++ * 0.04,
        ease: 'power2.out'
      });
    }

    function update() {
      if (!engine) return;
      Engine.update(engine, 1000 / 60);
      for (var k = 0; k < tagElements.length; k++) {
        var el = tagElements[k];
        if (!el) continue;
        var body = tagBodies[k];
        var w = tagSizes[k].width;
        var h = tagSizes[k].height;
        var startY = linkRects[k].top + h / 2;
        var fallDistance = Math.max(0, body.position.y - startY);
        var scale = Math.max(0.5, 1 - fallDistance * 0.0015);
        el.style.transform = 'translate(' + (body.position.x - w / 2) + 'px, ' + (body.position.y - h / 2) + 'px) rotate(' + body.angle + 'rad) scale(' + scale + ')';
      }
      rafId = requestAnimationFrame(update);
    }
    rafId = requestAnimationFrame(update);
  }

  function finishRestore() {
    if (restoreTimeout) clearTimeout(restoreTimeout);
    restoreTimeout = null;
    wrap.classList.remove('is-physics-restoring', 'is-physics-restored');
    if (pinnedLink && pinnedLeaveHandler) {
      pinnedLink.classList.remove('social-link-pinned');
      pinnedLink.removeEventListener('mouseleave', pinnedLeaveHandler);
      pinnedLink = null;
      pinnedLeaveHandler = null;
    }
  }

  function cleanupTags(immediate) {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (engine) {
      Engine.clear(engine);
      engine = null;
    }
    if (tagsContainer) {
      tagsContainer.remove();
      tagsContainer = null;
    }
    tagElements = [];
    tagBodies = [];
    if (restoreTimeout) clearTimeout(restoreTimeout);
    restoreTimeout = null;
    if (immediate) {
      finishRestore();
      wrap.classList.remove('is-physics-active');
      return;
    }
    if (!wrap.classList.contains('is-physics-active')) return;
    wrap.classList.add('is-physics-restoring');
    wrap.classList.remove('is-physics-active');
    requestAnimationFrame(function() {
      wrap.classList.add('is-physics-restored');
      restoreTimeout = setTimeout(finishRestore, 380);
    });
  }

  links.forEach(function(link, index) {
    link.addEventListener('mouseenter', function() {
      isHovered = true;
      if (tagDropTimer) tagDropTimer.kill();
      tagDropTimer = gsap.delayedCall(0.45, function() {
        if (isHovered) createTags(index);
      });
    });
    link.addEventListener('mouseleave', function() {
      if (tagDropTimer) tagDropTimer.kill();
      tagDropTimer = null;
    });
  });

  wrap.addEventListener('mouseleave', function() {
    isHovered = false;
    if (tagDropTimer) tagDropTimer.kill();
    tagDropTimer = null;
    var visibleClones = tagElements.filter(Boolean);
    if (visibleClones.length) {
      gsap.to(visibleClones, {
        opacity: 0,
        duration: 0.25,
        ease: 'power2.out',
        onComplete: cleanupTags
      });
    } else {
      cleanupTags();
    }
  });
});

/* Płynna interpolacja tła body przy scrollu (sekcje z data-section-bg). Na stronie głównej z Perlin fullpage – stałe tło #0f0f0f. */
document.addEventListener('DOMContentLoaded', function() {
  import('/shared/scripts/sketch-frame-init.js').catch(function () {});
  var body = document.body;
  if (document.getElementById('home-perlin-canvas')) {
    body.style.backgroundColor = '#0f0f0f';
    return;
  }
  var sections = document.querySelectorAll('[data-section-bg]');
  if (!sections.length) return;
  function updateBodyBg() {
    var vh = window.innerHeight;
    var best = null;
    var bestArea = 0;
    for (var i = 0; i < sections.length; i++) {
      var r = sections[i].getBoundingClientRect();
      var visibleTop = Math.max(0, r.top);
      var visibleBottom = Math.min(vh, r.bottom);
      var area = Math.max(0, visibleBottom - visibleTop) * Math.max(0, Math.min(r.width, window.innerWidth));
      if (area > bestArea) {
        bestArea = area;
        best = sections[i];
      }
    }
    if (best && best.dataset.sectionBg) {
      body.style.backgroundColor = best.dataset.sectionBg;
    }
  }
  updateBodyBg();
  window.addEventListener('scroll', function() { requestAnimationFrame(updateBodyBg); }, { passive: true });
  window.addEventListener('resize', updateBodyBg);
});

// Przyciemnienie wideo Nuke jest sterowane w onUpdate pinu hero (gdy karty wjeżdżają i wyjeżdżają)

// Obsługa wideo w stopce (hfhw) – po wstawieniu partiali
document.addEventListener('hfLayoutReady', function() {
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);
    var isMainPage = !!document.querySelector('.hf-home-v2__hero');
    if (isMainPage && typeof Lenis !== 'undefined') {
      function initLenis() {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        if (typeof history !== 'undefined' && history.scrollRestoration !== undefined) {
          history.scrollRestoration = 'manual';
        }
        if (typeof window.group221HolyfiveLenisInstance !== 'undefined' && window.group221HolyfiveLenisInstance != null && typeof window.group221HolyfiveLenisInstance.destroy === 'function') {
          window.group221HolyfiveLenisInstance.destroy();
          window.group221HolyfiveLenisInstance = null;
        }
        var lenis = new Lenis();
        window.group221HolyfiveLenisInstance = lenis;
        lenis.scrollTo(0, { immediate: true });
        if (typeof lenis.resize === 'function') {
          lenis.resize();
        }
        lenis.on('scroll', ScrollTrigger.update);
        gsap.ticker.add(function(time) {
          lenis.raf(time * 1000);
        });
        gsap.ticker.lagSmoothing(0);
        requestAnimationFrame(function() {
          if (typeof ScrollTrigger !== 'undefined') ScrollTrigger.refresh();
        });
      }
      requestAnimationFrame(function() {
        requestAnimationFrame(initLenis);
      });
    } else {
      window.addEventListener('scroll', function() { ScrollTrigger.update(); }, { passive: true });
    }
  }

  var heroGallery = document.querySelector('.hf-home-v2__hero-gallery');
  var heroHeading = document.querySelector('.hf-home-v2__hero-heading');
  var heroSection = document.querySelector('.hf-home-v2__hero');
  var heroMottoWrapper = document.querySelector('.hf-hero-motto-wrapper');
  var pinTrigger = heroMottoWrapper || heroSection;
  if (heroGallery && heroHeading && heroSection && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    /** Rozbija zawartość nagłówka na słowa (span.hf-hero-word), zachowuje <br>. Używane do efektu Smudged Text. */
    function splitHeroHeadingIntoWords(el) {
      var fragment = document.createDocumentFragment();
      var childNodes = Array.prototype.slice.call(el.childNodes);
      el.innerHTML = '';
      for (var i = 0; i < childNodes.length; i++) {
        var node = childNodes[i];
        if (node.nodeType === 3) {
          var text = node.textContent;
          var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
          for (var j = 0; j < words.length; j++) {
            var span = document.createElement('span');
            span.className = 'hf-hero-word';
            span.textContent = words[j];
            fragment.appendChild(span);
            if (j < words.length - 1) fragment.appendChild(document.createTextNode(' '));
          }
        } else if (node.nodeType === 1 && node.tagName === 'BR') {
          fragment.appendChild(node.cloneNode(true));
        }
      }
      el.appendChild(fragment);
      return el.querySelectorAll('.hf-hero-word');
    }
    /** Ustawia treść nagłówka (opcjonalnie), rozbija na słowa i odtwarza animację smudged (blur → wyostrzenie). */
    function applySmudgedHeading(el, htmlOptional, onComplete) {
      if (htmlOptional !== undefined) el.innerHTML = htmlOptional;
      el.classList.add('hf-home-v2__hero-heading--smudged');
      var words = splitHeroHeadingIntoWords(el);
      if (words.length) {
        gsap.killTweensOf(words);
        gsap.set(words, { filter: 'blur(75px)', opacity: 0 });
        gsap.to(words, { filter: 'blur(0px)', opacity: 1, duration: MOTION.durationRevealLong, ease: MOTION.easeEnter, overwrite: true, onComplete: onComplete || null });
      }
    }
    window.applySmudgedHeading = applySmudgedHeading;

    var initialHeadingText = heroHeading.dataset.defaultText || heroHeading.textContent || 'Witajcie zwycięzcy';
    var initialCircleText = heroHeading.dataset.circleText || 'Nuke.<br>bezdyskusyjny wybór Holy Five';
    var HERO_CONFIG = {
      cardCount: 8,
      maxCardWidth: 0.4,
      maxCardHeight: 0.5,
      cardScale: 0.5,
      circleRadiusRatio: 0.38,
      /** Środek okręgu kart – 0.38 = 38% szerokości ekranu (bliżej lewej krawędzi) */
      circleCenterXRatio: 0.38,
      scrollLength: 2.5,
      heading: initialHeadingText,
      headingCircle: initialCircleText,
      /** Próg progress (0–1): pierwszy napis znika, Nuke pojawia się (ta sama chwila) */
      headingSwitchThreshold: 0.4,
      /** Progress (0–1), do którego pierwszy napis jest w pełni widoczny; potem zanika (krótszy zakres = mniejsza przerwa) */
      firstTextFadeStart: 0.28,
      /** Progress (0–1), od którego Nuke w strefie środkowej jest w pełni widoczny; przy cofaniu scrolla poniżej – animacja chowania */
      nukeFadeStart: 0.56,
      /** Indeks obrazu T-spawn (terror respawn) – wlatuje z lewej obok hangaru */
      tSpawnImageIndex: 6,
      /** Indeks karty, która wlatuje z prawej (zamiast z dołu) */
      flyInFromRightIndex: 2,
      /** Indeksy kart, które wylatują z prawej (zamiast z góry/dół) – jedna z góry, jedna z dołu */
      exitFromRightIndices: [4, 5],
      /** Dodatkowe przesunięcie Y końcowej pozycji (px) – karta Outside (indeks 3) żeby nie wystawała */
      endOffsetY: { 3: 200 }
    };
    var NUKE_IMAGES = [
      'CS2_Nuke_A_site.webp',
      'CS2_Nuke_A_site2.webp',
      'CS2_Nuke_B_site.webp',
      'CS2_Nuke_Outside.webp',
      'CS2_Nuke_Ramp.webp',
      'CS2_Nuke_Ramp2.webp',
      'CS2_Nuke_T_spawn.webp',
      'CS2_Nuke_Tunnel.webp'
    ];
    var viewport = {
      centerX: window.innerWidth * 0.38,
      centerY: window.innerHeight / 2
    };
    /* Kąty na okręgu: indeks 6=T-spawn – niżej (90°=dół, 180°=lewo) */
    var circleAngles = [0, 52, 118, 195, 248, 301, 160, 380];
    var heroCards = [];

    function updateViewport() {
      viewport.centerX = window.innerWidth * HERO_CONFIG.circleCenterXRatio;
      viewport.centerY = window.innerHeight / 2;
    }

    function positionOnCircle(index) {
      var R = Math.min(window.innerWidth, window.innerHeight) * HERO_CONFIG.circleRadiusRatio;
      var deg = circleAngles[index] !== undefined ? circleAngles[index] : (index / HERO_CONFIG.cardCount) * 360;
      var rad = (deg * Math.PI) / 180;
      return {
        x: viewport.centerX + R * Math.cos(rad),
        y: viewport.centerY + R * Math.sin(rad)
      };
    }

    function getEdgePosition(centerX, centerY, cardW, cardH, forceEdge) {
      var distances = { left: centerX, right: window.innerWidth - centerX, top: centerY, bottom: window.innerHeight - centerY };
      var halfW = (cardW * HERO_CONFIG.cardScale) / 2;
      var halfH = (cardH * HERO_CONFIG.cardScale) / 2;
      var rnd = function () { return (Math.random() - 0.5) * 200; };
      var x, y;
      if (forceEdge === 'left') {
        x = -cardW - 60 + rnd();
        y = viewport.centerY - halfH + rnd();
      } else if (forceEdge === 'right') {
        x = window.innerWidth + 40 + rnd();
        y = viewport.centerY - halfH + rnd();
      } else if (forceEdge === 'top') {
        x = viewport.centerX - halfW + rnd();
        y = -cardH - 100 + rnd();
      } else if (forceEdge === 'bottom') {
        x = viewport.centerX - halfW + rnd();
        y = window.innerHeight + 40 + rnd();
      } else {
        var minD = Math.min(distances.left, distances.right, distances.top, distances.bottom);
        if (minD === distances.left) { x = -cardW - 60 + rnd(); y = viewport.centerY - halfH + rnd(); }
        else if (minD === distances.right) { x = window.innerWidth + 40 + rnd(); y = viewport.centerY - halfH + rnd(); }
        else if (minD === distances.top) { x = viewport.centerX - halfW + rnd(); y = -cardH - 100 + rnd(); }
        else { x = viewport.centerX - halfW + rnd(); y = window.innerHeight + 40 + rnd(); }
      }
      return { x: x, y: y };
    }

    function createCards() {
      return new Promise(function (resolve) {
        var cards = [];
        var pending = HERO_CONFIG.cardCount;
        function onCardReady() {
          pending--;
          if (pending !== 0) return;
          updateViewport();
          var result = [];
          cards.forEach(function (card, i) {
            var img = card.querySelector('img');
            var w = img.naturalWidth;
            var h = img.naturalHeight;
            if (w && h) {
              var maxW = window.innerWidth * HERO_CONFIG.maxCardWidth;
              var maxH = window.innerHeight * HERO_CONFIG.maxCardHeight;
              if (w > maxW || h > maxH) {
                var scale = Math.min(maxW / w, maxH / h);
                w = Math.round(w * scale);
                h = Math.round(h * scale);
              }
              card.style.width = w + 'px';
              card.style.height = h + 'px';
            } else {
              card.style.width = '280px';
              card.style.height = '210px';
              w = 280;
              h = 210;
            }
            var circlePos = positionOnCircle(i);
            var edgeStart = getEdgePosition(circlePos.x, circlePos.y, w, h, i === HERO_CONFIG.tSpawnImageIndex ? 'left' : (i === HERO_CONFIG.flyInFromRightIndex ? 'right' : undefined));
            var mirrorX = viewport.centerX - (circlePos.x - viewport.centerX);
            var mirrorY = viewport.centerY - (circlePos.y - viewport.centerY);
            var forceExitRight = HERO_CONFIG.exitFromRightIndices && HERO_CONFIG.exitFromRightIndices.indexOf(i) !== -1;
            var edgeEnd = getEdgePosition(mirrorX, mirrorY, w, h, forceExitRight ? 'right' : undefined);
            var endOffsetY = HERO_CONFIG.endOffsetY && HERO_CONFIG.endOffsetY[i];
            if (endOffsetY != null) { edgeEnd = { x: edgeEnd.x, y: edgeEnd.y + endOffsetY }; }
            var halfW = (w * HERO_CONFIG.cardScale) / 2;
            var halfH = (h * HERO_CONFIG.cardScale) / 2;
            var circleLeft = circlePos.x - halfW;
            var circleTop = circlePos.y - halfH;
            gsap.set(card, {
              left: edgeStart.x,
              top: edgeStart.y,
              scale: HERO_CONFIG.cardScale,
              rotation: (Math.random() - 0.5) * 40,
              transformOrigin: 'center center'
            });
            result.push({
              element: card,
              width: w,
              height: h,
              edgeStartX: edgeStart.x,
              edgeStartY: edgeStart.y,
              edgeEndX: edgeEnd.x,
              edgeEndY: edgeEnd.y,
              circleLeft: circleLeft,
              circleTop: circleTop,
              circleRotation: (Math.random() - 0.5) * 24
            });
          });
          resolve(result);
        }
        for (var i = 0; i < HERO_CONFIG.cardCount; i++) {
          var card = document.createElement('div');
          card.className = 'hero-card';
          var img = document.createElement('img');
          img.src = NUKE_IMAGES[i];
          img.alt = 'Nuke map';
          img.loading = 'eager';
          img.onload = onCardReady;
          img.onerror = onCardReady;
          card.appendChild(img);
          heroGallery.appendChild(card);
          cards.push(card);
        }
      });
    }

    function updateCardsProgress(progress) {
      heroCards.forEach(function (item) {
        var tIn = Math.max(0, Math.min(1, progress / 0.5));
        var tOut = Math.max(0, Math.min(1, (progress - 0.5) / 0.5));
        var x, y, rot;
        if (progress <= 0.5) {
          x = item.edgeStartX + (item.circleLeft - item.edgeStartX) * tIn;
          y = item.edgeStartY + (item.circleTop - item.edgeStartY) * tIn;
          rot = item.circleRotation * tIn;
        } else {
          x = item.circleLeft + (item.edgeEndX - item.circleLeft) * tOut;
          y = item.circleTop + (item.edgeEndY - item.circleTop) * tOut;
          rot = item.circleRotation + 60 * tOut;
        }
        gsap.set(item.element, { left: x, top: y, rotation: rot });
      });
    }

    function getHeroDefaultText() {
      return heroHeading.dataset.defaultText || HERO_CONFIG.heading;
    }

    function getHeroCircleText() {
      return heroHeading.dataset.circleText || HERO_CONFIG.headingCircle;
    }

    var threshold = HERO_CONFIG.headingSwitchThreshold ?? 0.4;
    var firstTextFadeStart = HERO_CONFIG.firstTextFadeStart ?? 0.28;
    var nukeFadeStart = HERO_CONFIG.nukeFadeStart ?? 0.56;
    var wasAboveHeadingThreshold = false;
    var initialAppearDone = false;
    var nukeAppearDone = false;
    var lastCardsProgress = 0;

    document.fonts.ready.then(function () {
      heroHeading.innerHTML = getHeroDefaultText();
      heroHeading.classList.add('hf-home-v2__hero-heading--smudged');
      splitHeroHeadingIntoWords(heroHeading);
      gsap.set(heroHeading, { opacity: 1 });
      var words = heroHeading.querySelectorAll('.hf-hero-word');
      if (words.length) gsap.set(words, { filter: 'blur(75px)', opacity: 0 });
      function runFirstTextAppear() {
        setTimeout(function () {
          if (heroHeading.querySelectorAll('.hf-hero-word').length && !wasAboveHeadingThreshold) {
            var w = heroHeading.querySelectorAll('.hf-hero-word');
            gsap.killTweensOf(w);
            gsap.to(w, { filter: 'blur(0px)', opacity: 1, duration: MOTION.durationRevealLong, ease: MOTION.easeEnter, overwrite: true, onComplete: function () { initialAppearDone = true; } });
          }
        }, 1800);
      }
      if (document.readyState === 'complete') runFirstTextAppear();
      else window.addEventListener('load', runFirstTextAppear);
    });

    createCards().then(function (cards) {
      heroCards = cards;
      var vh = window.innerHeight;
      var totalPinLength = vh * HERO_CONFIG.scrollLength;
      var cardsPhaseRatio = 1;
      var lastCardsProgressUpdate = -1;
      var cardsProgressStep = 0.008;
      ScrollTrigger.create({
        trigger: pinTrigger,
        start: 'top top',
        end: function () { return '+=' + totalPinLength; },
        pin: true,
        scrub: 1,
        refreshPriority: 1,
        onUpdate: function (self) {
          var cardsProgress = Math.min(1, self.progress / cardsPhaseRatio);
          var scrollDown = cardsProgress >= lastCardsProgress;
          lastCardsProgress = cardsProgress;
          var pRounded = Math.round(cardsProgress / cardsProgressStep) * cardsProgressStep;
          /* Zawsze aktualizuj pozycję kart, żeby wchodziły płynnie (bez skoków co krok) */
          updateCardsProgress(cardsProgress);
          if (pRounded !== lastCardsProgressUpdate) {
            lastCardsProgressUpdate = pRounded;
          }
          var viewportProgress = 0;
          var cardsScreenEl = document.querySelector('.hf-home-v2__cards-screen');
          if (cardsScreenEl) {
            var rect = cardsScreenEl.getBoundingClientRect();
            var vh = window.innerHeight;
            viewportProgress = rect.top >= vh ? 0 : rect.top <= 0 ? 1 : 1 - rect.top / vh;
            viewportProgress = Math.max(0, Math.min(1, viewportProgress));
          } else {
            viewportProgress = cardsProgress;
          }
          /* Podczas pinu hero cards-screen jest poniżej viewportu, więc viewportProgress=0 – używamy cardsProgress jako fallback, żeby Nuke pojawiał się w trakcie scrollu hero */
          var above = viewportProgress >= threshold || cardsProgress >= threshold;

          /* Wideo Nuke: 100% opacity dopóki nie ma napisu „Nuke the undisputed…”; gdy napis jest (above), tylko opacity wideo spada – bez czarnego overlayu, prześwieca taktyczne tło Perlin */
          var videoOpacity;
          if (!above) {
            videoOpacity = 1;
          } else {
            var nukeRevealRange = Math.max(0.01, 1 - threshold);
            var nukeRevealProgress = Math.max(0, Math.min(1, (cardsProgress - threshold) / nukeRevealRange));
            videoOpacity = 1 - nukeRevealProgress;
          }
          heroSection.style.setProperty('--hero-video-opacity', Math.max(0, videoOpacity).toFixed(3));
          heroSection.style.setProperty('--hero-overlay-opacity', '0');

          if (above) {
            if (!wasAboveHeadingThreshold) {
              wasAboveHeadingThreshold = true;
              nukeAppearDone = false;
              applySmudgedHeading(heroHeading, getHeroCircleText(), function () { nukeAppearDone = true; });
            }
            gsap.set(heroHeading, { opacity: 1 });
            if (nukeAppearDone) {
              var wordsNuke = heroHeading.querySelectorAll('.hf-hero-word');
              if (wordsNuke.length) {
                var t2;
                if (cardsProgress <= nukeFadeStart) {
                  if (!scrollDown) {
                    var riseRange = nukeFadeStart - threshold;
                    t2 = riseRange > 0 ? (cardsProgress - threshold) / riseRange : 0;
                    t2 = Math.max(0, Math.min(1, t2));
                    gsap.set(wordsNuke, {
                      filter: 'blur(' + (75 * (1 - t2)) + 'px)',
                      opacity: t2
                    });
                  }
                } else {
                  gsap.set(wordsNuke, { filter: 'blur(0px)', opacity: 1 });
                }
              }
            }
          } else {
            if (wasAboveHeadingThreshold) {
              wasAboveHeadingThreshold = false;
              nukeAppearDone = false;
              initialAppearDone = false;
              heroHeading.innerHTML = getHeroDefaultText();
              heroHeading.classList.add('hf-home-v2__hero-heading--smudged');
              var wordsReturn = splitHeroHeadingIntoWords(heroHeading);
              if (wordsReturn.length) {
                gsap.killTweensOf(wordsReturn);
                gsap.set(wordsReturn, { filter: 'blur(75px)', opacity: 0 });
                gsap.to(wordsReturn, { filter: 'blur(0px)', opacity: 1, duration: MOTION.durationRevealLong, ease: MOTION.easeEnter, overwrite: true, onComplete: function () { initialAppearDone = true; } });
              } else {
                initialAppearDone = true;
              }
            }
            gsap.set(heroHeading, { opacity: 1 });
            if (initialAppearDone) {
              var words = heroHeading.querySelectorAll('.hf-hero-word');
              if (words.length) {
                var fadeRange = threshold - firstTextFadeStart;
                var t = cardsProgress <= firstTextFadeStart ? 0 : (fadeRange > 0 ? Math.max(0, Math.min(1, (cardsProgress - firstTextFadeStart) / fadeRange)) : 0);
                gsap.set(words, {
                  filter: 'blur(' + (75 * t) + 'px)',
                  opacity: Math.max(0, 1 - t)
                });
              }
            }
          }
        }
      });
      ScrollTrigger.refresh();
      if (typeof window.initCardsScreenScrollTrigger === 'function') {
        window.initCardsScreenScrollTrigger();
      }
    });

    window.addEventListener('resize', function () {
      if (heroCards.length === 0) return;
      updateViewport();
      heroCards.forEach(function (item, i) {
        var circlePos = positionOnCircle(i);
        var halfW = (item.width * HERO_CONFIG.cardScale) / 2;
        var halfH = (item.height * HERO_CONFIG.cardScale) / 2;
        item.circleLeft = circlePos.x - halfW;
        item.circleTop = circlePos.y - halfH;
        var mirrorX = viewport.centerX - (circlePos.x - viewport.centerX);
        var mirrorY = viewport.centerY - (circlePos.y - viewport.centerY);
        var forceExitRight = HERO_CONFIG.exitFromRightIndices && HERO_CONFIG.exitFromRightIndices.indexOf(i) !== -1;
        var edge = getEdgePosition(mirrorX, mirrorY, item.width, item.height, forceExitRight ? 'right' : undefined);
        var endOffsetY = HERO_CONFIG.endOffsetY && HERO_CONFIG.endOffsetY[i];
        if (endOffsetY != null) { edge = { x: edge.x, y: edge.y + endOffsetY }; }
        item.edgeEndX = edge.x;
        item.edgeEndY = edge.y;
        edge = getEdgePosition(circlePos.x, circlePos.y, item.width, item.height, i === HERO_CONFIG.tSpawnImageIndex ? 'left' : (i === HERO_CONFIG.flyInFromRightIndex ? 'right' : undefined));
        item.edgeStartX = edge.x;
        item.edgeStartY = edge.y;
      });
      ScrollTrigger.refresh();
    });
  }

  /* Sekcja motto-band: animacja clip-path i reveal napisu (wzorzec z clayboan, bez SplitText) */
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    var mottoItems = gsap.utils.toArray('.hf-home-v2__motto-band .hf-item');
    if (mottoItems.length) {
      gsap.registerPlugin(ScrollTrigger);

      mottoItems.forEach(function (item, itemIndex) {
        var img = item.querySelector('.hf-item-img');
        var nameWrap = item.querySelector('.hf-item-name');
        var nameH1 = item.querySelector('.hf-item-name h1');

        // Clip-path wejście i wyjście (jak w clayboan)
        if (img) {
          ScrollTrigger.create({
            trigger: item,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.5,
            animation: gsap.fromTo(
              img,
              { clipPath: 'polygon(25% 25%, 75% 40%, 100% 100%, 0% 100%)' },
              { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)', ease: 'none' }
            )
          });

          ScrollTrigger.create({
            trigger: item,
            start: 'bottom bottom',
            end: 'bottom top',
            scrub: 0.5,
            animation: gsap.fromTo(
              img,
              { clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' },
              { clipPath: 'polygon(0% 0%, 100% 0%, 75% 60%, 25% 75%)', ease: 'none' }
            )
          });
        }

        // Napis w lewym górnym rogu karty – pozycja zależna od viewportu (0 = z paddingiem), kąt w zgodzie z clip-path
        if (nameWrap) {
          gsap.set(nameWrap, { transformOrigin: 'top left' });
          ScrollTrigger.create({
            trigger: item,
            start: 'top bottom',
            end: 'top top',
            scrub: 0.5,
            animation: gsap.fromTo(
              nameWrap,
              { top: '25%', left: '25%', rotation: 10 },
              { top: 0, left: 0, rotation: 0, ease: 'none' }
            )
          });
          if (!nameWrap.classList.contains('hf-item-name--overlay')) {
            ScrollTrigger.create({
              trigger: item,
              start: 'bottom bottom',
              end: 'bottom top',
              scrub: 0.5,
              animation: gsap.fromTo(
                nameWrap,
                { top: 0, left: 0, rotation: 0 },
                { top: '25%', left: '25%', rotation: -14, ease: 'none' }
              )
            });
          }
        }

        // Reveal liter nagłówka – prosty split na znaki (pomijamy pierwszy .hf-item – tam jest js-scroll-reveal-copy z osobną animacją)
        if (nameH1 && !nameH1.classList.contains('js-scroll-reveal-copy')) {
          var originalText = nameH1.textContent || '';
          var chars = originalText.split('');
          nameH1.textContent = '';

          var spanChars = chars.map(function (ch) {
            if (ch === '\n') {
              var br = document.createElement('br');
              nameH1.appendChild(br);
              return null;
            }
            var span = document.createElement('span');
            span.className = 'hf-motto-char';
            span.textContent = ch;
            nameH1.appendChild(span);
            return span;
          }).filter(Boolean);

          gsap.set(spanChars, { y: '125%' });

          spanChars.forEach(function (charEl, charIndex) {
            ScrollTrigger.create({
              trigger: item,
              start: 'top+=' + (charIndex * 25 - 250) + ' top',
              end: 'top+=' + (charIndex * 25 - 100) + ' top',
              scrub: 1,
              animation: gsap.fromTo(
                charEl,
                { y: '125%' },
                { y: '0%', ease: 'none' }
              )
            });
          });
        }
      });

      /* z-index stały: napis nad bizonem (CSS .hf-item-name--overlay 30, .hf-item-img--bizon 20), bez animacji */

      ScrollTrigger.refresh();
    }
  }

  const video = document.getElementById('hfhw');
  if (video) {
      const footer = video.closest('footer');
      video.muted = true;
      video.setAttribute('playsinline', '');
      video.loop = false;

      var wrapper = video.parentElement;
      if (!wrapper || !wrapper.classList.contains('footer-video-wrapper')) {
          wrapper = document.createElement('div');
          wrapper.className = 'footer-video-wrapper';
          var parent = video.parentNode;
          parent.insertBefore(wrapper, video);
          wrapper.appendChild(video);
      }

      function tryStartVideo() {
          if (!footer) return;
          var rect = footer.getBoundingClientRect();
          var h = window.innerHeight || document.documentElement.clientHeight;
          var footerInView = rect.bottom > 0 && rect.top < h;
          if (footerInView && video.paused && video.readyState >= 2) {
              video.playbackRate = 1;
              video.play().catch(function () {});
          }
      }

      video.addEventListener('ended', function () {
          if (video.playbackRate >= 0) {
              video.playbackRate = -1;
              video.play().catch(function () {});
          }
      });

      video.addEventListener('timeupdate', function () {
          if (video.playbackRate < 0 && video.currentTime <= 0) {
              video.pause();
              video.currentTime = 0;
              video.playbackRate = 1;
              video.play().catch(function () {});
          }
      });

      if (footer) {
          var observer = new IntersectionObserver(function (entries) {
              entries.forEach(function (entry) {
                  if (entry.isIntersecting) {
                      tryStartVideo();
                  } else {
                      video.pause();
                      video.currentTime = 0;
                  }
              });
          }, { threshold: 0.05 });
          observer.observe(footer);
      }

      var tryStartThrottleMs = 120;
      var tryStartLast = 0;
      var tryStartScheduled = null;
      function tryStartThrottled() {
          if (video.paused && video.readyState >= 2) {
              var now = performance.now();
              if (now - tryStartLast >= tryStartThrottleMs) {
                  tryStartLast = now;
                  tryStartVideo();
              } else if (!tryStartScheduled) {
                  tryStartScheduled = setTimeout(function () {
                      tryStartScheduled = null;
                      tryStartLast = performance.now();
                      tryStartVideo();
                  }, tryStartThrottleMs - (now - tryStartLast));
              }
          }
      }
      window.addEventListener('scroll', tryStartThrottled, { passive: true });
      window.addEventListener('resize', tryStartThrottled);
      video.addEventListener('canplay', tryStartVideo);
      tryStartVideo();
  }

  const homeStepCards = document.querySelectorAll('.hf-home-step-card');
  if (homeStepCards.length > 0) {
      const cardsObserver = new IntersectionObserver((entries, obs) => {
          entries.forEach((entry) => {
              if (!entry.isIntersecting) {
                  return;
              }

              const card = entry.target;
              const index = Array.from(homeStepCards).indexOf(card);
              card.style.transitionDelay = `${Math.max(index, 0) * (MOTION.staggerItem * 1000)}ms`;
              card.classList.add('is-revealed');
              obs.unobserve(card);
          });
      }, { threshold: 0.2 });

      homeStepCards.forEach((card) => cardsObserver.observe(card));
  }

  // Inicjalizacja karuzeli dla strony zawodników
  const carousel = document.querySelector('.players-carousel');
  if (carousel) {
      initCarousel(carousel);
  }

  // ScrollTrigger: scroll-controlled reveal dla sekcji Filary Holy Five (uruchamiane po hero, żeby pin-spacer był w DOM)
  const cardsScreenSection = document.querySelector('.hf-home-v2__cards-screen');
  if (cardsScreenSection && typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
      gsap.registerPlugin(ScrollTrigger);

      const cardSlots = gsap.utils.toArray('.hf-home-v2__cards-screen .hf-home-v2__card-slot');
      const cardElements = gsap.utils.toArray('.hf-home-v2__cards-screen .hf-home-v2__card');

      let cardPlaceholderEntrance = null;
      let cardSlideInAnimation = null;
      let resizeTimer = null;

      function initCardsScreenAnimations() {
          if (window.innerWidth < 1000) {
              if (cardPlaceholderEntrance) {
                  cardPlaceholderEntrance.kill();
                  cardPlaceholderEntrance = null;
              }
              if (cardSlideInAnimation) {
                  cardSlideInAnimation.kill();
                  cardSlideInAnimation = null;
              }
              cardSlots.forEach(function (slot) {
                  gsap.set(slot, { clearProps: 'all' });
                  const initialEl = slot.querySelector('.hf-home-v2__card-initial h2');
                  if (initialEl) gsap.set(initialEl, { clearProps: 'all' });
              });
              cardElements.forEach(function (card) {
                  gsap.set(card, { clearProps: 'all' });
              });
              return;
          }

          cardSlots.forEach(function (slot) {
              gsap.set(slot, { clearProps: 'all' });
              const initialEl = slot.querySelector('.hf-home-v2__card-initial h2');
              if (initialEl) gsap.set(initialEl, { clearProps: 'all' });
          });
          cardElements.forEach(function (card) {
              gsap.set(card, { clearProps: 'all' });
          });

          if (cardPlaceholderEntrance) {
              cardPlaceholderEntrance.kill();
              cardPlaceholderEntrance = null;
          }
          if (cardSlideInAnimation) {
              cardSlideInAnimation.kill();
              cardSlideInAnimation = null;
          }

          gsap.set(cardSlots, { y: '125%' });
          cardSlots.forEach(function (slot) {
              const initialEl = slot.querySelector('.hf-home-v2__card-initial h2');
              if (initialEl) gsap.set(initialEl, { scale: 0 });
          });

          cardElements.forEach(function (card, index) {
              const cardInitialX = 300 - index * 100;
              gsap.set(card, {
                  xPercent: cardInitialX,
                  yPercent: -50,
                  rotation: 20,
                  scale: 0.75
              });
          });

          cardPlaceholderEntrance = ScrollTrigger.create({
              trigger: cardsScreenSection,
              start: 'top bottom',
              end: 'top top',
              scrub: 1,
              refreshPriority: 0,
              onUpdate: function (self) {
                  const progress = self.progress;
                  const entranceDelay = 0.15;
                  const entranceDuration = 0.7;

                  cardSlots.forEach(function (member, index) {
                      const entranceStart = index * entranceDelay;
                      const entranceEnd = entranceStart + entranceDuration;
                      const teamMemberInitial = member.querySelector('.hf-home-v2__card-initial h2');

                      if (progress >= entranceStart && progress <= entranceEnd) {
                          const memberEntranceProgress = (progress - entranceStart) / entranceDuration;
                          const entranceY = 125 - memberEntranceProgress * 125;
                          gsap.set(member, { y: entranceY + '%' });

                          const initialLetterScaleDelay = 0.4;
                          const initialLetterScaleProgress = Math.max(
                              0,
                              (memberEntranceProgress - initialLetterScaleDelay) / (1 - initialLetterScaleDelay)
                          );
                          gsap.set(teamMemberInitial, { scale: initialLetterScaleProgress });
                      } else if (progress > entranceEnd) {
                          gsap.set(member, { y: '0%' });
                          if (teamMemberInitial) gsap.set(teamMemberInitial, { scale: 1 });
                      }
                  });
              }
          });

          cardSlideInAnimation = ScrollTrigger.create({
              trigger: cardsScreenSection,
              start: 'top top',
              end: '+=' + (window.innerHeight * 1.2),
              pin: true,
              scrub: 1,
              refreshPriority: 0,
              onUpdate: function (self) {
                  const progress = self.progress;
                  const slideInStagger = 0.075;
                  const xRotationDuration = 0.4;
                  const cardScaleStagger = 0.12;

                  cardElements.forEach(function (card, index) {
                      const xRotationStart = index * slideInStagger;
                      const xRotationEnd = xRotationStart + xRotationDuration;

                      if (progress >= xRotationStart && progress <= xRotationEnd) {
                          const cardProgress = (progress - xRotationStart) / xRotationDuration;
                          const cardInitialX = 300 - index * 100;
                          const cardTargetX = -50;
                          const cardSlideInX = cardInitialX + cardProgress * (cardTargetX - cardInitialX);
                          const cardSlideInRotation = 20 - cardProgress * 20;
                          gsap.set(card, {
                              xPercent: cardSlideInX,
                              yPercent: -50,
                              rotation: cardSlideInRotation
                          });
                      } else if (progress > xRotationEnd) {
                          gsap.set(card, { xPercent: -50, yPercent: -50, rotation: 0 });
                      }

                      const cardScaleStart = 0.4 + index * cardScaleStagger;
                      const cardScaleEnd = 1;
                      if (progress >= cardScaleStart && progress <= cardScaleEnd) {
                          const scaleProgress = (progress - cardScaleStart) / (cardScaleEnd - cardScaleStart);
                          const scaleValue = 0.75 + scaleProgress * 0.25;
                          gsap.set(card, { scale: scaleValue });
                      } else if (progress > cardScaleEnd) {
                          gsap.set(card, { scale: 1 });
                      }
                  });
              }
          });
      }

      window.initCardsScreenScrollTrigger = function () {
          initCardsScreenAnimations();
          ScrollTrigger.refresh();
      };

      window.addEventListener('resize', function () {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(function () {
              initCardsScreenAnimations();
              ScrollTrigger.refresh();
          }, 250);
      });

      // Na stronie bez hero (np. inny szablon) inicjuj od razu; na holyfive.html wywoła hero w createCards().then()
      if (!document.querySelector('.hf-home-v2__hero')) {
          window.initCardsScreenScrollTrigger();
      }
  }
});

// Funkcja inicjalizująca karuzelę 3D
function initCarousel(carousel) {
  const cards = carousel.querySelectorAll('.player-card');
  const cardsCount = cards.length;
  let currentIndex = 0;
  
  // Funkcja układająca karty w okrąg 3D
  function arrangeCards() {
      const angleStep = 360 / cardsCount;
      const radius = 400 + (cardsCount * 20); // Zwiększony promień dla większej liczby kart
      
      cards.forEach((card, index) => {
          // Oblicz pozycję kątową każdej karty
          const angle = ((index - currentIndex) * angleStep) % 360;
          const radian = angle * Math.PI / 180;
          
          // Oblicz pozycję X i Z dla efektu 3D
          const x = radius * Math.sin(radian);
          const z = radius * Math.cos(radian) - radius;
          
          // Oblicz skalę i przezroczystość
          const scale = Math.max(0.6, (1000 + z) / 1000);
          const opacity = Math.max(0.4, (1000 + z) / 1000);
          
          // Zastosuj transformacje
          card.style.transform = `translateX(${x}px) translateZ(${z}px) rotateY(${-angle}deg) scale(${scale})`;
          card.style.opacity = opacity;
          card.style.zIndex = Math.floor((1000 + z) / 10);
          
          // Dodaj klasę active dla aktywnej karty
          if (index === currentIndex) {
              card.classList.add('active');
          } else {
              card.classList.remove('active');
          }
          
          // Pokaż karty w zasięgu ±2 od aktualnej
          const angleDiff = Math.abs(angle) <= 180 ? Math.abs(angle) : 360 - Math.abs(angle);
          if (angleDiff <= angleStep * 2) {
              card.style.display = 'block';
          } else {
              card.style.display = 'none';
          }
      });
  }
  
  // Funkcja do przesunięcia karuzeli w lewo
  function moveLeft() {
      currentIndex = (currentIndex - 1 + cardsCount) % cardsCount;
      arrangeCards();
  }
  
  // Funkcja do przesunięcia karuzeli w prawo
  function moveRight() {
      currentIndex = (currentIndex + 1) % cardsCount;
      arrangeCards();
  }
  
  // Funkcja do przełączania na konkretną kartę
  function moveToCard(index) {
      currentIndex = index;
      arrangeCards();
  }
  
  // Obsługa kliknięć na karty
  cards.forEach((card, index) => {
      card.addEventListener('click', function() {
          if (index !== currentIndex) {
              moveToCard(index);
          }
      });
  });
  
  // Inicjalizacja pozycji kart
  arrangeCards();
  
  // Pobierz przyciski nawigacyjne
  const container = carousel.closest('.carousel-container');
  const leftArrow = container.querySelector('.carousel-arrow-left');
  const rightArrow = container.querySelector('.carousel-arrow-right');
  
  // Dodaj obsługę kliknięć na strzałki
  if (leftArrow) leftArrow.addEventListener('click', moveLeft);
  if (rightArrow) rightArrow.addEventListener('click', moveRight);
  
  // Obsługa klawiszy strzałek
  document.addEventListener('keydown', function(e) {
      if (carousel.closest('.section-content').style.display !== 'none') {
          if (e.key === 'ArrowLeft') {
              moveLeft();
          } else if (e.key === 'ArrowRight') {
              moveRight();
          }
      }
  });
}

// Efekt mieszania liter (scramble effect) – po wstawieniu partiali
document.addEventListener("hfLayoutReady", function() {
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{}|;:,.<>/?\"";
    const elements = document.querySelectorAll("[data-value]:not(.h1)");

    elements.forEach(element => {
        const isI18n = element.hasAttribute("data-i18n");
        const originalValue = element.dataset.value || element.textContent.trim();
        if (!isI18n) element.textContent = originalValue;

        element.addEventListener("mouseenter", () => {
            const baseText = isI18n ? element.textContent.trim() : originalValue;
            const uppercaseValue = baseText.toUpperCase();
            let iteration = 0;
            clearInterval(element.scrambleInterval);
            if (isI18n) element._scrambleRestore = baseText;

            element.textContent = uppercaseValue;

            element.scrambleInterval = setInterval(() => {
                element.textContent = uppercaseValue
                    .split("")
                    .map((letter, index) => {
                        if(index < iteration) {
                            return uppercaseValue[index];
                        }

                        return letters[Math.floor(Math.random() * letters.length)];
                    })
                    .join("");

                if(iteration >= uppercaseValue.length){
                    clearInterval(element.scrambleInterval);
                    element.textContent = uppercaseValue;
                }

                iteration += 1 / 3;
            }, 30);
        });

        element.addEventListener("mouseleave", () => {
            clearInterval(element.scrambleInterval);
            element.textContent = isI18n && element._scrambleRestore !== undefined ? element._scrambleRestore : originalValue;
        });
    });
});

/* ----- Menu overlay (hamburger) – logika jak w CMM (po wstawieniu partiali) ----- */
document.addEventListener("hfLayoutReady", function() {
    const menuToggle = document.querySelector(".menu");
    const siteNavMenuOverlay = document.querySelector("#site-nav-menu-overlay");
    const menuLinks = Array.from(document.querySelectorAll(".menu-overlay-link"));
    const socialLinks = Array.from(document.querySelectorAll(".menu-social-link"));
    const menuItems = [...menuLinks, ...socialLinks];
    const langButtons = Array.from(document.querySelectorAll(".lang-btn"));
    const menuLangSwitch = document.querySelector(".menu-lang-switch");
    const gsapAvailable = typeof gsap !== "undefined";

    const translations = {
        en: {
            aboutMe: "About us",
            contact221: "Contact",
            loading: "LOADING",
            navHome: "Home",
            navPlayers: "Players",
            navAcademy: "Academy",
            heroHeading: "Welcome, champions",
            heroHeadingCircle: "Nuke.<br>the undisputed choice of Holy Five",
            motto1: "5 PLAYERS",
            motto2: "1 GOAL",
            motto3: "HUNGER TO PLAY 24/7",
            sponsorsTitle: "Companies that haven't heard of us yet (and that's just as well).",
            card1Title: "Identity",
            card1Desc: "We're a crew of friends from 221. Evenings mean Faceit, matches, and the right amount of tilt — no fake vibes, just the game.",
            card2Title: "Roots",
            card2Desc: "The project happened by accident; the name doesn't mean much. We've got Jesus on the roster — so we only win by miracles. That's the vibe.",
            card3Title: "Direction",
            card3Desc: "We only go backwards the more we play together — but we're still aiming for the highest Faceit level after every session. And a prayer.",
            footerContact: "Contact",
            copyright: "221 © 2025"
        },
        pl: {
            aboutMe: "O nas",
            contact221: "Kontakt",
            loading: "ŁADOWANIE",
            navHome: "Strona główna",
            navPlayers: "Zawodnicy",
            navAcademy: "Akademia",
            heroHeading: "Witajcie zwycięzcy",
            heroHeadingCircle: "Nuke.<br>bezdyskusyjny wybór Holy Five",
            motto1: "5 ZAWODNIKÓW",
            motto2: "1 CEL",
            motto3: "GŁÓD GRY 24/7",
            sponsorsTitle: "Firmy, które jeszcze o nas nie słyszały (i całe szczęście).",
            card1Title: "Tożsamość",
            card1Desc: "Jesteśmy paczką znajomych z 221. Wieczorami wbijamy na Faceita, gramy, denerwujemy się na pełnej — i nie udajemy kogoś innego. Tak się to kręci.",
            card2Title: "Korzenie",
            card2Desc: "Projekt zrodził się z przypadku, nazwa — bez ukrytej filozofii. W składzie mamy Jezusa, więc wygrywamy wyłącznie cudami. I tak trzymamy.",
            card3Title: "Kierunek",
            card3Desc: "W rozwoju tylko się cofamy, im więcej gramy ze sobą. Cel? Jak najwyższy level na Faceicie po każdym spotkaniu — i modlitwa.",
            footerContact: "Kontakt",
            copyright: "221 © 2025"
        }
    };

    function setMenuLinkText(element, value) {
        const primary = element.querySelector(".menu-link-text-primary");
        const secondary = element.querySelector(".menu-link-text-secondary");
        const label = element.querySelector(".menu-link-label");
        if (primary) primary.textContent = value;
        if (secondary) secondary.textContent = value;
        if (label) label.textContent = value;
        element.setAttribute("aria-label", value);
    }

    function applyLanguage(lang) {
        const nextLanguage = translations[lang] ? lang : "en";
        document.documentElement.lang = nextLanguage;
        document.querySelectorAll("[data-i18n]").forEach(function(el) {
            const key = el.getAttribute("data-i18n");
            const value = translations[nextLanguage][key];
            if (value) {
                if (el.classList.contains("menu-overlay-link")) {
                    setMenuLinkText(el, value);
                } else {
                    el.textContent = value;
                }
            }
        });
        const heroHeadingEl = document.querySelector(".hf-home-v2__hero-heading");
        if (heroHeadingEl && translations[nextLanguage]) {
            const t = translations[nextLanguage];
            if (t.heroHeading) {
                heroHeadingEl.dataset.defaultText = t.heroHeading;
            }
            if (t.heroHeadingCircle) {
                heroHeadingEl.dataset.circleText = t.heroHeadingCircle;
            }
            if (typeof window.applySmudgedHeading === 'function') {
                window.applySmudgedHeading(heroHeadingEl, heroHeadingEl.dataset.defaultText || heroHeadingEl.textContent);
            } else {
                heroHeadingEl.innerHTML = heroHeadingEl.dataset.defaultText || heroHeadingEl.textContent;
            }
        }
        langButtons.forEach(function(btn) {
            btn.classList.toggle("is-active", btn.dataset.lang === nextLanguage);
        });
        if (menuLangSwitch) menuLangSwitch.dataset.activeLang = nextLanguage;
        try { localStorage.setItem("221-lang", nextLanguage); } catch (e) {}
    }

    function initMenuLinksHoverAnimation() {
        const overlayMenuLinks = menuLinks.filter(function(l) { return l.classList.contains("menu-overlay-link"); });
        const overlayMenuNav = document.querySelector(".menu-overlay-nav");
        if (overlayMenuLinks.length === 0) return;

        function clearDimState() {
            if (!overlayMenuNav) return;
            overlayMenuNav.classList.remove("is-dimming");
            overlayMenuLinks.forEach(function(item) { item.classList.remove("is-active-hover"); });
        }
        function activateDimState(activeLink) {
            if (!overlayMenuNav) return;
            overlayMenuNav.classList.add("is-dimming");
            overlayMenuLinks.forEach(function(item) {
                item.classList.toggle("is-active-hover", item === activeLink);
            });
        }

        if (!gsapAvailable) {
            if (overlayMenuNav) {
                overlayMenuLinks.forEach(function(link) {
                    link.addEventListener("mouseenter", function() { activateDimState(link); });
                    link.addEventListener("mouseleave", clearDimState);
                    link.addEventListener("focus", function() { activateDimState(link); });
                    link.addEventListener("blur", clearDimState);
                });
                overlayMenuNav.addEventListener("mouseleave", clearDimState);
            }
            return;
        }
        if (overlayMenuNav) overlayMenuNav.addEventListener("mouseleave", clearDimState);
        overlayMenuLinks.forEach(function(link) {
            const primary = link.querySelector(".menu-link-text-primary");
            const secondary = link.querySelector(".menu-link-text-secondary");
            if (!primary || !secondary) return;
            gsap.set(primary, { yPercent: 0 });
            gsap.set(secondary, { yPercent: 0 });
            link.addEventListener("mouseenter", function() {
                link.classList.add("is-hovered");
                activateDimState(link);
                gsap.to([primary, secondary], { yPercent: -100, duration: MOTION.durationNormal, ease: MOTION.easeEnter, overwrite: "auto" });
            });
            link.addEventListener("mouseleave", function() {
                link.classList.remove("is-hovered");
                gsap.to([primary, secondary], { yPercent: 0, duration: MOTION.durationNormal, ease: MOTION.easeEnter, overwrite: "auto" });
                clearDimState();
            });
            link.addEventListener("focus", function() {
                link.classList.add("is-hovered");
                activateDimState(link);
                gsap.to([primary, secondary], { yPercent: -100, duration: MOTION.durationNormal, ease: MOTION.easeEnter, overwrite: "auto" });
            });
            link.addEventListener("blur", function() {
                link.classList.remove("is-hovered");
                gsap.to([primary, secondary], { yPercent: 0, duration: MOTION.durationNormal, ease: MOTION.easeEnter, overwrite: "auto" });
                clearDimState();
            });
        });
    }

    function initMenuSocialDimming() {
        var menuOverlayRight = document.querySelector(".menu-overlay-right");
        var menuSocialLinks = Array.prototype.slice.call(
            document.querySelectorAll(".menu-overlay-right .menu-social-link")
        );
        if (!menuOverlayRight || menuSocialLinks.length === 0) return;

        function clearSocialDimState() {
            menuOverlayRight.classList.remove("is-dimming");
            menuSocialLinks.forEach(function(item) {
                item.classList.remove("is-active-hover");
            });
        }

        function activateSocialDimState(activeLink) {
            menuOverlayRight.classList.add("is-dimming");
            menuSocialLinks.forEach(function(item) {
                item.classList.toggle("is-active-hover", item === activeLink);
            });
        }

        menuOverlayRight.addEventListener("mouseleave", clearSocialDimState);
        menuSocialLinks.forEach(function(link) {
            link.addEventListener("mouseenter", function() {
                activateSocialDimState(link);
            });
            link.addEventListener("focus", function() {
                activateSocialDimState(link);
            });
            link.addEventListener("blur", clearSocialDimState);
        });
    }

    var LANG_STORAGE_OLD_KEY = "holyfive-lang";
    var LANG_STORAGE_NEW_KEY = "221-lang";

    var savedMenuLang = null;
    try { savedMenuLang = localStorage.getItem(LANG_STORAGE_NEW_KEY); } catch (e) {}

    if (!translations[savedMenuLang]) {
        try {
            var oldLang = localStorage.getItem(LANG_STORAGE_OLD_KEY);
            if (translations[oldLang]) {
                savedMenuLang = oldLang;
                // Backward-compatible migration: prefer the new key going forward.
                try { localStorage.setItem(LANG_STORAGE_NEW_KEY, oldLang); } catch (e) {}
            }
        } catch (e) {}
    }

    applyLanguage(translations[savedMenuLang] ? savedMenuLang : "pl");
    initMenuLinksHoverAnimation();
    initMenuSocialDimming();
    if (menuLangSwitch) {
        menuLangSwitch.addEventListener("click", function() {
            var cur = menuLangSwitch.dataset.activeLang === "pl" ? "pl" : "en";
            applyLanguage(cur === "en" ? "pl" : "en");
        });
    }

    if (!menuToggle || !siteNavMenuOverlay) return;

    var isMenuAnimating = false;
    var isMenuOpen = false;
    var activeMenuTimeline = null;
    var menuClosedClipPath = "inset(100% 0% 0% 0%)";
    var menuOpenClipPath = "inset(0% 0% 0% 0%)";
    var spotlight = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5, rafId: null };

    function applyMenuButtonState(open) {
        menuToggle.classList.toggle("opened", open);
        menuToggle.classList.toggle("closed", !open);
        menuToggle.setAttribute("aria-expanded", String(open));
        siteNavMenuOverlay.setAttribute("aria-hidden", String(!open));
        document.body.classList.toggle("menu-open", open);
    }

    function flushSpotlight() {
        spotlight.rafId = null;
        siteNavMenuOverlay.style.setProperty("--spot-x", Math.round(spotlight.x) + "px");
        siteNavMenuOverlay.style.setProperty("--spot-y", Math.round(spotlight.y) + "px");
    }
    function scheduleSpotlightFlush() {
        if (spotlight.rafId !== null) return;
        spotlight.rafId = requestAnimationFrame(flushSpotlight);
    }
    window.addEventListener("pointermove", function(ev) {
        if (!isMenuOpen) return;
        spotlight.x = ev.clientX;
        spotlight.y = ev.clientY;
        scheduleSpotlightFlush();
    }, { passive: true });
    siteNavMenuOverlay.addEventListener("pointerenter", function(ev) {
        spotlight.x = ev.clientX;
        spotlight.y = ev.clientY;
        scheduleSpotlightFlush();
    });

    applyMenuButtonState(false);

    if (!gsapAvailable) {
        menuToggle.addEventListener("click", function() {
            isMenuOpen = !isMenuOpen;
            applyMenuButtonState(isMenuOpen);
            siteNavMenuOverlay.style.pointerEvents = isMenuOpen ? "auto" : "none";
            siteNavMenuOverlay.style.clipPath = isMenuOpen ? menuOpenClipPath : menuClosedClipPath;
            siteNavMenuOverlay.style.webkitClipPath = isMenuOpen ? menuOpenClipPath : menuClosedClipPath;
            siteNavMenuOverlay.style.transform = isMenuOpen ? "translate3d(0,0,0)" : "translate3d(0,100%,0)";
            menuItems.forEach(function(item) {
                item.style.opacity = isMenuOpen ? "1" : "0";
                item.style.transform = isMenuOpen ? "translate3d(0,0,0)" : "translate3d(0,30px,0)";
            });
        });
        return;
    }

    gsap.set(siteNavMenuOverlay, {
        clipPath: menuClosedClipPath,
        webkitClipPath: menuClosedClipPath,
        transform: "none",
        pointerEvents: "none"
    });
    gsap.set(menuItems, { y: 30, opacity: 0 });

    function stopMenuAnimation() {
        if (activeMenuTimeline) {
            activeMenuTimeline.kill();
            activeMenuTimeline = null;
        }
        gsap.killTweensOf([siteNavMenuOverlay].concat(menuItems));
    }
    function createMenuTimeline(onComplete) {
        return gsap.timeline({
            onComplete: function() {
                isMenuAnimating = false;
                activeMenuTimeline = null;
                if (typeof onComplete === "function") onComplete();
            },
            onInterrupt: function() {
                isMenuAnimating = false;
                activeMenuTimeline = null;
            }
        });
    }
    function openMenu() {
        isMenuAnimating = true;
        isMenuOpen = true;
        applyMenuButtonState(true);
        stopMenuAnimation();
        activeMenuTimeline = createMenuTimeline();
        activeMenuTimeline.to(siteNavMenuOverlay, {
            clipPath: menuOpenClipPath,
            webkitClipPath: menuOpenClipPath,
            duration: MOTION.durationMenuOpen,
            ease: MOTION.easeEnter,
            onStart: function() { siteNavMenuOverlay.style.pointerEvents = "auto"; }
        }, 0);
        if (menuLinks.length > 0) {
            activeMenuTimeline.to(menuLinks, { y: 0, opacity: 1, stagger: MOTION.staggerMenuLink, duration: MOTION.durationReveal, ease: MOTION.easeEnter }, 0.18);
        }
        if (socialLinks.length > 0) {
            activeMenuTimeline.to(socialLinks, { y: 0, opacity: 1, stagger: MOTION.staggerMenuSocial, duration: MOTION.durationReveal, ease: MOTION.easeEnter }, 0.24);
        }
    }
    function closeMenu() {
        isMenuAnimating = true;
        isMenuOpen = false;
        applyMenuButtonState(false);
        stopMenuAnimation();
        activeMenuTimeline = createMenuTimeline(function() {
            gsap.set(siteNavMenuOverlay, { clipPath: menuClosedClipPath, webkitClipPath: menuClosedClipPath, pointerEvents: "none" });
            gsap.set(menuItems, { y: 30, opacity: 0 });
        });
        if (menuItems.length > 0) {
            activeMenuTimeline.to(menuItems, { y: 30, opacity: 0, stagger: MOTION.staggerMenuClose, duration: MOTION.durationNormal, ease: MOTION.easeExit }, 0);
        }
        activeMenuTimeline.to(siteNavMenuOverlay, { clipPath: menuClosedClipPath, webkitClipPath: menuClosedClipPath, duration: MOTION.durationMenuClose, ease: MOTION.easeExit }, 0.08);
    }
    menuToggle.addEventListener("click", function() {
        if (isMenuAnimating) return;
        if (isMenuOpen) closeMenu(); else openMenu();
    });
});

// Napis lorem – logika 1:1 z AnimatedCopy.jsx (CODE(3)): SplitText words→chars, scroll-driven reveal
// Kolory akcentu per karta: 0 = bizon czerwony, 1 = AWP zielony, 2 = AK róż/niebieski
(function() {
    var colorInitial = "#3f4349";
    var colorFinal = "#ffffff";
    var colorAccentBizon = "#ff3131";
    var colorAccentAwp = "#2dd355";
    var colorAccentAkPink = "#e84a8a";
    var colorAccentAkBlue = "#4a8ae8";

    function getAccentColor(cardIndex, charIndex) {
        if (cardIndex === 0) return colorAccentBizon;
        if (cardIndex === 1) return colorAccentAwp;
        return charIndex % 2 === 0 ? colorAccentAkPink : colorAccentAkBlue;
    }

    function splitWordsAndChars(container) {
        var allChars = [];
        var nodes = Array.from(container.childNodes);
        var fragment = document.createDocumentFragment();

        nodes.forEach(function(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent;
                var words = text.split(/(\s+)/);
                words.forEach(function(word) {
                    var wordSpan = document.createElement("span");
                    wordSpan.className = "word";
                    if (/^\s+$/.test(word) || word === "") {
                        for (var s = 0; s < word.length; s++) {
                            var charSpan = document.createElement("span");
                            charSpan.className = "char";
                            charSpan.textContent = word[s] || "\u00A0";
                            wordSpan.appendChild(charSpan);
                            allChars.push(charSpan);
                        }
                    } else {
                        for (var c = 0; c < word.length; c++) {
                            var charSpan = document.createElement("span");
                            charSpan.className = "char";
                            charSpan.textContent = word[c];
                            wordSpan.appendChild(charSpan);
                            allChars.push(charSpan);
                        }
                    }
                    if (wordSpan.childNodes.length) fragment.appendChild(wordSpan);
                });
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName === "BR") {
                var wordSpan = document.createElement("span");
                wordSpan.className = "word";
                var brSpan = document.createElement("span");
                brSpan.className = "char char--br";
                brSpan.setAttribute("aria-hidden", "true");
                wordSpan.appendChild(brSpan);
                fragment.appendChild(wordSpan);
                allChars.push(brSpan);
            }
        });

        if (fragment.childNodes.length === 0) return allChars;
        container.innerHTML = "";
        container.appendChild(fragment);
        return allChars;
    }

    function initAnimatedCopy(el, cardIndex) {
        cardIndex = cardIndex === undefined ? 0 : cardIndex;
        var allChars = splitWordsAndChars(el);
        if (allChars.length === 0) return null;

        gsap.set(allChars, { color: colorInitial });

        var lastScrollProgress = 0;
        var colorTransitionTimers = {};
        var completedChars = {};
        var triggerEl = el.closest(".hf-item") || el.closest(".hf-item-name") || el;

        function scheduleFinalTransition(char, index) {
            if (colorTransitionTimers[index]) {
                clearTimeout(colorTransitionTimers[index]);
            }
            colorTransitionTimers[index] = setTimeout(function() {
                if (!completedChars[index]) {
                    gsap.to(char, {
                        duration: 0.1,
                        ease: "none",
                        color: colorFinal,
                        onComplete: function() {
                            completedChars[index] = true;
                        }
                    });
                }
                delete colorTransitionTimers[index];
            }, 100);
        }

        return ScrollTrigger.create({
            trigger: triggerEl,
            start: "top 35%",
            end: "top 5%",
            scrub: 1,
            onUpdate: function(self) {
                var progress = self.progress;
                var totalChars = allChars.length;
                var isScrollingDown = progress >= lastScrollProgress;
                var currentCharIndex = Math.floor(progress * totalChars);

                allChars.forEach(function(char, index) {
                    if (!isScrollingDown && index >= currentCharIndex) {
                        if (colorTransitionTimers[index]) {
                            clearTimeout(colorTransitionTimers[index]);
                            delete colorTransitionTimers[index];
                        }
                        delete completedChars[index];
                        gsap.set(char, { color: colorInitial });
                        return;
                    }

                    if (completedChars[index]) return;

                    if (index <= currentCharIndex) {
                        gsap.set(char, { color: getAccentColor(cardIndex, index) });
                        if (!colorTransitionTimers[index]) {
                            scheduleFinalTransition(char, index);
                        }
                    } else {
                        gsap.set(char, { color: colorInitial });
                    }
                });

                lastScrollProgress = progress;
            }
        });
    }

    /** Znikanie napisu znacznie później; kolejność od lewego dolnego rogu (najniższe słowa, wśród nich najbardziej w lewo) w stronę prawego górnego. */
    function initOverlayDisappear(el) {
        var firstItem = el.closest(".hf-item");
        if (!firstItem) return;

        var wordNodes = Array.from(el.querySelectorAll(".word")).filter(function(w) { return !w.querySelector(".char--br"); });
        if (wordNodes.length === 0) return;

        var sortedWords = null;

        ScrollTrigger.create({
            trigger: firstItem,
            start: "top -280px top",
            end: "top -700px top",
            scrub: 1,
            onUpdate: function(self) {
                if (!sortedWords) {
                    var items = wordNodes.map(function(w) {
                        var r = w.getBoundingClientRect();
                        return { el: w, bottom: r.bottom, left: r.left };
                    });
                    items.sort(function(a, b) {
                        return b.bottom - a.bottom || a.left - b.left;
                    });
                    sortedWords = items.map(function(x) { return x.el; });
                }
                var total = sortedWords.length;
                var progress = self.progress;
                for (var i = 0; i < total; i++) {
                    sortedWords[i].style.opacity = progress >= (i + 1) / total ? 0 : 1;
                }
            }
        });
    }

    function runInit() {
        if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined") return;

        var elements = document.querySelectorAll(".js-scroll-reveal-copy");
        if (!elements.length) return;

        gsap.registerPlugin(ScrollTrigger);

        var mottoItems = document.querySelectorAll(".hf-home-v2__motto-band .hf-item");
        elements.forEach(function(el) {
            var cardIndex = 0;
            var item = el.closest(".hf-item");
            if (item && mottoItems.length) {
                var idx = Array.prototype.indexOf.call(mottoItems, item);
                if (idx >= 0) cardIndex = idx;
            }
            initAnimatedCopy(el, cardIndex);
            initOverlayDisappear(el);
        });

        if (typeof ScrollTrigger !== "undefined") {
            ScrollTrigger.refresh();
        }
    }

    window.addEventListener("load", function() {
        setTimeout(runInit, 1600);
    });
})();
