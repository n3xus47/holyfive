import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

var baseRotationY = Math.PI / 2;

/* Barwy firmy – używane w tle kart i w światłach 3D dla spójności i głębi */
var BRAND_RED = 0xff3131;        /* #ff3131 – główne światło czerwone, akcenty */
var BRAND_BLACK = '#07090d';     /* tło, cienie */
var BRAND_WHITE = '#ffffff';     /* delikatne akcenty bieli */
var AWP_GREEN = 0x2dd355;        /* zieleń AWP – tło karty 2, światło i cienie */
var AK_PINK = 0xe84a8a;         /* różowy ze skina AK – tło i światło karty 3 */
var AK_BLUE = 0x4a8ae8;         /* niebieski ze skina AK – tło i światło karty 3 */

function createBizonBackgroundTexture(variant) {
  variant = variant === undefined ? 0 : Math.max(0, Math.min(2, Math.floor(variant)));
  var w = 2048;
  var h = 2048;
  var c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  var ctx = c.getContext('2d');

  /* Baza: czerń firmy (#07090d) */
  var base = ctx.createLinearGradient(0, 0, w, h);
  if (variant === 0) {
    base.addColorStop(0, BRAND_BLACK);
    base.addColorStop(0.5, '#0c0a0e');
    base.addColorStop(1, '#09070c');
  } else if (variant === 1) {
    /* AWP – ciemna baza z zielonym odcieniem (kolory ze skina) */
    base.addColorStop(0, '#060a07');
    base.addColorStop(0.35, '#0c140e');
    base.addColorStop(0.7, '#080d09');
    base.addColorStop(1, '#050805');
  } else {
    base.addColorStop(0, '#040306');
    base.addColorStop(0.2, BRAND_BLACK);
    base.addColorStop(0.6, '#0e0c10');
    base.addColorStop(1, '#0c0a0e');
  }
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  /* Czerwienie w barwie firmy #ff3131 (255,49,49) – glow / radialne */
  if (variant === 0) {
    var glow1 = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 1.2);
    glow1.addColorStop(0, 'rgba(255, 49, 49, 0.5)');
    glow1.addColorStop(0.25, 'rgba(200, 40, 40, 0.22)');
    glow1.addColorStop(0.5, 'rgba(120, 25, 25, 0.08)');
    glow1.addColorStop(1, 'transparent');
    ctx.fillStyle = glow1;
    ctx.fillRect(0, 0, w, h);

    var glow2 = ctx.createRadialGradient(w, 0, 0, w, 0, w * 0.9);
    glow2.addColorStop(0, 'rgba(255, 49, 49, 0.32)');
    glow2.addColorStop(0.4, 'rgba(140, 35, 35, 0.1)');
    glow2.addColorStop(1, 'transparent');
    ctx.fillStyle = glow2;
    ctx.fillRect(0, 0, w, h);

    var cx = w * 0.72;
    var cy = h * 0.45;
    var streak = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.5);
    streak.addColorStop(0, 'rgba(255, 49, 49, 0.38)');
    streak.addColorStop(0.15, 'rgba(220, 45, 45, 0.2)');
    streak.addColorStop(0.35, 'rgba(130, 30, 30, 0.08)');
    streak.addColorStop(1, 'transparent');
    ctx.fillStyle = streak;
    ctx.fillRect(0, 0, w, h);

    var flash = ctx.createRadialGradient(w * 0.85, h * 0.9, 0, w * 0.85, h * 0.9, w * 0.4);
    flash.addColorStop(0, 'rgba(255, 49, 49, 0.18)');
    flash.addColorStop(0.5, 'rgba(80, 20, 20, 0.05)');
    flash.addColorStop(1, 'transparent');
    ctx.fillStyle = flash;
    ctx.fillRect(0, 0, w, h);
  } else if (variant === 1) {
    /* AWP – zieleń i kolory ze skina zamiast czerwieni */
    var glowRight = ctx.createRadialGradient(w * 0.95, h * 0.1, 0, w * 0.95, h * 0.1, w * 1.0);
    glowRight.addColorStop(0, 'rgba(45, 211, 85, 0.48)');
    glowRight.addColorStop(0.3, 'rgba(35, 160, 65, 0.22)');
    glowRight.addColorStop(0.6, 'rgba(18, 90, 40, 0.06)');
    glowRight.addColorStop(1, 'transparent');
    ctx.fillStyle = glowRight;
    ctx.fillRect(0, 0, w, h);

    var glowLeft = ctx.createRadialGradient(w * 0.15, h * 0.5, 0, w * 0.15, h * 0.5, w * 0.6);
    glowLeft.addColorStop(0, 'rgba(40, 200, 75, 0.28)');
    glowLeft.addColorStop(0.45, 'rgba(25, 120, 50, 0.09)');
    glowLeft.addColorStop(1, 'transparent');
    ctx.fillStyle = glowLeft;
    ctx.fillRect(0, 0, w, h);

    var cx1 = w * 0.35;
    var cy1 = h * 0.28;
    var streak1 = ctx.createRadialGradient(cx1, cy1, 0, cx1, cy1, w * 0.55);
    streak1.addColorStop(0, 'rgba(55, 220, 95, 0.35)');
    streak1.addColorStop(0.2, 'rgba(40, 180, 70, 0.18)');
    streak1.addColorStop(0.45, 'rgba(22, 100, 45, 0.06)');
    streak1.addColorStop(1, 'transparent');
    ctx.fillStyle = streak1;
    ctx.fillRect(0, 0, w, h);

    var flash1 = ctx.createRadialGradient(w * 0.1, h * 0.88, 0, w * 0.1, h * 0.88, w * 0.45);
    flash1.addColorStop(0, 'rgba(30, 140, 55, 0.16)');
    flash1.addColorStop(0.5, 'rgba(15, 70, 30, 0.05)');
    flash1.addColorStop(1, 'transparent');
    ctx.fillStyle = flash1;
    ctx.fillRect(0, 0, w, h);
  } else {
    /* AK (karta 3) – różowy i niebieski ze skina zamiast czerwieni */
    var baseAk = ctx.createLinearGradient(0, 0, w, h);
    baseAk.addColorStop(0, '#0a080c');
    baseAk.addColorStop(0.25, '#0c0a12');
    baseAk.addColorStop(0.6, '#080a10');
    baseAk.addColorStop(1, '#06080c');
    ctx.fillStyle = baseAk;
    ctx.fillRect(0, 0, w, h);

    var topVignette = ctx.createLinearGradient(0, 0, 0, h * 0.45);
    topVignette.addColorStop(0, 'rgba(15, 10, 20, 0.85)');
    topVignette.addColorStop(0.6, 'transparent');
    ctx.fillStyle = topVignette;
    ctx.fillRect(0, 0, w, h);

    var glowPink = ctx.createRadialGradient(0, h * 0.8, 0, 0, h * 0.8, w * 0.7);
    glowPink.addColorStop(0, 'rgba(232, 74, 138, 0.4)');
    glowPink.addColorStop(0.3, 'rgba(200, 55, 120, 0.18)');
    glowPink.addColorStop(0.6, 'rgba(100, 30, 70, 0.05)');
    glowPink.addColorStop(1, 'transparent');
    ctx.fillStyle = glowPink;
    ctx.fillRect(0, 0, w, h);

    var glowBlue = ctx.createRadialGradient(w, h * 0.7, 0, w, h * 0.7, w * 0.75);
    glowBlue.addColorStop(0, 'rgba(74, 138, 232, 0.38)');
    glowBlue.addColorStop(0.35, 'rgba(50, 100, 200, 0.15)');
    glowBlue.addColorStop(0.65, 'rgba(25, 50, 100, 0.04)');
    glowBlue.addColorStop(1, 'transparent');
    ctx.fillStyle = glowBlue;
    ctx.fillRect(0, 0, w, h);

    var streakAk = ctx.createRadialGradient(w * 0.4, h * 0.5, 0, w * 0.4, h * 0.5, w * 0.5);
    streakAk.addColorStop(0, 'rgba(240, 100, 160, 0.28)');
    streakAk.addColorStop(0.2, 'rgba(100, 140, 220, 0.2)');
    streakAk.addColorStop(0.5, 'rgba(60, 80, 120, 0.06)');
    streakAk.addColorStop(1, 'transparent');
    ctx.fillStyle = streakAk;
    ctx.fillRect(0, 0, w, h);

    var whiteAccent = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, w * 0.3);
    whiteAccent.addColorStop(0, 'rgba(255, 252, 255, 0.12)');
    whiteAccent.addColorStop(0.4, 'rgba(255, 255, 255, 0.04)');
    whiteAccent.addColorStop(1, 'transparent');
    ctx.fillStyle = whiteAccent;
    ctx.fillRect(0, 0, w, h);
  }

  var imageData = ctx.getImageData(0, 0, w, h);
  var data = imageData.data;
  var grainStrength = 18;
  for (var i = 0; i < data.length; i += 4) {
    var n = (Math.random() - 0.5) * grainStrength;
    data[i] = Math.max(0, Math.min(255, data[i] + n));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);

  var tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function addLights(scene, cardIndex) {
  cardIndex = cardIndex === undefined ? 0 : cardIndex;
  if (cardIndex === 0) {
    var ambient = new THREE.AmbientLight(0xfff8f6, 0.95);
    scene.add(ambient);
    var dir = new THREE.DirectionalLight(0xffffff, 0.65);
    dir.position.set(2, 2, 2);
    scene.add(dir);
    var fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-1, 0.5, 1);
    scene.add(fill);
  }

  if (cardIndex === 0) {
    var redKey = new THREE.DirectionalLight(BRAND_RED, 1.65);
    redKey.position.set(-2, 1.8, 1.8);
    redKey.castShadow = true;
    redKey.shadow.mapSize.width = 1024;
    redKey.shadow.mapSize.height = 1024;
    redKey.shadow.camera.near = 0.5;
    redKey.shadow.camera.far = 8;
    redKey.shadow.camera.left = redKey.shadow.camera.bottom = -2;
    redKey.shadow.camera.right = redKey.shadow.camera.top = 2;
    scene.add(redKey);
    var redRim = new THREE.DirectionalLight(BRAND_RED, 0.85);
    redRim.position.set(1.8, 0.5, 1.2);
    scene.add(redRim);
    var redBack = new THREE.PointLight(BRAND_RED, 1.1, 12);
    redBack.position.set(1.2, 0.2, 0.5);
    scene.add(redBack);
    var redFill = new THREE.DirectionalLight(BRAND_RED, 0.45);
    redFill.position.set(0, -0.8, 1);
    scene.add(redFill);
  } else if (cardIndex === 1) {
    /* AWP – zielone światło i cienie dla większej głębi 3D */
    var ambAwp = new THREE.AmbientLight(0xf0fff0, 0.82);
    scene.add(ambAwp);
    var greenKey = new THREE.DirectionalLight(AWP_GREEN, 1.75);
    greenKey.position.set(2, 1.6, 1.6);
    greenKey.castShadow = true;
    greenKey.shadow.mapSize.width = 1024;
    greenKey.shadow.mapSize.height = 1024;
    greenKey.shadow.camera.near = 0.5;
    greenKey.shadow.camera.far = 8;
    greenKey.shadow.camera.left = greenKey.shadow.camera.bottom = -2;
    greenKey.shadow.camera.right = greenKey.shadow.camera.top = 2;
    scene.add(greenKey);
    var greenRim = new THREE.DirectionalLight(AWP_GREEN, 0.95);
    greenRim.position.set(-1.6, 0.6, 1.0);
    scene.add(greenRim);
    var greenBack = new THREE.PointLight(AWP_GREEN, 1.05, 12);
    greenBack.position.set(-1, 0.1, 0.6);
    scene.add(greenBack);
    var greenFill = new THREE.DirectionalLight(0x88ee99, 0.5);
    greenFill.position.set(0, -0.7, 1.2);
    scene.add(greenFill);
    var whiteFill = new THREE.DirectionalLight(0xffffff, 0.35);
    whiteFill.position.set(0, 1, 1);
    scene.add(whiteFill);
  } else {
    /* AK – mocne światło: róż/niebieski + dużo białego, żeby model był jasny */
    var ambAk = new THREE.AmbientLight(0xfff8fc, 1.15);
    scene.add(ambAk);
    var hemiAk = new THREE.HemisphereLight(0xffe8f5, 0xc8d8ff, 0.5);
    scene.add(hemiAk);
    var pinkKey = new THREE.DirectionalLight(AK_PINK, 2.5);
    pinkKey.position.set(-2.2, 1.2, 1.5);
    pinkKey.castShadow = true;
    pinkKey.shadow.mapSize.width = 1024;
    pinkKey.shadow.mapSize.height = 1024;
    pinkKey.shadow.camera.near = 0.5;
    pinkKey.shadow.camera.far = 8;
    pinkKey.shadow.camera.left = pinkKey.shadow.camera.bottom = -2;
    pinkKey.shadow.camera.right = pinkKey.shadow.camera.top = 2;
    scene.add(pinkKey);
    var blueRim = new THREE.DirectionalLight(AK_BLUE, 1.4);
    blueRim.position.set(2, 0.5, 0.9);
    scene.add(blueRim);
    var blueBack = new THREE.PointLight(AK_BLUE, 1.6, 14);
    blueBack.position.set(0.2, -0.5, 1);
    scene.add(blueBack);
    var pinkFill = new THREE.DirectionalLight(AK_PINK, 0.85);
    pinkFill.position.set(0.4, 1.4, 0.8);
    scene.add(pinkFill);
    var blueFill = new THREE.DirectionalLight(AK_BLUE, 0.75);
    blueFill.position.set(-0.3, -0.6, 1.2);
    scene.add(blueFill);
    var whiteKeyAk = new THREE.DirectionalLight(0xffffff, 1.1);
    whiteKeyAk.position.set(0, 2, 1.5);
    scene.add(whiteKeyAk);
    var whiteFillAk = new THREE.DirectionalLight(0xffffff, 0.9);
    whiteFillAk.position.set(0, 1.2, 1);
    scene.add(whiteFillAk);
    var whiteFront = new THREE.DirectionalLight(0xffffff, 0.65);
    whiteFront.position.set(0, 0, 2);
    scene.add(whiteFront);
  }
}

function configureTexture(tex, opts) {
  opts = opts || {};
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(opts.repeatX !== undefined ? opts.repeatX : 1, opts.repeatY !== undefined ? opts.repeatY : 1);
  tex.offset.set(opts.offsetX !== undefined ? opts.offsetX : 0, opts.offsetY !== undefined ? opts.offsetY : 0);
  tex.flipY = opts.flipY !== undefined ? opts.flipY : false;
  if (opts.anisotropy !== undefined) tex.anisotropy = opts.anisotropy;
  tex.needsUpdate = true;
  return tex;
}

function loadTexture(textureLoader, path, opts) {
  opts = opts || {};
  return new Promise(function (resolve, reject) {
    textureLoader.load(path, function (t) {
      t.flipY = false;
      t.colorSpace = opts.colorSpace === 'srgb' ? THREE.SRGBColorSpace : THREE.LinearSRGBColorSpace;
      resolve(configureTexture(t, opts));
    }, undefined, reject);
  });
}

function applyMaterial(mesh, textureLoader, baseUrl, maxAnisotropy) {
  if (!mesh.isMesh) return;
  var origMat = mesh.material;
  if (!origMat) return;

  var geo = mesh.geometry;
  if (geo.attributes.uv && !geo.attributes.uv2) {
    geo.setAttribute('uv2', geo.attributes.uv.clone());
  }

  var uvOpts = { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, anisotropy: maxAnisotropy };

  Promise.all([
    loadTexture(textureLoader, baseUrl + 'bizoncasino.webp', Object.assign({ colorSpace: 'srgb' }, uvOpts)),
    loadTexture(textureLoader, baseUrl + 'normalbizon.webp', uvOpts),
    loadTexture(textureLoader, baseUrl + 'aobizon.webp', uvOpts),
    loadTexture(textureLoader, baseUrl + 'ormbizon.webp', uvOpts)
  ]).then(function (tex) {
    var map = tex[0];
    var normalMap = tex[1];
    var aoMap = tex[2];
    var ormMap = tex[3];

    var firstMat = Array.isArray(origMat) ? origMat[0] : origMat;
    var mat = (firstMat && firstMat.isMeshStandardMaterial)
      ? firstMat
      : new THREE.MeshStandardMaterial({ color: 0xfffcf9 });

    mat.color.setHex(0xfffcf9);
    mat.map = map;
    mat.normalMap = normalMap;
    mat.normalScale = new THREE.Vector2(1, 1);
    mat.aoMap = aoMap;
    mat.aoMapIntensity = 0.6;
    mat.roughnessMap = ormMap;
    mat.roughnessMapChannel = 1;
    mat.roughness = 1;
    mat.metalnessMap = ormMap;
    mat.metalnessMapChannel = 2;
    mat.metalness = 1;
    mat.needsUpdate = true;

    if (mat !== firstMat) {
      mesh.material = mat;
    } else if (Array.isArray(origMat)) {
      for (var i = 0; i < origMat.length; i++) origMat[i] = mat;
    }
  }).catch(function (err) {
    console.warn('Bizon textures load error:', err);
  });
}

function applyMaterialAwp(mesh, textureLoader, baseUrl, maxAnisotropy) {
  if (!mesh.isMesh) return;
  var origMat = mesh.material;
  if (!origMat) return;

  var geo = mesh.geometry;
  if (geo.attributes.uv && !geo.attributes.uv2) {
    geo.setAttribute('uv2', geo.attributes.uv.clone());
  }

  var uvOpts = { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, anisotropy: maxAnisotropy };

  // Keep the model normal map; no separate AWP normal texture is shipped.
  var normalPromise = Promise.resolve(null);
  Promise.all([
    loadTexture(textureLoader, baseUrl + '000awp.webp', Object.assign({ colorSpace: 'srgb' }, uvOpts)),
    normalPromise,
    loadTexture(textureLoader, baseUrl + 'aoawp.webp', uvOpts),
    loadTexture(textureLoader, baseUrl + 'ormawp.webp', uvOpts)
  ]).then(function (tex) {
    var map = tex[0];
    var normalMap = tex[1];
    var aoMap = tex[2];
    var ormMap = tex[3];

    var firstMat = Array.isArray(origMat) ? origMat[0] : origMat;
    var mat = (firstMat && firstMat.isMeshStandardMaterial)
      ? firstMat
      : new THREE.MeshStandardMaterial({ color: 0xfffcf9 });

    mat.color.setHex(0xfffef8);
    mat.map = map;
    if (normalMap) {
      mat.normalMap = normalMap;
      mat.normalScale = new THREE.Vector2(1, 1);
    }
    mat.aoMap = aoMap;
    mat.aoMapIntensity = 0.4;
    mat.emissive = new THREE.Color(0x0a2a12);
    mat.emissiveIntensity = 0.08;
    mat.roughnessMap = ormMap;
    mat.roughnessMapChannel = 1;
    mat.roughness = 1;
    mat.metalnessMap = ormMap;
    mat.metalnessMapChannel = 2;
    mat.metalness = 1;
    mat.needsUpdate = true;

    if (mat !== firstMat) {
      mesh.material = mat;
    } else if (Array.isArray(origMat)) {
      for (var i = 0; i < origMat.length; i++) origMat[i] = mat;
    }
  }).catch(function (err) {
    console.warn('AWP textures load error:', err);
  });
}

function applyMaterialAk(mesh, textureLoader, baseUrl, maxAnisotropy) {
  if (!mesh.isMesh) return;
  var origMat = mesh.material;
  if (!origMat) return;

  var geo = mesh.geometry;
  if (geo.attributes.uv && !geo.attributes.uv2) {
    geo.setAttribute('uv2', geo.attributes.uv.clone());
  }

  var uvOpts = { repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0, anisotropy: maxAnisotropy };

  Promise.all([
    loadTexture(textureLoader, baseUrl + '000ak.webp', Object.assign({ colorSpace: 'srgb' }, uvOpts)),
    loadTexture(textureLoader, baseUrl + 'normalak.webp', uvOpts),
    loadTexture(textureLoader, baseUrl + 'aoak.webp', uvOpts),
    loadTexture(textureLoader, baseUrl + 'ormak.webp', uvOpts)
  ]).then(function (tex) {
    var map = tex[0];
    var normalMap = tex[1];
    var aoMap = tex[2];
    var ormMap = tex[3];

    var firstMat = Array.isArray(origMat) ? origMat[0] : origMat;
    var mat = (firstMat && firstMat.isMeshStandardMaterial)
      ? firstMat
      : new THREE.MeshStandardMaterial({ color: 0xfffcf9 });

    mat.color.setHex(0xffffff);
    mat.map = map;
    mat.normalMap = normalMap;
    mat.normalScale = new THREE.Vector2(1, 1);
    mat.aoMap = aoMap;
    mat.aoMapIntensity = 0.06;
    mat.emissive = new THREE.Color(0x3a2035);
    mat.emissiveIntensity = 0.22;
    mat.roughnessMap = ormMap;
    mat.roughnessMapChannel = 1;
    mat.roughness = 0.88;
    mat.metalnessMap = ormMap;
    mat.metalnessMapChannel = 2;
    mat.metalness = 1;
    mat.needsUpdate = true;

    if (mat !== firstMat) {
      mesh.material = mat;
    } else if (Array.isArray(origMat)) {
      for (var i = 0; i < origMat.length; i++) origMat[i] = mat;
    }
  }).catch(function (err) {
    console.warn('AK textures load error:', err);
  });
}

/**
 * Jeden niezależny viewer: scena, ładowanie modelu (bizon / AWP / AK), scroll progress, pętla animacji.
 */
function createSingleBizonViewer(container, cardIndex, mottoCards, baseUrl, backgroundDataUrl) {
  var canvas = container.querySelector('canvas');
  if (!canvas) return;

  if (backgroundDataUrl) {
    var cardBg = container.previousElementSibling;
    if (cardBg && cardBg.classList.contains('hf-item-img--bizon-bg')) {
      cardBg.style.backgroundImage = 'url(' + backgroundDataUrl + ')';
    }
  }

  var scene = new THREE.Scene();
  scene.background = null;

  var camera = new THREE.PerspectiveCamera(32, 1, 0.1, 1000);
  camera.position.set(0, 0, 3.8);
  camera.lookAt(0, 0, 0);

  var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  addLights(scene, cardIndex);

  /* Typ obrotu i ustawienie początkowe per karta. AWP (karta 2) = identycznie jak bizon 1 (karta 1) */
  var rotationOrder = (cardIndex === 0 || cardIndex === 1 ? 'YXZ' : 'XYZ');
  var rotationOffsetY = cardIndex === 0 || cardIndex === 1 ? 0 : -Math.PI / 3;
  var rotationDirection = cardIndex === 1 ? 1 : (cardIndex === 2 ? -1 : 1);
  var baseTiltX = (cardIndex === 0 || cardIndex === 1) ? 0.32 : -0.22;
  var xScrollFactor = cardIndex === 2 ? 0.65 : 0;
  var zScrollFactor = cardIndex === 2 ? 0.5 : 0;
  var verticalOffsetX = 0;
  var baseTiltZ = 0;
  var modelScale = 1.75;
  var modelPosX = cardIndex === 1 ? 0.65 : (cardIndex === 2 ? 0.28 : 0.18); /* AWP w prawo, AK delikatnie w prawo */
  var modelPosY = cardIndex === 2 ? -0.07 : 0; /* AK delikatnie w dół */
  var modelPosZ = 0.45;

  var scrollProgress = 0;
  var modelRoot = null;

  function setSize() {
    var w = container.clientWidth;
    var h = container.clientHeight;
    if (w <= 0 || h <= 0) return;
    canvas.width = w;
    canvas.height = h;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  function updateScrollProgress() {
    var card = mottoCards[cardIndex];
    if (!card) return;
    var rect = card.getBoundingClientRect();
    var vh = window.innerHeight;
    if (rect.bottom < 0 || rect.top > vh) {
      scrollProgress = 0;
      return;
    }
    var docTop = rect.top + window.scrollY;
    var h = card.offsetHeight;
    var scrollStart = docTop - vh;
    var scrollEnd = docTop + h;
    var range = scrollEnd - scrollStart;
    if (range <= 0) {
      scrollProgress = 0;
      return;
    }
    scrollProgress = (window.scrollY - scrollStart) / range;
    scrollProgress = Math.max(0, Math.min(1, scrollProgress));
  }

  setSize();
  var ro = new ResizeObserver(setSize);
  ro.observe(container);

  updateScrollProgress();
  window.addEventListener('scroll', updateScrollProgress, { passive: true });
  window.addEventListener('resize', updateScrollProgress);

  var textureLoader = new THREE.TextureLoader();
  var maxAnisotropy = renderer.capabilities.getMaxAnisotropy
    ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;

  var modelPath = cardIndex === 1 ? 'mesh(6).glb' : (cardIndex === 2 ? 'mesh(4).glb' : 'mesh(3).glb'); /* karta 3 = AK */
  var applyMat = cardIndex === 1 ? applyMaterialAwp : (cardIndex === 2 ? applyMaterialAk : applyMaterial);

  var loader = new GLTFLoader();
  loader.load(
    baseUrl + modelPath,
    function (gltf) {
      modelRoot = gltf.scene;
      modelRoot.traverse(function (node) {
        if (node.isMesh) applyMat(node, textureLoader, baseUrl, maxAnisotropy);
      });

      var box = new THREE.Box3().setFromObject(modelRoot);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      modelRoot.position.sub(center);
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = modelScale / maxDim;
      modelRoot.scale.setScalar(scale);
      modelRoot.rotation.order = rotationOrder;
      modelRoot.rotation.y = baseRotationY + rotationOffsetY;
      modelRoot.rotation.x = baseTiltX + verticalOffsetX;
      modelRoot.rotation.z = baseTiltZ;
      modelRoot.position.set(modelPosX, modelPosY, modelPosZ);
      modelRoot.renderOrder = 1;
      modelRoot.traverse(function (node) {
        if (node.isMesh) {
          node.renderOrder = 1;
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      scene.add(modelRoot);
    },
    undefined,
    function (err) {
      console.error('Model GLB load error (card ' + cardIndex + '):', err);
    }
  );

  function animate() {
    requestAnimationFrame(animate);
    if (modelRoot) {
      var angle = baseRotationY + rotationOffsetY + rotationDirection * scrollProgress * Math.PI * 2;
      modelRoot.rotation.y = angle;
      modelRoot.rotation.x = baseTiltX + verticalOffsetX + scrollProgress * xScrollFactor * Math.PI;
      modelRoot.rotation.z = baseTiltZ + scrollProgress * zScrollFactor * Math.PI * 2;
    }
    renderer.render(scene, camera);
  }

  animate();
}

function initBizonViewer() {
  var containers = document.querySelectorAll('.hf-item-img--bizon');
  if (!containers.length) return;

  var baseUrl = window.location.href.replace(/[^/]+$/, '');
  var mottoCards = document.querySelectorAll('.hf-home-v2__motto-band .hf-item');

  /* 3 oddzielne viewer'y – każdy ma własną teksturę tła (wariant 0/1/2) i własną pętlę animacji */
  containers.forEach(function (container, index) {
    var variant = index % 3;
    var backgroundDataUrl = '';
    try {
      var tex = createBizonBackgroundTexture(variant);
      backgroundDataUrl = tex.image ? tex.image.toDataURL('image/png') : '';
    } catch (e) {}
    createSingleBizonViewer(container, index, mottoCards, baseUrl, backgroundDataUrl);
  });
}

initBizonViewer();
