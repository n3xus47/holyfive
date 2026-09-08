(function () {
  var canvas = document.querySelector('.hf-home-v2__sponsors-band-canvas');
  var section = document.querySelector('.hf-home-v2__sponsors-band');
  if (!canvas || !section || typeof THREE === 'undefined' || typeof ScrollTrigger === 'undefined') return;

  section.classList.add('has-reveal-canvas');

  var CONFIG = {
    spread: 0.14,
    blur: 0.08,
    whiteStartBase: 0.82,
    redEndBase: 0.26,
    speed: 1.1
  };

  var vertexShader = [
    'varying vec2 vUv;',
    'void main() {',
    '  vUv = uv;',
    '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
    '}'
  ].join('\n');

  var fragmentShader = [
    'uniform float uProgress;',
    'uniform vec2 uResolution;',
    'uniform vec3 uColorWhite;',
    'uniform vec3 uColorRed;',
    'uniform float uSpread;',
    'uniform float uBlur;',
    'uniform float uWhiteStartBase;',
    'uniform float uRedEndBase;',
    'varying vec2 vUv;',
    '',
    'float Hash(vec2 p) {',
    '  vec3 p2 = vec3(p.xy, 1.0);',
    '  return fract(sin(dot(p2, vec3(37.1, 61.7, 12.4))) * 3758.5453123);',
    '}',
    '',
    'float noise(in vec2 p) {',
    '  vec2 i = floor(p);',
    '  vec2 f = fract(p);',
    '  f *= f * (3.0 - 2.0 * f);',
    '  return mix(',
    '    mix(Hash(i + vec2(0.0, 0.0)), Hash(i + vec2(1.0, 0.0)), f.x),',
    '    mix(Hash(i + vec2(0.0, 1.0)), Hash(i + vec2(1.0, 1.0)), f.x),',
    '    f.y);',
    '}',
    '',
    'float fbm(vec2 p) {',
    '  float v = 0.0;',
    '  v += noise(p * 1.0) * 0.5;',
    '  v += noise(p * 2.0) * 0.25;',
    '  v += noise(p * 4.0) * 0.125;',
    '  return v;',
    '}',
    '',
    'void main() {',
    '  vec2 uv = vUv;',
    '  float aspect = uResolution.x / uResolution.y;',
    '  vec2 centeredUv = (uv - 0.5) * vec2(aspect, 1.0);',
    '  float nTop = fbm(centeredUv * 12.0) * uSpread;',
    '  float nBottom = fbm(centeredUv * 12.0 + 100.0) * uSpread;',
    '  float whiteStart = uWhiteStartBase + nTop;',
    '  float redEnd = uRedEndBase - nBottom;',
    '  float whiteStartProgress = mix(0.5, whiteStart, uProgress);',
    '  float redEndProgress = mix(0.5, redEnd, uProgress);',
    '  float alphaWhite = 1.0 - smoothstep(whiteStartProgress - uBlur, whiteStartProgress + uBlur, uv.y);',
    '  float alphaRed = smoothstep(redEndProgress - uBlur, redEndProgress + uBlur, uv.y);',
    '  vec3 color = uv.y > 0.5 ? uColorWhite : uColorRed;',
    '  float alpha = uv.y > 0.5 ? alphaWhite : alphaRed;',
    '  gl_FragColor = vec4(color, alpha);',
    '}'
  ].join('\n');

  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });

  var material = new THREE.ShaderMaterial({
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
      uProgress: { value: 0 },
      uResolution: { value: new THREE.Vector2(section.offsetWidth, section.offsetHeight) },
      uColorWhite: { value: new THREE.Vector3(1, 1, 1) },
      uColorRed: { value: new THREE.Vector3(1, 0.192, 0.192) },
      uSpread: { value: CONFIG.spread },
      uBlur: { value: CONFIG.blur },
      uWhiteStartBase: { value: CONFIG.whiteStartBase },
      uRedEndBase: { value: CONFIG.redEndBase }
    },
    transparent: true,
    depthWrite: false
  });

  var geometry = new THREE.PlaneGeometry(2, 2);
  var mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  function setSize() {
    var w = section.offsetWidth;
    var h = section.offsetHeight;
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    material.uniforms.uResolution.value.set(w, h);
  }

  setSize();
  window.addEventListener('resize', setSize);

  function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }
  animate();

  /* Jak w CODE(5): progress 0→1 przez cały scroll sekcji (długa sekcja = długa animacja) */
  ScrollTrigger.create({
    trigger: section,
    start: 'top bottom',
    end: 'bottom top',
    scrub: true,
    onUpdate: function (self) {
      material.uniforms.uProgress.value = Math.min(self.progress * CONFIG.speed, 1.1);
    }
  });
})();
