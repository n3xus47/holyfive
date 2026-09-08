(function () {
  if (window.group221SiteViewTransitionInitialized) return;
  window.group221SiteViewTransitionInitialized = true;

  const NAVIGATION = window.navigation;
  const supportsViewTransition = typeof document.startViewTransition === "function";
  const loaderUrl = document.currentScript?.src ? new URL(document.currentScript.src, location.href).href : null;
  const GLOBAL_AUTHOR_ID = "global-author-credit";
  
  // Zoptymalizowana struktura śledzenia eventów (zapobieganie wyciekom pamięci)
  const trackedGlobalListeners = new Set();
  let globalAuthorHandlersBound = false;

  const nativeWindowAdd = window.addEventListener.bind(window);
  const nativeWindowRemove = window.removeEventListener.bind(window);
  const nativeDocumentAdd = document.addEventListener.bind(document);
  const nativeDocumentRemove = document.removeEventListener.bind(document);

  if (!NAVIGATION || typeof NAVIGATION.addEventListener !== "function") return;

  const HERO_SELECTION_RETURN_KEY = "221-hero-selection-return";

  function markHeroSelectionReturnOnHome() {
    try {
      sessionStorage.setItem(HERO_SELECTION_RETURN_KEY, "1");
    } catch (_e) {}
  }

  function shouldRestoreHeroSelectionOnHome() {
    try {
      return sessionStorage.getItem(HERO_SELECTION_RETURN_KEY) === "1";
    } catch (_e) {
      return false;
    }
  }

  function trackListener(target, type, listener, options) {
    if (typeof listener !== "function") return null;
    const record = { target, type, listener, options };
    trackedGlobalListeners.add(record);
    return record;
  }

  function untrackListener(target, type, listener) {
    for (const record of trackedGlobalListeners) {
      if (record.target === target && record.type === type && record.listener === listener) {
        trackedGlobalListeners.delete(record);
        break;
      }
    }
  }

  // Bezpieczny Monkey-patching (nie połyka opcji)
  window.addEventListener = function (type, listener, options) {
    trackListener(window, type, listener, options);
    nativeWindowAdd(type, listener, options);
  };
  window.removeEventListener = function (type, listener, options) {
    untrackListener(window, type, listener);
    nativeWindowRemove(type, listener, options);
  };
  document.addEventListener = function (type, listener, options) {
    trackListener(document, type, listener, options);
    nativeDocumentAdd(type, listener, options);
  };
  document.removeEventListener = function (type, listener, options) {
    untrackListener(document, type, listener);
    nativeDocumentRemove(type, listener, options);
  };

  function cleanupGlobalListeners() {
    for (const record of trackedGlobalListeners) {
      if (record.target === window) {
        nativeWindowRemove(record.type, record.listener, record.options);
      } else if (record.target === document) {
        nativeDocumentRemove(record.type, record.listener, record.options);
      }
    }
    trackedGlobalListeners.clear();
  }

  /** Lenis Nikodem + ScrollTrigger przy SPA — jak home, wyczyść przed podmianą dokumentu. */
  function cleanupNikodemScrollInfrastructureBeforeSwap() {
    const spotlight = document.querySelector("[data-nikodem-photo-spotlight]");
    if (spotlight?._nikodemSpotlightCleanup) {
      try {
        spotlight._nikodemSpotlightCleanup();
      } catch (_e) {}
    }
    const ln = window.group221NikodemLenis;
    if (ln && typeof ln.destroy === "function") {
      try {
        ln.destroy();
      } catch (_e) {}
    }
    window.group221NikodemLenis = null;
    const gsap = window.gsap;
    if (window.group221NikodemLenisTicker && gsap && typeof gsap.ticker?.remove === "function") {
      try {
        gsap.ticker.remove(window.group221NikodemLenisTicker);
      } catch (_e) {}
    }
    window.group221NikodemLenisTicker = null;
    if (typeof window.ScrollTrigger !== "undefined" && window.ScrollTrigger.scrollerProxy) {
      try {
        window.ScrollTrigger.scrollerProxy(document.documentElement, null);
      } catch (_e) {}
    }
  }

  /** Lenis + ScrollTrigger ze strony głównej zostają w pamięci przy SPA — ciągną scroll poza pierwszą klatkę. */
  function cleanupHomeScrollInfrastructureBeforeSwap() {
    if (typeof window.group221DisposeHomePageController === "function") {
      try {
        window.group221DisposeHomePageController();
      } catch (_e) {}
    }
    if (typeof window.ScrollTrigger !== "undefined") {
      try {
        if (typeof window.ScrollTrigger.killAll === "function") {
          window.ScrollTrigger.killAll();
        } else if (typeof window.ScrollTrigger.getAll === "function") {
          window.ScrollTrigger.getAll().forEach((t) => t.kill());
        }
        if (typeof window.ScrollTrigger.clearScrollMemory === "function") {
          window.ScrollTrigger.clearScrollMemory(true);
        }
      } catch (_e) {}
    }
    const ln = window.group221HomeLenis;
    if (ln && typeof ln.destroy === "function") {
      try {
        ln.destroy();
      } catch (_e) {}
    }
    window.group221HomeLenis = undefined;
    const gsap = window.gsap;
    if (window.group221HomeLenisTicker && gsap && typeof gsap.ticker?.remove === "function") {
      try {
        gsap.ticker.remove(window.group221HomeLenisTicker);
      } catch (_e) {}
    }
    window.group221HomeLenisTicker = null;
  }

  function forceScrollDocumentToTopImmediate() {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch (_e) {}
    window.scrollTo(0, 0);
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
      document.documentElement.scrollLeft = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
      document.body.scrollLeft = 0;
    }
  }

  function forceScrollWindowToTop() {
    try {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
    } catch (_e) {}
    const sync = () => {
      window.scrollTo(0, 0);
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
    };
    sync();
    requestAnimationFrame(() => {
      sync();
      requestAnimationFrame(sync);
    });
  }

  function isExecutableScript(script) {
    const type = (script.getAttribute("type") || "").trim().toLowerCase();
    return type === "" || type === "text/javascript" || type === "application/javascript" || type === "module";
  }

  function syncElementAttributes(target, source) {
    const sourceNames = new Set(source.getAttributeNames());
    for (const name of target.getAttributeNames()) {
      if (!sourceNames.has(name)) target.removeAttribute(name);
    }
    for (const name of sourceNames) {
      target.setAttribute(name, source.getAttribute(name) || "");
    }
  }

  function toAbsoluteUrl(value, baseUrl) {
    if (!value) return null;
    try {
      return new URL(value, baseUrl).href;
    } catch {
      return null;
    }
  }

  function syncHeadStyles(nextDocument, destinationUrl) {
    const currentLinks = Array.from(document.head.querySelectorAll('link[rel="stylesheet"]'));
    const nextLinks = Array.from(nextDocument.head.querySelectorAll('link[rel="stylesheet"]'));

    const currentHrefs = new Set(currentLinks.map(l => toAbsoluteUrl(l.getAttribute("href"), location.href)).filter(Boolean));
    const nextHrefs = new Set(nextLinks.map(l => toAbsoluteUrl(l.getAttribute("href"), destinationUrl)).filter(Boolean));

    // Usuwanie zbędnych arkuszy (zamiast zostawiać jako disabled, co zanieczyszczało DOM)
    currentLinks.forEach(link => {
      const href = toAbsoluteUrl(link.getAttribute("href"), location.href);
      if (href && !nextHrefs.has(href)) link.remove();
    });

    // Dodawanie nowych arkuszy
    nextLinks.forEach(link => {
      const href = toAbsoluteUrl(link.getAttribute("href"), destinationUrl);
      if (href && !currentHrefs.has(href)) {
        const newLink = document.createElement("link");
        newLink.rel = "stylesheet";
        newLink.href = href;
        document.head.appendChild(newLink);
      }
    });

    // Zarządzanie stylami inline
    document.head.querySelectorAll('style[data-vt-managed-inline="1"]').forEach(s => s.remove());
    nextDocument.head.querySelectorAll("style").forEach(nextStyle => {
      const style = document.createElement("style");
      style.dataset.vtManagedInline = "1";
      style.textContent = nextStyle.textContent || "";
      document.head.appendChild(style);
    });
  }

  function getCanonicalHomeUrl(base = location.origin) {
    return new URL("/pages/index.html", base).href;
  }

  /** `/` to stub przekierowania — canonical home to `/pages/index.html`. */
  function resolveNavigationDestination(rawUrl) {
    const resolved = new URL(rawUrl, location.href);
    if (resolved.pathname === "/" || resolved.pathname === "") {
      const canonical = new URL("/pages/index.html", resolved.origin);
      resolved.pathname = canonical.pathname;
      resolved.search = canonical.search;
      resolved.hash = canonical.hash;
    }
    return resolved;
  }

  function isIndexPath(pathname) {
    const path = pathname || "";
    return (
      path === "/" ||
      path === "/pages/index.html" ||
      path.endsWith("/pages/index.html") ||
      path === "/pages" ||
      path === "/pages/"
    );
  }

  function isHomePageContentPresent() {
    return Boolean(document.getElementById("main-content")?.querySelector(".hero"));
  }

  function isHomeScrollInfrastructureReady() {
    if (!isHomePageContentPresent()) return false;
    if (!window.group221HomeLenis) return false;
    if (typeof window.ScrollTrigger === "undefined") return false;
    try {
      return Boolean(window.ScrollTrigger.getById("hero-pin"));
    } catch (_e) {
      return false;
    }
  }

  const HOME_ES_MODULE_PATHS = new Set([
    "/features/home/home-page-controller.js",
    "/features/home/home-outro-stack-scroll.js",
  ]);

  const PROFILE_ES_MODULE_PATHS = new Set([
    "/features/nikodem/nikodem-profile-runtime.js",
    "/features/kacper/kacper-profile-runtime.js",
  ]);

  function isHomeEsModuleScript(script, baseUrl) {
    if (!script?.src) return false;
    try {
      const path = new URL(script.getAttribute("src") || "", baseUrl).pathname;
      return HOME_ES_MODULE_PATHS.has(path);
    } catch (_e) {
      return false;
    }
  }

  function isProfileEsModuleScript(script, baseUrl) {
    if (!script?.src) return false;
    try {
      const path = new URL(script.getAttribute("src") || "", baseUrl).pathname;
      return PROFILE_ES_MODULE_PATHS.has(path);
    } catch (_e) {
      return false;
    }
  }

  /** Moduły ES nie re-egzekwują się przy ponownym <script src> — import z cache-bust po SPA. */
  async function reinitHomeEsModules() {
    window.group221HomePageControllerInitialized = false;
    window.group221HomeSliderInitialized = false;
    window.group221HomeSpaReentry = true;
    window.group221HomeOutroStackAllowReinit = true;
    const stamp = `spa=${Date.now()}`;
    await import(`/features/home/home-outro-stack-scroll.js?${stamp}`);
    await import(`/features/home/home-page-controller.js?${stamp}`);
    if (typeof window.ScrollTrigger?.refresh === "function") {
      try {
        window.ScrollTrigger.refresh(true);
      } catch (_e) {}
    }
  }

  /** Fluid: import() z cache modułu — bez ponownego start() po powrocie SPA na home. */
  async function reinitHomeHeroAmbientEffects() {
    if (!isHomePageContentPresent()) return;
    try {
      const fluidMod = await import("/features/home/home-hero-fluid-cursor.js");
      fluidMod.restartHomeHeroFluidCursor?.();
    } catch (_e) {}
  }

  function isProfilePath(pathname) {
    const path = pathname || "";
    return /\/views\/(nikodem|kacper)\//i.test(path) || /\/(nikodem|kacper)\.html$/i.test(path);
  }

  function isNikodemProfilePath(pathname) {
    const path = pathname || "";
    return /\/views\/nikodem\//i.test(path) || /\/nikodem\.html$/i.test(path);
  }

  function isKacperProfilePath(pathname) {
    const path = pathname || "";
    return /\/views\/kacper\//i.test(path) || /\/kacper\.html$/i.test(path);
  }

  function loadHeroProfileVideoHandoffModule() {
    return import("/shared/scripts/hero-profile-video-handoff.js");
  }

  /** Panel CO-FOUNDER / zdjęcia — bez tego przy powrocie zostaje snapshot w cross-document VT. */
  function prepareProfilePageExitBeforeSwap() {
    const selectors = [
      ".nikodem-page-hero__preview-shell",
      ".kacper-page-hero__preview-shell",
      ".hero-profile-preview-layer",
    ];
    document.documentElement.setAttribute("data-vt-profile-exit-to-home", "");
    document.querySelectorAll(selectors.join(",")).forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      el.style.setProperty("view-transition-name", "none", "important");
      el.style.setProperty("opacity", "0", "important");
      el.style.setProperty("visibility", "hidden", "important");
    });
  }

  window.group221PrepareProfilePageExitForHomeNav = prepareProfilePageExitBeforeSwap;

  let profileLayoutSyncModulePromise = null;

  function loadProfileLayoutSyncModule() {
    if (!profileLayoutSyncModulePromise) {
      profileLayoutSyncModulePromise = import("/shared/scripts/profile-page-layout-sync.js");
    }
    return profileLayoutSyncModulePromise;
  }

  async function syncProfileLayoutBeforeViewTransitionCapture(
    pathname,
    modulePromise,
    layoutOptions = {},
  ) {
    try {
      const mod = await (modulePromise || loadProfileLayoutSyncModule());
      await mod.syncProfilePageLayoutForPath(pathname, document, layoutOptions);
    } catch (_e) {}
  }

  function extractNikodemPhotoHandoffBeforeSwap(handoffApi, enteringNikodem, fromHome) {
    if (!handoffApi || !enteringNikodem || !fromHome) return;
    try {
      handoffApi.extractNikodemPhotoBeforeBodySwap();
    } catch (_e) {}
  }

  function consumeNikodemPhotoHandoffLayoutOptions(handoffApi, enteringNikodem, fromHome) {
    if (!handoffApi || !enteringNikodem || !fromHome) return {};
    try {
      const img = handoffApi.consumeHandoffPhoto();
      return img ? { nikodemHandoffPhoto: img } : {};
    } catch (_e) {
      return {};
    }
  }

  function shouldHandleNavigation(event) {
    if (!event || !event.canIntercept || event.hashChange || event.downloadRequest || event.formData) {
      return false;
    }
    const destination = event.destination;
    if (!destination || destination.sameDocument || !destination.url) {
      return false;
    }
    try {
      const destinationUrl = new URL(destination.url);
      if (destinationUrl.origin !== location.origin) return false;
      if (destinationUrl.protocol !== "http:" && destinationUrl.protocol !== "https:") return false;

      return true;
    } catch {
      return false;
    }
  }

  function collectScripts(doc, baseUrl) {
    return Array.from(doc.querySelectorAll("script"))
      .filter(isExecutableScript)
      .map(script => ({ script, parentTag: script.parentElement?.tagName || "BODY" }))
      .filter(({ script }) => {
        if (!script.src || !loaderUrl) return true;
        try {
          return new URL(script.getAttribute("src") || "", baseUrl).href !== loaderUrl;
        } catch {
          return true;
        }
      });
  }

  async function executeScriptsSequentially(scriptDescriptors, baseUrl) {
    for (const descriptor of scriptDescriptors) {
      const source = descriptor.script;
      const targetScript = document.createElement("script");

      for (const attr of source.getAttributeNames()) {
        if (attr !== "src") targetScript.setAttribute(attr, source.getAttribute(attr) || "");
      }

      const isModule = (source.getAttribute("type") || "").trim().toLowerCase() === "module";

      if (source.src) {
        targetScript.src = new URL(source.getAttribute("src") || "", baseUrl).href;
        if (!isModule && !source.hasAttribute("async")) targetScript.async = false;
      } else {
        targetScript.textContent = source.textContent || "";
      }

      const targetParent = descriptor.parentTag === "HEAD" ? document.head : document.body || document.documentElement;

      await new Promise(resolve => {
        if (source.src) {
          targetScript.addEventListener("load", resolve, { once: true });
          targetScript.addEventListener("error", resolve, { once: true }); // Zabezpieczenie przed zablokowaniem kolejki
        } else {
          resolve();
        }
        targetParent.appendChild(targetScript);
      });
    }
  }

  function replayLifecycleEvents() {
    document.dispatchEvent(new Event("DOMContentLoaded", { bubbles: true, cancelable: true }));
    window.dispatchEvent(new Event("load"));
  }

  function ensureGlobalAuthorCredit() {
    document.querySelectorAll(".author-credit").forEach(item => item.remove());

    let credit = document.getElementById(GLOBAL_AUTHOR_ID);
    if (!credit) {
      credit = document.createElement("div");
      credit.id = GLOBAL_AUTHOR_ID;
      credit.textContent = "by n3xus";
      credit.setAttribute("aria-hidden", "true");
      document.body.appendChild(credit);
    } else if (credit.parentElement !== document.body) {
      document.body.appendChild(credit);
    }
    return credit;
  }

  function updateGlobalAuthorCreditVisibility() {
    const credit = ensureGlobalAuthorCredit();
    const root = document.documentElement;
    const scrollable = root.scrollHeight > window.innerHeight + 2;
    const atBottom = window.scrollY + window.innerHeight >= root.scrollHeight - 2;
    credit.classList.toggle("is-visible", !scrollable || atBottom);
  }

  function bindGlobalAuthorCreditHandlers() {
    if (globalAuthorHandlersBound) return;
    globalAuthorHandlersBound = true;
    window.addEventListener("scroll", updateGlobalAuthorCreditVisibility, { passive: true });
    window.addEventListener("resize", updateGlobalAuthorCreditVisibility, { passive: true });
  }

  function clearPageInitFlagsForPath(pathname) {
    window.group221NikodemPageInitialized = false;
    window.group221KacperPageInitialized = false;
    if (!isIndexPath(pathname)) {
      window.group221HomePageControllerInitialized = false;
      window.group221HomeSliderInitialized = false;
    }
    if (isProfilePath(pathname) || isIndexPath(pathname)) {
      window.group221SiteMenuHamburgerInitialized = false;
    }
  }

  function replaceDocumentContent(nextDocument, destinationUrl) {
    const scripts = collectScripts(nextDocument, destinationUrl);
    const preservedLang = document.documentElement.getAttribute("lang");
    const destinationPathname = new URL(destinationUrl, location.href).pathname || "";
    const preservedHtmlAttrs = new Map();

    for (const name of document.documentElement.getAttributeNames()) {
      if (name.startsWith("data-vt-") || name === "data-nikodem-hero-await-reveal" || name === "data-kacper-hero-await-reveal") {
        preservedHtmlAttrs.set(name, document.documentElement.getAttribute(name) ?? "");
      }
    }

    syncElementAttributes(document.documentElement, nextDocument.documentElement);
    for (const [name, value] of preservedHtmlAttrs) {
      document.documentElement.setAttribute(name, value);
    }
    if (preservedLang) document.documentElement.setAttribute("lang", preservedLang);
    
    syncElementAttributes(document.body, nextDocument.body);
    syncHeadStyles(nextDocument, destinationUrl);
    
    document.body.innerHTML = nextDocument.body.innerHTML;
    document.title = nextDocument.title;
    clearPageInitFlagsForPath(destinationPathname);

    /* Home ma duży scrollY w pinie hero — bez resetu widać manifesto / treść pod hero. */
    if (isProfilePath(destinationPathname)) {
      forceScrollDocumentToTopImmediate();
    }

    if (isNikodemProfilePath(destinationPathname)) {
      document.documentElement.setAttribute("data-nikodem-hero-await-reveal", "");
      document.querySelector(".nikodem-editorial-stage")?.classList.add("nikodem-hero-reveal--pending");
    }

    if (isKacperProfilePath(destinationPathname)) {
      document.documentElement.setAttribute("data-kacper-hero-await-reveal", "");
      document.documentElement.setAttribute("data-nikodem-hero-await-reveal", "");
      document.querySelector(".nikodem-editorial-stage")?.classList.add("nikodem-hero-reveal--pending");
    }

    return scripts;
  }

  async function runPostSwapInitialization(scripts, destinationUrl, options = {}) {
    const { skipProfileBootstrap = false } = options;
    const destPath = new URL(destinationUrl, location.href).pathname || "";
    let scriptsForExec = isIndexPath(destPath)
      ? scripts.filter(({ script }) => !isHomeEsModuleScript(script, destinationUrl))
      : scripts;
    if (skipProfileBootstrap) {
      scriptsForExec = scriptsForExec.filter(
        ({ script }) => !isProfileEsModuleScript(script, destinationUrl),
      );
    }

    await executeScriptsSequentially(scriptsForExec, destinationUrl);
    if (!skipProfileBootstrap) {
      if (isNikodemProfilePath(destPath)) {
        await runNikodemProfileBootstrapAfterSwap();
      }
      if (isKacperProfilePath(destPath)) {
        await runKacperProfileBootstrapAfterSwap();
      }
    }
    if (isIndexPath(destPath)) {
      if (!shouldRestoreHeroSelectionOnHome()) {
        forceScrollWindowToTop();
      }
      await reinitHomeEsModules();
    }
    replayLifecycleEvents();
    if (isIndexPath(destPath)) {
      await reinitHomeHeroAmbientEffects();
    }
    updateGlobalAuthorCreditVisibility();
  }

  async function runNikodemProfileBootstrapAfterSwap() {
    try {
      window.__group221SpaProfileNav = true;
      const { bootstrapNikodemProfilePage } = await import(
        "/features/nikodem/nikodem-profile-runtime.js",
      );
      bootstrapNikodemProfilePage(document);
      if (typeof window.ScrollTrigger?.refresh === "function") {
        requestAnimationFrame(() => {
          try {
            window.ScrollTrigger.refresh(true);
          } catch (_e) {}
        });
      }
    } catch (_e) {
    } finally {
      delete window.__group221SpaProfileNav;
    }
  }

  async function runKacperProfileBootstrapAfterSwap() {
    try {
      window.__group221SpaProfileNav = true;
      const { bootstrapKacperProfilePage } = await import(
        "/features/kacper/kacper-profile-runtime.js",
      );
      bootstrapKacperProfilePage(document);
      if (typeof window.ScrollTrigger?.refresh === "function") {
        requestAnimationFrame(() => {
          try {
            window.ScrollTrigger.refresh(true);
          } catch (_e) {}
        });
      }
    } catch (_e) {
    } finally {
      delete window.__group221SpaProfileNav;
    }
  }

  function clearNikodemHeroAwaitReveal() {
    document.documentElement.removeAttribute("data-nikodem-hero-await-reveal");
  }

  function clearKacperHeroAwaitReveal() {
    document.documentElement.removeAttribute("data-kacper-hero-await-reveal");
  }

  /** SPA: odblokuj hero tylko gdy zostaje data-*-hero-await-reveal (init profilu nie wystartował). */
  function releaseProfileHeroRevealGateIfStuck() {
    const root = document.documentElement;
    const stage = document.querySelector(".nikodem-editorial-stage");
    const stuck =
      root.hasAttribute("data-nikodem-hero-await-reveal") ||
      root.hasAttribute("data-kacper-hero-await-reveal");
    if (!stuck) return;

    root.removeAttribute("data-nikodem-hero-await-reveal");
    root.removeAttribute("data-kacper-hero-await-reveal");
    if (stage instanceof HTMLElement) {
      stage.classList.remove("nikodem-hero-reveal--pending");
    }
  }

  async function finishProfilePageSwapTail(scripts, destHref, ctx) {
    const {
      enteringNikodemProfile,
      enteringKacperProfile,
      enteringIndexFromProfile,
      finishProfileVideoHandoff,
    } = ctx;

    await runPostSwapInitialization(scripts, destHref, { skipProfileBootstrap: true });
    await finishProfileVideoHandoff();
    if (enteringNikodemProfile) {
      await runNikodemProfileBootstrapAfterSwap();
    }
    if (enteringKacperProfile) {
      await runKacperProfileBootstrapAfterSwap();
    }
    if (enteringNikodemProfile) {
      clearNikodemHeroAwaitReveal();
    }
    if (enteringKacperProfile) {
      clearKacperHeroAwaitReveal();
    }
    releaseProfileHeroRevealGateIfStuck();

    if (!enteringIndexFromProfile) {
      forceScrollWindowToTop();
      setTimeout(forceScrollWindowToTop, 0);
    } else if (typeof window.group221SyncHomeScrollToHeroSelection === "function") {
      window.group221SyncHomeScrollToHeroSelection();
      setTimeout(() => {
        window.group221SyncHomeScrollToHeroSelection?.();
      }, 0);
    }
  }

  async function finishGenericSwapTail(scripts, destHref, ctx) {
    const { enteringIndexFromProfile, finishProfileVideoHandoff } = ctx;
    await runPostSwapInitialization(scripts, destHref);
    await finishProfileVideoHandoff();
    if (!enteringIndexFromProfile) {
      forceScrollWindowToTop();
      setTimeout(forceScrollWindowToTop, 0);
    } else if (typeof window.group221SyncHomeScrollToHeroSelection === "function") {
      window.group221SyncHomeScrollToHeroSelection();
      setTimeout(() => {
        window.group221SyncHomeScrollToHeroSelection?.();
      }, 0);
    }
  }

  function clearProfileViewTransitionFlags() {
    document.documentElement.removeAttribute("data-vt-profile-enter");
    document.documentElement.removeAttribute("data-vt-profile-exit-to-home");
    document.documentElement.removeAttribute("data-vt-nikodem-enter");
    document.documentElement.removeAttribute("data-vt-kacper-enter");
  }

  async function navigateToCanonicalHome() {
    const homeUrl = getCanonicalHomeUrl();
    const herePath = location.pathname || "";

    if (isIndexPath(herePath) && isHomeScrollInfrastructureReady()) {
      forceScrollWindowToTop();
      const ln = window.group221HomeLenis;
      if (ln && typeof ln.scrollTo === "function") {
        try {
          ln.scrollTo(0, { immediate: true });
        } catch (_e) {}
      }
      if (typeof window.group221SyncHomeScrollToTop === "function") {
        try {
          window.group221SyncHomeScrollToTop();
        } catch (_e) {}
      }
      return;
    }

    if (isIndexPath(herePath) && isHomePageContentPresent()) {
      await reinitHomeEsModules();
      forceScrollWindowToTop();
      return;
    }

    if (window.navigation && typeof window.navigation.navigate === "function") {
      window.navigation.navigate(homeUrl);
      return;
    }
    window.location.assign(homeUrl);
  }

  window.group221NavigateToCanonicalHome = navigateToCanonicalHome;

  function onBrand221Click(event) {
    const brand = event.target.closest("a.brand-221");
    if (!brand) return;
    if (brand.dataset.nikodemBrandHandoff === "merged") {
      event.preventDefault();
      return;
    }
    event.preventDefault();
    navigateToCanonicalHome();
  }

  /* Poza tracked listeners — przetrwa cleanupGlobalListeners przy SPA swap. */
  nativeDocumentAdd("click", onBrand221Click, true);

  bindGlobalAuthorCreditHandlers();
  ensureGlobalAuthorCredit();
  updateGlobalAuthorCreditVisibility();

  NAVIGATION.addEventListener("navigate", (event) => {
    if (!shouldHandleNavigation(event)) return;

    const destinationUrl = resolveNavigationDestination(event.destination.url);
    const pathname = destinationUrl.pathname || "";
    const destHref = destinationUrl.href;

    if (pathname.endsWith("holyfive.html") || pathname.endsWith("/holyfive.html") || pathname.endsWith("akademia.html") || pathname.endsWith("/akademia.html")) {
      return; // Fallback do natywnej nawigacji (bez `event.intercept`)
    }

    event.intercept({
      scroll: "manual",
      handler: async () => {
        function applyHardNavigationFallback() {
          location.href = destHref;
        }

        const currentPathname = location.pathname || "";
        const enteringProfilePage = isProfilePath(pathname);
        const enteringNikodemProfile = isNikodemProfilePath(pathname);
        const enteringKacperProfile = isKacperProfilePath(pathname);
        const enteringIndexFromProfile =
          isIndexPath(pathname) && isProfilePath(currentPathname);
        const enteringProfileFromHome =
          enteringProfilePage && isIndexPath(currentPathname);
        if (enteringIndexFromProfile) {
          markHeroSelectionReturnOnHome();
        }
        const needsProfileVtHandoff = enteringProfileFromHome || enteringIndexFromProfile;
        const profileLayoutModulePromise = enteringProfilePage
          ? loadProfileLayoutSyncModule()
          : null;
        const handoffModulePromise = needsProfileVtHandoff
          ? loadHeroProfileVideoHandoffModule()
          : null;

        if (needsProfileVtHandoff) {
          document.documentElement.setAttribute("data-vt-profile-enter", "");
        }
        if (enteringNikodemProfile) {
          document.documentElement.setAttribute("data-vt-nikodem-enter", "");
          document.documentElement.setAttribute("data-nikodem-hero-await-reveal", "");
        }
        if (enteringKacperProfile) {
          document.documentElement.setAttribute("data-vt-kacper-enter", "");
          document.documentElement.setAttribute("data-kacper-hero-await-reveal", "");
          document.documentElement.setAttribute("data-nikodem-hero-await-reveal", "");
        }

        let response;

        try {
          response = await fetch(destHref, {
            method: "GET",
            signal: event.signal,
            headers: { Accept: "text/html,application/xhtml+xml" },
          });
        } catch (error) {
          if (error?.name !== "AbortError") applyHardNavigationFallback();
          document.documentElement.removeAttribute("data-vt-profile-enter");
          document.documentElement.removeAttribute("data-vt-nikodem-enter");
          document.documentElement.removeAttribute("data-vt-kacper-enter");
          return;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!response.ok || !contentType.includes("text/html")) {
          applyHardNavigationFallback();
          document.documentElement.removeAttribute("data-vt-profile-enter");
          document.documentElement.removeAttribute("data-vt-nikodem-enter");
          document.documentElement.removeAttribute("data-vt-kacper-enter");
          return;
        }

        let html;
        try {
          html = await response.text();
        } catch {
          applyHardNavigationFallback();
          document.documentElement.removeAttribute("data-vt-profile-enter");
          document.documentElement.removeAttribute("data-vt-nikodem-enter");
          document.documentElement.removeAttribute("data-vt-kacper-enter");
          return;
        }

        const parser = new DOMParser();
        const nextDocument = parser.parseFromString(html, "text/html");
        if (!nextDocument || !nextDocument.body || !nextDocument.head) {
          applyHardNavigationFallback();
          document.documentElement.removeAttribute("data-vt-profile-enter");
          document.documentElement.removeAttribute("data-vt-nikodem-enter");
          document.documentElement.removeAttribute("data-vt-kacper-enter");
          return;
        }

        let handoffApi = null;
        if (handoffModulePromise) {
          try {
            handoffApi = await handoffModulePromise;
            handoffApi.setProfileEnterTransitionActive(true);
          } catch (_e) {
            handoffApi = null;
          }
        }

        const applyNavigation = () => {
          cleanupGlobalListeners();
          cleanupNikodemScrollInfrastructureBeforeSwap();
          cleanupHomeScrollInfrastructureBeforeSwap();
          if (handoffApi && enteringNikodemProfile) {
            handoffApi.dismissHomeNikodemProfileVideo();
          }
          extractNikodemPhotoHandoffBeforeSwap(
            handoffApi,
            enteringNikodemProfile,
            enteringProfileFromHome,
          );
          if (enteringIndexFromProfile) {
            prepareProfilePageExitBeforeSwap();
          }
          return replaceDocumentContent(nextDocument, destHref);
        };

        const finishProfileVideoHandoff = async () => {
          const enteringHome = isIndexPath(pathname);
          if (!handoffApi) {
            clearProfileViewTransitionFlags();
            return;
          }
          try {
            const { bindHeroProfilePreviewVideos, mountHeroProfilePreview } = await import(
              "/shared/scripts/hero-profile-preview.js",
            );
            if (enteringNikodemProfile) {
              handoffApi.clearHandoffVideo();
              const preview = document.querySelector(
                ".nikodem-page-hero__preview-shell [data-hero-profile='nikodem']",
              );
              if (preview) {
                handoffApi.consumeProfileRoleHandoff(preview);
                if (!preview.querySelector(".hero-profile-preview__photos--nikodem-expanded")) {
                  mountHeroProfilePreview(preview, "nikodem");
                }
              }
            } else if (enteringKacperProfile) {
              const preview = document.querySelector(
                ".kacper-page-hero__preview-shell [data-hero-profile='kacper']",
              );
              if (preview) {
                handoffApi.consumeProfileRoleHandoff(preview);
                if (!preview.querySelector(".hero-profile-preview__photos--nikodem-expanded")) {
                  mountHeroProfilePreview(preview, "kacper");
                }
              }
            } else if (enteringHome) {
              const profileSide = /\/kacper/i.test(currentPathname) ? "kacper" : "nikodem";
              const preview = document.querySelector(
                profileSide === "kacper"
                  ? ".hero .hero-profile-preview--kacper[data-hero-profile='kacper']"
                  : ".hero .hero-profile-preview--nikodem[data-hero-profile='nikodem']",
              );
              if (preview) {
                handoffApi.consumeProfileRoleHandoff(preview);
                mountHeroProfilePreview(preview, profileSide);
                bindHeroProfilePreviewVideos(preview);
              }
              handoffApi.consumeHandoffVideoIntoHome();
            } else if (enteringProfileFromHome) {
              const profileSide = /\/kacper/i.test(pathname) ? "kacper" : "nikodem";
              const preview = document.querySelector(
                profileSide === "kacper"
                  ? ".kacper-page-hero__preview-shell [data-hero-profile='kacper']"
                  : ".nikodem-page-hero__preview-shell [data-hero-profile='nikodem']",
              );
              if (preview) {
                handoffApi.consumeProfileRoleHandoff(preview);
                if (profileSide === "nikodem") {
                  mountHeroProfilePreview(preview, "nikodem");
                } else if (
                  profileSide === "kacper" &&
                  !preview.querySelector(".hero-profile-preview__photos--nikodem-expanded")
                ) {
                  mountHeroProfilePreview(preview, "kacper");
                }
                bindHeroProfilePreviewVideos(preview);
              }
            }
          } catch (_e) {}
          handoffApi.setProfileEnterTransitionActive(false);
          clearProfileViewTransitionFlags();
        };

        const getProfileRoleHandoffPreview = () => {
          if (isIndexPath(pathname)) {
            const side = /\/kacper/i.test(currentPathname) ? "kacper" : "nikodem";
            return side === "kacper"
              ? document.querySelector(".hero .hero-profile-preview--kacper")
              : document.querySelector(".hero .hero-profile-preview--nikodem");
          }
          if (/\/kacper/i.test(pathname)) {
            return document.querySelector(".kacper-page-hero__preview-shell .hero-profile-preview--kacper");
          }
          if (/\/nikodem/i.test(pathname)) {
            return document.querySelector(".nikodem-page-hero__preview-shell .hero-profile-preview--nikodem");
          }
          return null;
        };

        const getNikodemPhotoLayoutOptions = () =>
          consumeNikodemPhotoHandoffLayoutOptions(
            handoffApi,
            enteringNikodemProfile,
            enteringProfileFromHome,
          );

        const runSwapTail = async (scripts) => {
          await syncProfileLayoutBeforeViewTransitionCapture(
            pathname,
            profileLayoutModulePromise,
            getNikodemPhotoLayoutOptions(),
          );
          handoffApi?.startHandoffPositionSync(
            enteringNikodemProfile
              ? undefined
              : () => document.querySelector(handoffApi.getHandoffVideoHomeTargetSelector()),
          );
          if (enteringProfileFromHome || enteringIndexFromProfile) {
            handoffApi?.startRoleHandoffPositionSync?.(getProfileRoleHandoffPreview);
          }
          const tailCtx = {
            enteringNikodemProfile,
            enteringKacperProfile,
            enteringIndexFromProfile,
            finishProfileVideoHandoff,
          };
          if (enteringNikodemProfile || enteringKacperProfile) {
            await finishProfilePageSwapTail(scripts, destHref, tailCtx);
            return;
          }
          await finishGenericSwapTail(scripts, destHref, tailCtx);
        };

        if (!supportsViewTransition) {
          if ((enteringProfileFromHome || enteringIndexFromProfile) && handoffApi) {
            handoffApi.extractProfileRolesBeforeViewTransition({ toPathname: pathname });
          }
          const scripts = applyNavigation();
          if (enteringProfileFromHome) {
            forceScrollDocumentToTopImmediate();
          }
          if ((enteringProfileFromHome || enteringIndexFromProfile) && handoffApi) {
            handoffApi.reanchorProfileRolesAfterBodySwap({ pathname });
          }
          await runSwapTail(scripts);
          return;
        }

        if ((enteringProfileFromHome || enteringIndexFromProfile) && handoffApi) {
          handoffApi.extractProfileRolesBeforeViewTransition({ toPathname: pathname });
        }
        if (handoffApi && enteringNikodemProfile) {
          handoffApi.dismissHomeNikodemProfileVideo();
        }

        let scriptsToRun = [];
        const transition = document.startViewTransition(async () => {
          scriptsToRun = applyNavigation();
          if (enteringProfileFromHome) {
            forceScrollDocumentToTopImmediate();
          }
          await syncProfileLayoutBeforeViewTransitionCapture(
            pathname,
            profileLayoutModulePromise,
            getNikodemPhotoLayoutOptions(),
          );
          if ((enteringProfileFromHome || enteringIndexFromProfile) && handoffApi) {
            handoffApi.reanchorProfileRolesAfterBodySwap({ pathname });
          }
          handoffApi?.startHandoffPositionSync(
            enteringNikodemProfile
              ? undefined
              : () => document.querySelector(handoffApi.getHandoffVideoHomeTargetSelector()),
          );
          if (enteringProfileFromHome || enteringIndexFromProfile) {
            handoffApi?.startRoleHandoffPositionSync?.(getProfileRoleHandoffPreview);
          }
          window.scrollTo(0, 0);
        });

        transition.ready.then(() => window.scrollTo(0, 0));

        try {
          await transition.finished;
          window.scrollTo(0, 0);
          document.documentElement.scrollTop = 0;
          if (document.body) document.body.scrollTop = 0;
          const tailCtx = {
            enteringNikodemProfile,
            enteringKacperProfile,
            enteringIndexFromProfile,
            finishProfileVideoHandoff,
          };
          if (enteringNikodemProfile || enteringKacperProfile) {
            await finishProfilePageSwapTail(scriptsToRun, destHref, tailCtx);
          } else {
            await finishGenericSwapTail(scriptsToRun, destHref, tailCtx);
          }
        } catch {
          handoffApi?.clearAllHandoff?.();
          handoffApi?.clearHandoffPhoto?.();
          handoffApi?.setProfileEnterTransitionActive(false);
          document.documentElement.removeAttribute("data-vt-profile-enter");
          document.documentElement.removeAttribute("data-vt-profile-exit-to-home");
          document.documentElement.removeAttribute("data-vt-nikodem-enter");
          document.documentElement.removeAttribute("data-vt-kacper-enter");
          document.documentElement.removeAttribute("data-nikodem-hero-await-reveal");
          document.documentElement.removeAttribute("data-kacper-hero-await-reveal");
          applyHardNavigationFallback();
        }
      },
    });
  });
})();
