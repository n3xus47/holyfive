import * as perlinNoise from "https://esm.sh/@chriscourses/perlin-noise";
import { observeCanvasLifecycle } from "../../shared/lib/canvas-lifecycle.js";

// Editable values
let thresholdIncrement = 5;
let thickLineThresholdMultiple = 3;
const BASE_RES = 6; // mniejsze komórki = gładsze kontury (przy scale≈1)
let simRes = BASE_RES;
let baseZOffset = 0.00025; // prędkość animacji (mnożone przez delta*60 dla niezależności od FPS)
const MAX_RENDER_DPR = 4;
/** Home overlay jest skalowany GSAP nawet do ~500× — dodatkowy DPR tylko puchnie bufor. */
const HOME_FULLPAGE_DPR_CAP = 1.25;

/** Zanim hero ma class hero--221-zoom-settled, nie redrawuj Perlin (snapshot). */
function isHeroZoomSettled() {
  return !!document.querySelector(".hero.hero--221-zoom-settled");
}
const DEFAULT_PALETTE = {
  bg: "#F0F2F5",
  lineMain: "rgba(90, 90, 90, 0.5)",
  lineAccent: "rgba(120, 120, 120, 0.4)",
};
const HOME_PALETTE = {
  bg: "#000000",
  lineMain: "rgba(255, 255, 255, 0.5)",
  lineAccent: "rgba(255, 255, 255, 0.85)",
};
const FACES_PALETTE = {
  bg: "#000000",
  lineMain: "rgba(255, 117, 31, 0.52)",
  lineAccent: "rgba(255, 117, 31, 0.88)",
};
const WIPE_PALETTE = {
  lineMain: "rgba(255, 255, 255, 0.46)",
  lineAccent: "rgba(255, 255, 255, 0.8)",
};
/** ~0.35–0.4 s do prawie pełnego dojścia (exp. ease, nie skok). */
const MAP_WIPE_LERP_SPEED = 11.5;

let mapGreenStartNorm = 0;
let mapGreenEndNorm = 1;

// Interakcja myszy – silniejszy, bardziej widoczny efekt
const MOUSE_RADIUS = 18;
const MOUSE_STRENGTH = 0.012;
const MOUSE_DECAY = 0.985; // wolniejszy zanik „wybrzuszenia”

let canvas;
let ctx;
let inputValues = [];
let isFullpage = false;

let currentThreshold = 0;
let cols = 0;
let rows = 0;
let logicalW = 0;
let logicalH = 0;
let zOffset = 0;
let zBoostValues = [];
let noiseMin = 100;
let noiseMax = 0;

let mousePos = { x: -999, y: -999 };
let lastTime = 0;
let animateRafId = 0;
/** @type {ReturnType<typeof observeCanvasLifecycle> | null} */
let canvasLifecycle = null;
let hasDrawnFrame = false;
/** @type {HTMLImageElement | null} */
let zoomFreezeImg = null;
let zoomFreezeActive = false;
let zoomFreezePollHandler = null;

function disposeCanvasLifecycle() {
  canvasLifecycle?.dispose();
  canvasLifecycle = null;
}

function ensureCanvasLifecycle() {
  if (!canvas || !isFullpage || canvasLifecycle) return;
  canvasLifecycle = observeCanvasLifecycle({
    target: canvas,
    layerEls: canvas,
    // Contour field is slow; 30 FPS in-view matches near-band and frees the hero stack.
    activeFps: 30,
    pauseOnScroll: true,
    compositorHideOnScrollPause: true,
    onChange() {
      if (!canvasLifecycle?.wantsLoop()) {
        if (animateRafId) {
          cancelAnimationFrame(animateRafId);
          animateRafId = 0;
        }
        return;
      }
      if (!animateRafId) {
        lastTime = 0;
        animateRafId = requestAnimationFrame(animate);
      }
    },
  });
}

function readOverlayScale() {
  if (!isFullpage || !canvas) return 1;
  const parent = canvas.parentElement;
  if (!parent) return 1;
  const t = getComputedStyle(parent).transform;
  if (!t || t === "none") return 1;
  if (t.startsWith("matrix3d(")) {
    const p = t.slice(9, -1).split(",").map(Number.parseFloat);
    return Math.max(Math.abs(p[0]) || 0, Math.abs(p[5]) || 0) || 1;
  }
  if (t.startsWith("matrix(")) {
    const p = t.slice(7, -1).split(",").map(Number.parseFloat);
    return Math.abs(p[0]) || 1;
  }
  return 1;
}

/** Przy dużym zoomie GSAP widać tylko środek — gęsta siatka jest niewidoczna i kosztowna. */
function adaptiveSimRes(overlayScale) {
  if (!isFullpage || overlayScale <= 1.05) return BASE_RES;
  const boosted = BASE_RES * Math.sqrt(Math.min(overlayScale, 100));
  return Math.min(64, Math.max(BASE_RES, Math.round(boosted)));
}

function rebuildSimGrid(nextRes) {
  simRes = nextRes;
  if (logicalW <= 0 || logicalH <= 0) {
    cols = 0;
    rows = 0;
    return;
  }
  cols = Math.floor(logicalW / simRes) + 1;
  rows = Math.floor(logicalH / simRes) + 1;
  zBoostValues = Array.from({ length: rows }, () => Array(cols + 1).fill(0));
}

function ensureZoomFreezeSnapshot() {
  if (!canvas || !isFullpage || zoomFreezeActive) return;
  try {
    const url = canvas.toDataURL("image/png");
    if (!zoomFreezeImg) {
      zoomFreezeImg = document.createElement("img");
      zoomFreezeImg.className = "home-perlin-canvas home-perlin-canvas--zoom-freeze";
      zoomFreezeImg.alt = "";
      zoomFreezeImg.setAttribute("aria-hidden", "true");
      canvas.parentElement?.insertBefore(zoomFreezeImg, canvas);
    }
    zoomFreezeImg.src = url;
    zoomFreezeImg.hidden = false;
    canvas.classList.add("is-zoom-frozen");
    zoomFreezeActive = true;
    syncZoomFreezeImgForScrollPause();
  } catch (_) {
    canvas.classList.add("is-zoom-frozen");
    zoomFreezeActive = true;
  }
}

function syncZoomFreezeImgForScrollPause() {
  if (!zoomFreezeImg || !zoomFreezeActive) return;
  // Masked freeze img under GSAP scrub is costly — hide while scrolling; show again at rest.
  zoomFreezeImg.hidden = document.documentElement.hasAttribute("data-canvas-scroll-paused");
}

function clearZoomFreezeSnapshot() {
  if (!zoomFreezeActive) return;
  zoomFreezeImg?.remove();
  zoomFreezeImg = null;
  canvas?.classList.remove("is-zoom-frozen");
  zoomFreezeActive = false;
}

function bindZoomFreezePoll() {
  if (zoomFreezePollHandler || typeof window === "undefined") return;
  zoomFreezePollHandler = () => {
    syncZoomFreezeImgForScrollPause();
    if (!zoomFreezeActive || !canvas) return;
    if (!isHeroZoomSettled()) return;
    clearZoomFreezeSnapshot();
    if (!animateRafId && (!canvasLifecycle || canvasLifecycle.wantsLoop())) {
      lastTime = 0;
      animateRafId = requestAnimationFrame(animate);
    }
  };
  window.addEventListener("scroll", zoomFreezePollHandler, { passive: true });
  window.addEventListener("resize", zoomFreezePollHandler, { passive: true });
}

function unbindZoomFreezePoll() {
  if (!zoomFreezePollHandler) return;
  window.removeEventListener("scroll", zoomFreezePollHandler);
  window.removeEventListener("resize", zoomFreezePollHandler);
  zoomFreezePollHandler = null;
}
let resizeHandler = null;
let fullpagePointerHandlers = null;

/** Faces-phase lub post–golden-hour: czarne tło + emerald linie (home fullpage). */
function isHomeEmeraldPhase() {
  return (
    document.documentElement.hasAttribute("data-hero-faces-phase") ||
    document.documentElement.hasAttribute("data-hero-post-golden-hour") ||
    !!document.querySelector(".hero.hero--faces-phase")
  );
}

function getHomeMapWipeSide() {
  const side = document.documentElement.getAttribute("data-hero-map-wipe-side");
  return side === "left" || side === "center" || side === "right" ? side : null;
}

function getHomePerlinPalette() {
  /* Po golden hour od razu emerald — bez pośredniej szarej mapy przed faces-phase. */
  return isFullpage ? HOME_PALETTE : DEFAULT_PALETTE;
}

function getMapWipeTargets(side) {
  if (side === "left") return { start: 0, end: 1 / 3 };
  if (side === "center") return { start: 1 / 3, end: 2 / 3 };
  if (side === "right") return { start: 2 / 3, end: 1 };
  return { start: 0, end: 1 };
}

function tickMapWipeAnimation(deltaSec) {
  const side = getHomeMapWipeSide();
  const targets = getMapWipeTargets(side);
  const blend = 1 - Math.exp(-MAP_WIPE_LERP_SPEED * deltaSec);
  mapGreenStartNorm += (targets.start - mapGreenStartNorm) * blend;
  mapGreenEndNorm += (targets.end - mapGreenEndNorm) * blend;
}

function mapWipeHasWhiteZones() {
  const startPx = mapGreenStartNorm * logicalW;
  const endPx = mapGreenEndNorm * logicalW;
  return startPx > 0.75 || endPx < logicalW - 0.75;
}

function clipOutsideGreenZone() {
  if (!ctx || logicalW <= 0 || logicalH <= 0) return;

  const startPx = mapGreenStartNorm * logicalW;
  const endPx = mapGreenEndNorm * logicalW;
  ctx.beginPath();

  if (startPx > 0.5) {
    ctx.rect(0, 0, startPx, logicalH);
  }
  if (endPx < logicalW - 0.5) {
    ctx.rect(endPx, 0, logicalW - endPx, logicalH);
  }

  ctx.clip();
}

function resetMapWipeAnimation() {
  mapGreenStartNorm = 0;
  mapGreenEndNorm = 1;
}

function clearFullpagePointerHandlers() {
  if (!fullpagePointerHandlers) return;
  const h = fullpagePointerHandlers;
  document.removeEventListener("mousemove", h.move, h.moveOpts);
  document.removeEventListener("mouseleave", h.clear);
  document.removeEventListener("touchstart", h.touchStart, h.touchStartOpts);
  document.removeEventListener("touchmove", h.touchMove, h.touchMoveOpts);
  document.removeEventListener("touchend", h.clear);
  document.removeEventListener("touchcancel", h.clear);
  fullpagePointerHandlers = null;
}

/** Natychmiastowe przemalowanie tła — bez czekania na kolejną klatkę RAF (przejście golden hour → profil). */
export function repaintHomePerlinBackground() {
  if (!canvas || !ctx || cols <= 0 || rows <= 0) return;
  ctx.fillStyle = getHomePerlinPalette().bg;
  ctx.fillRect(0, 0, logicalW, logicalH);
}

export function stopHomePerlinBackground() {
  if (animateRafId) {
    cancelAnimationFrame(animateRafId);
    animateRafId = 0;
  }
  disposeCanvasLifecycle();
  if (resizeHandler) {
    window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
  }
  clearFullpagePointerHandlers();
  lastTime = 0;
  hasDrawnFrame = false;
  lastBufferBucket = "";
  unbindZoomFreezePoll();
  clearZoomFreezeSnapshot();
  zoomFreezeImg?.remove();
  zoomFreezeImg = null;
  canvas = null;
  ctx = null;
  resetMapWipeAnimation();
}

function setupCanvas() {
  const homeCanvas = document.getElementById("home-perlin-canvas");
  const academyCanvas = document.getElementById("res-canvas");
  const canvasElement = homeCanvas || academyCanvas;
  if (!canvasElement) return;

  isFullpage = !!homeCanvas;
  const canvasCtx = canvasElement.getContext("2d", { alpha: false });
  if (!canvasCtx) return;

  canvas = canvasElement;
  ctx = canvasCtx;
  canvasSize();
  if (resizeHandler) window.removeEventListener("resize", resizeHandler);
  resizeHandler = () => canvasSize();
  window.addEventListener("resize", resizeHandler);

  function setPointerFromEvent(e) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX ?? e.touches?.[0]?.clientX) - rect.left;
    const y = (e.clientY ?? e.touches?.[0]?.clientY) - rect.top;
    mousePos.x = x;
    mousePos.y = y;
  }

  function clearPointer() {
    mousePos.x = -999;
    mousePos.y = -999;
  }

  if (isFullpage) {
    clearFullpagePointerHandlers();
    const moveOpts = { passive: true };
    const touchStartOpts = { passive: true };
    const touchMoveOpts = { passive: true };
    const move = (e) => setPointerFromEvent(e);
    const touchStart = (e) => setPointerFromEvent(e);
    const touchMove = (e) => setPointerFromEvent(e);
    document.addEventListener("mousemove", move, moveOpts);
    document.addEventListener("mouseleave", clearPointer);
    document.addEventListener("touchstart", touchStart, touchStartOpts);
    document.addEventListener("touchmove", touchMove, touchMoveOpts);
    document.addEventListener("touchend", clearPointer);
    document.addEventListener("touchcancel", clearPointer);
    fullpagePointerHandlers = {
      move,
      clear: clearPointer,
      touchStart,
      touchMove,
      moveOpts,
      touchStartOpts,
      touchMoveOpts,
    };
  } else {
    const banner = canvas.closest(".academy-banner");
    if (!banner) return;
    banner.addEventListener("mousemove", setPointerFromEvent, { passive: true });
    banner.addEventListener("mouseleave", clearPointer);
    banner.addEventListener("touchstart", (e) => { e.preventDefault(); setPointerFromEvent(e); }, { passive: false });
    banner.addEventListener("touchmove", (e) => { e.preventDefault(); setPointerFromEvent(e); }, { passive: false });
    banner.addEventListener("touchend", clearPointer);
    banner.addEventListener("touchcancel", clearPointer);
  }
}

function canvasSize() {
  const baseDpr = window.devicePixelRatio || 1;
  const overlayScale = readOverlayScale();
  // Przy silnym zoomie GSAP widać tylko środek — pełny bufor to koszt kompozytora bez detalu.
  let bufferScale = 1;
  if (isFullpage && overlayScale > 1.2) {
    const capped = Math.min(overlayScale, 64);
    bufferScale = Math.max(0.12, 1 / Math.sqrt(capped));
  }
  const dpr = Math.min(
    baseDpr * (isFullpage ? HOME_FULLPAGE_DPR_CAP : 1) * bufferScale,
    MAX_RENDER_DPR
  );
  let w, h;
  if (isFullpage) {
    const parent = canvas?.parentElement;
    const inOverlay =
      parent?.classList?.contains?.("overlay") === true;
    if (inOverlay) {
      w = Math.max(1, parent.clientWidth || window.innerWidth);
      h = Math.max(1, parent.clientHeight || window.innerHeight);
    } else {
      w = window.innerWidth;
      h = window.innerHeight;
    }
  } else {
    const rect = canvas.parentElement?.getBoundingClientRect() || canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
  }
  const nextW = Math.max(1, Math.ceil(w * dpr));
  const nextH = Math.max(1, Math.ceil(h * dpr));
  if (canvas.width !== nextW || canvas.height !== nextH) {
    canvas.width = nextW;
    canvas.height = nextH;
  }
  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(dpr, dpr);
  logicalW = w;
  logicalH = h;
  lastBufferBucket = bufferBucketForScale(overlayScale);
  rebuildSimGrid(adaptiveSimRes(overlayScale));
}

let lastBufferBucket = "";

function bufferBucketForScale(overlayScale) {
  if (!isFullpage || overlayScale <= 1.2) return "1";
  if (overlayScale > 40) return "lo";
  if (overlayScale > 8) return "mid";
  if (overlayScale > 2.5) return "hi";
  return "1";
}

function maybeResizeForOverlayScale() {
  const overlayScale = readOverlayScale();
  const bucket = bufferBucketForScale(overlayScale);
  if (bucket === lastBufferBucket) {
    const nextSimRes = adaptiveSimRes(overlayScale);
    if (nextSimRes !== simRes) rebuildSimGrid(nextSimRes);
    return;
  }
  lastBufferBucket = bucket;
  canvasSize();
}

/** Above this overlay scale the 221 hole fills the viewport — a freeze snapshot is solid gray over the photo. */
const DEEP_ZOOM_SKIP_PERLIN = 16;

function animate(timestamp) {
  if (canvasLifecycle && !canvasLifecycle.wantsLoop()) {
    animateRafId = 0;
    return;
  }

  const overlayScale = readOverlayScale();
  maybeResizeForOverlayScale();

  if (zoomFreezeActive) clearZoomFreezeSnapshot();

  const now = timestamp ?? performance.now();
  if (canvasLifecycle?.shouldThrottleFrame(now)) {
    animateRafId = requestAnimationFrame(animate);
    return;
  }

  const deltaSec = lastTime ? (now - lastTime) / 1000 : 1 / 60;
  lastTime = now;
  const deltaClamped = Math.min(deltaSec, 0.1); // cap przy pierwszej klatce / tab switch

  if (cols <= 0 || rows <= 0) {
    animateRafId = requestAnimationFrame(animate);
    return;
  }

  if (mousePos.x > -900) mouseOffset();

  const palette = getHomePerlinPalette();
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, logicalW, logicalH);
  zOffset += baseZOffset * deltaClamped * 60; // stała prędkość względem 60 FPS
  generateNoise();

  if (isFullpage && isHomeEmeraldPhase()) {
    tickMapWipeAnimation(deltaClamped);
  } else {
    resetMapWipeAnimation();
  }

  const roundedNoiseMin = Math.floor(noiseMin / thresholdIncrement) * thresholdIncrement;
  const roundedNoiseMax = Math.ceil(noiseMax / thresholdIncrement) * thresholdIncrement;
  const hasWhiteZones = mapWipeHasWhiteZones();
  for (let threshold = roundedNoiseMin; threshold < roundedNoiseMax; threshold += thresholdIncrement) {
    currentThreshold = threshold;
    renderAtThresholdWithPalette(palette);
    if (hasWhiteZones) {
      ctx.save();
      clipOutsideGreenZone();
      renderAtThresholdWithPalette(WIPE_PALETTE);
      ctx.restore();
    }
  }
  noiseMin = 100;
  noiseMax = 0;
  hasDrawnFrame = true;

  animateRafId = requestAnimationFrame(animate);
}

function mouseOffset() {
  const cx = mousePos.x / simRes;
  const cy = mousePos.y / simRes;
  const radiusSq = MOUSE_RADIUS * MOUSE_RADIUS;
  for (let i = -MOUSE_RADIUS; i <= MOUSE_RADIUS; i++) {
    for (let j = -MOUSE_RADIUS; j <= MOUSE_RADIUS; j++) {
      const dy = Math.floor(cy) + i;
      const dx = Math.floor(cx) + j;
      const distSq = i * i + j * j;
      if (distSq > radiusSq) continue;
      if (zBoostValues[dy]?.[dx] === undefined) continue;
      zBoostValues[dy][dx] += MOUSE_STRENGTH * (1 - distSq / radiusSq);
    }
  }
}

function generateNoise() {
  for (let y = 0; y < rows; y++) {
    let row = inputValues[y];
    if (!row || row.length !== cols + 1) {
      row = new Array(cols + 1);
      inputValues[y] = row;
    }
    const boostRow = zBoostValues[y];
    for (let x = 0; x <= cols; x++) {
      const boost = boostRow?.[x] ?? 0;
      row[x] = perlinNoise.noise(x * 0.02, y * 0.02, zOffset + boost) * 100;
      if (row[x] < noiseMin) noiseMin = row[x];
      if (row[x] > noiseMax) noiseMax = row[x];
      if (boost > 0) boostRow[x] = boost * MOUSE_DECAY;
    }
  }
  inputValues.length = rows;
}

function renderAtThresholdWithPalette(palette) {
  ctx.beginPath();
  const isThick = currentThreshold % (thresholdIncrement * thickLineThresholdMultiple) === 0;
  ctx.strokeStyle = isThick ? palette.lineAccent : palette.lineMain;
  ctx.lineWidth = isThick ? 2.5 : 1.5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (let y = 0; y < inputValues.length - 1; y++) {
    for (let x = 0; x < inputValues[y].length - 1; x++) {
      if (
        inputValues[y][x] > currentThreshold &&
        inputValues[y][x + 1] > currentThreshold &&
        inputValues[y + 1][x + 1] > currentThreshold &&
        inputValues[y + 1][x] > currentThreshold
      )
        continue;
      if (
        inputValues[y][x] < currentThreshold &&
        inputValues[y][x + 1] < currentThreshold &&
        inputValues[y + 1][x + 1] < currentThreshold &&
        inputValues[y + 1][x] < currentThreshold
      )
        continue;
      const gridValue = binaryToType(
        inputValues[y][x] > currentThreshold ? 1 : 0,
        inputValues[y][x + 1] > currentThreshold ? 1 : 0,
        inputValues[y + 1][x + 1] > currentThreshold ? 1 : 0,
        inputValues[y + 1][x] > currentThreshold ? 1 : 0
      );

      placeLines(gridValue, x, y);
    }
  }
  ctx.stroke();
}

function placeLines(gridValue, x, y) {
  const nw = inputValues[y][x];
  const ne = inputValues[y][x + 1];
  const se = inputValues[y + 1][x + 1];
  const sw = inputValues[y + 1][x];
  const r = simRes;
  let a, b, c, d;

  switch (gridValue) {
    case 1:
    case 14:
      c = [x * r + r * linInterpolate(sw, se), y * r + r];
      d = [x * r, y * r + r * linInterpolate(nw, sw)];
      line(d, c);
      break;
    case 2:
    case 13:
      b = [x * r + r, y * r + r * linInterpolate(ne, se)];
      c = [x * r + r * linInterpolate(sw, se), y * r + r];
      line(b, c);
      break;
    case 3:
    case 12:
      b = [x * r + r, y * r + r * linInterpolate(ne, se)];
      d = [x * r, y * r + r * linInterpolate(nw, sw)];
      line(d, b);
      break;
    case 11:
    case 4:
      a = [x * r + r * linInterpolate(nw, ne), y * r];
      b = [x * r + r, y * r + r * linInterpolate(ne, se)];
      line(a, b);
      break;
    case 5:
      a = [x * r + r * linInterpolate(nw, ne), y * r];
      b = [x * r + r, y * r + r * linInterpolate(ne, se)];
      c = [x * r + r * linInterpolate(sw, se), y * r + r];
      d = [x * r, y * r + r * linInterpolate(nw, sw)];
      line(d, a);
      line(c, b);
      break;
    case 6:
    case 9:
      a = [x * r + r * linInterpolate(nw, ne), y * r];
      c = [x * r + r * linInterpolate(sw, se), y * r + r];
      line(c, a);
      break;
    case 7:
    case 8:
      a = [x * r + r * linInterpolate(nw, ne), y * r];
      d = [x * r, y * r + r * linInterpolate(nw, sw)];
      line(d, a);
      break;
    case 10:
      a = [x * r + r * linInterpolate(nw, ne), y * r];
      b = [x * r + r, y * r + r * linInterpolate(ne, se)];
      c = [x * r + r * linInterpolate(sw, se), y * r + r];
      d = [x * r, y * r + r * linInterpolate(nw, sw)];
      line(a, b);
      line(c, d);
      break;
    default:
      break;
  }
}

function line(from, to) {
  ctx.moveTo(from[0], from[1]);
  ctx.lineTo(to[0], to[1]);
}

function linInterpolate(x0, x1) {
  if (x0 === x1) return 0;
  return (currentThreshold - x0) / (x1 - x0);
}

function binaryToType(nw, ne, se, sw) {
  return (nw << 3) | (ne << 2) | (se << 1) | sw;
}

function start() {
  setupCanvas();
  if (canvas && ctx) {
    ensureCanvasLifecycle();
    if (!canvasLifecycle || canvasLifecycle.wantsLoop()) {
      animateRafId = requestAnimationFrame(animate);
    }
  }
}

/** Ponowne podpięcie canvasu po SPA (powrót na index.html); moduł ES nie wykonuje się drugi raz. */
export function restartHomePerlinBackground() {
  if (!document.getElementById("home-perlin-canvas")) return;
  stopHomePerlinBackground();
  start();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", start);
} else {
  start();
}
