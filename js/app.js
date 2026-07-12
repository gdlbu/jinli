// ============================================================
//  jin.li — 一方数字锦鲤池
//  场景 / 鱼群 / 涟漪 / 昼夜 / 签文 / 音效
// ============================================================
import * as THREE from 'three';
import { GLTFLoader }   from 'examples/loaders/GLTFLoader.js';
import { RGBELoader }   from 'examples/loaders/RGBELoader.js';
import { Water }        from 'examples/objects/Water.js';
import * as SkeletonUtils from 'examples/utils/SkeletonUtils.js';
import { EffectComposer } from 'examples/postprocessing/EffectComposer.js';
import { RenderPass }     from 'examples/postprocessing/RenderPass.js';
import { UnrealBloomPass }from 'examples/postprocessing/UnrealBloomPass.js';
import { OutputPass }     from 'examples/postprocessing/OutputPass.js';

// ------------------------------------------------ 基本环境判断
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || window.innerWidth < 640;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function webglOK () {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}
if (!webglOK()) {
  document.getElementById('loading').classList.add('hide');
  document.getElementById('fallback').classList.add('show');
  throw new Error('WebGL unavailable');
}

// ------------------------------------------------ i18n
const I18N = {
  zh: {
    title: '锦鲤 · jin.li — 愿好运常伴',
    tagline: '愿好运常伴', tagline_en: 'FORTUNE FAVORS YOU',
    seek: '求好运', hint: '轻触水面 · 锦鲤游来',
    save: '保存好运', again: '再求一签',
    fallback: '你的设备暂不支持 3D 池水。\n但好运不打折——愿好运常伴。',
  },
  en: {
    title: 'Koi · jin.li — May fortune favor you',
    tagline: 'May fortune favor you', tagline_en: '愿 好 运 常 伴',
    seek: 'Fortune', hint: 'Touch the water · the koi will come',
    save: 'Save', again: 'Once more',
    fallback: 'Your device cannot render the 3D pond,\nbut fortune still favors you.',
  }
};
let lang = (navigator.language || 'zh').toLowerCase().startsWith('zh') ? 'zh' : 'en';
function applyLang () {
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  document.title = I18N[lang].title;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  document.getElementById('langBtn').textContent = lang === 'zh' ? 'EN' : '中';
}
document.getElementById('langBtn').addEventListener('click', () => {
  lang = lang === 'zh' ? 'en' : 'zh'; applyLang();
});
applyLang();

// ------------------------------------------------ 签文库
const FORTUNES = [
  { g:'大吉', p:['长风破浪会有时','直挂云帆济沧海'], n:'所求皆如愿，所行化坦途。', y:'宜 大胆开始', j:'忌 犹豫不决' },
  { g:'大吉', p:['春风得意马蹄疾','一日看尽长安花'], n:'时来运转，锦上添花。',     y:'宜 乘势而上', j:'忌 停步观望' },
  { g:'上吉', p:['海阔凭鱼跃','天高任鸟飞'],         n:'天地开阔，正合远行与谋事。', y:'宜 远谋', j:'忌 自缚' },
  { g:'上吉', p:['千淘万漉虽辛苦','吹尽狂沙始到金'], n:'坚持处，即是转机处。',     y:'宜 坚持', j:'忌 半途而废' },
  { g:'中吉', p:['行到水穷处','坐看云起时'],         n:'眼前的停顿，是更好的起点。', y:'宜 静候', j:'忌 强求' },
  { g:'中吉', p:['随风潜入夜','润物细无声'],         n:'默默耕耘者，福报最厚。',   y:'宜 积累', j:'忌 张扬' },
  { g:'大吉', p:['忽如一夜春风来','千树万树梨花开'], n:'惊喜将至，静待花开。',     y:'宜 期待', j:'忌 焦躁' },
  { g:'上吉', p:['沉舟侧畔千帆过','病树前头万木春'], n:'旧事翻篇，新局已开。',     y:'宜 放下', j:'忌 回头' },
  { g:'中吉', p:['明月松间照','清泉石上流'],         n:'心静之处，自有清福。',     y:'宜 休整', j:'忌 内耗' },
  { g:'大吉', p:['会当凌绝顶','一览众山小'],         n:'目标虽高，此刻脚下有路。', y:'宜 攀登', j:'忌 畏难' },
  { g:'上吉', p:['山重水复疑无路','柳暗花明又一村'], n:'转角处有惊喜，别急着失望。', y:'宜 再试一次', j:'忌 轻言放弃' },
  { g:'中吉', p:['采菊东篱下','悠然见南山'],         n:'慢一点，好运才追得上你。', y:'宜 从容', j:'忌 赶路' },
  { g:'大吉', p:['天生我材必有用','千金散尽还复来'], n:'底气十足，财气自来。',     y:'宜 自信', j:'忌 自疑' },
  { g:'上吉', p:['欲穷千里目','更上一层楼'],         n:'再进一步，视野全新。',     y:'宜 精进', j:'忌 安逸' },
  { g:'中吉', p:['桃花潭水深千尺','不及汪伦送我情'], n:'贵人就在身边，记得珍惜。', y:'宜 联络旧友', j:'忌 独行' },
  { g:'大吉', p:['两岸猿声啼不住','轻舟已过万重山'], n:'难关已过，前程放晴。',     y:'宜 庆祝', j:'忌 多虑' },
];

// ------------------------------------------------ 昼夜氛围
function daypreset () {
  const forced = new URLSearchParams(location.search).get('sky');
  const h = new Date().getHours();
  const key = forced || ((h >= 20 || h < 5) ? 'night' : (h < 7 || h >= 17) ? 'gold' : 'day');
  const P = {
    night: { name:'night', exposure:.62, bgInt:.42, hemi:.32, dir:.62, dirColor:0xbcd2ff, rim:.34,
             waterColor:0x0e4d5e, sunColor:0xa8c4ff, bloom:.5,  fog:0x0b2f3a, fogD:0.0045 },
    gold:  { name:'gold',  exposure:.68, bgInt:.85, hemi:.30, dir:1.05, dirColor:0xffc98a, rim:.42,
             waterColor:0x17777d, sunColor:0xffd9a0, bloom:.34, fog:0x123a3f, fogD:0.0042 },
    day:   { name:'day',   exposure:.78, bgInt:1.0, hemi:.40, dir:1.22, dirColor:0xfff4e0, rim:.46,
             waterColor:0x158a88, sunColor:0xffffff, bloom:.24, fog:0x134045, fogD:0.0035 },
  };
  return P[key] || P.day;
}
const DAY = daypreset();

// ------------------------------------------------ 加载
const loadingDiv = document.getElementById('loading');
const ring = document.getElementById('ring');
const pctEl = document.getElementById('pct');
const manager = new THREE.LoadingManager();
manager.onProgress = (_u, n, t) => {
  const p = Math.min(1, n / Math.max(t, 3));
  ring.style.strokeDashoffset = String(383 * (1 - p));
  pctEl.textContent = Math.round(p * 100) + '%';
};
manager.onLoad = () => {
  ring.style.strokeDashoffset = '0';
  pctEl.textContent = '100%';
  setTimeout(() => {
    loadingDiv.classList.add('hide');
    document.body.classList.add('ready');
    setTimeout(() => loadingDiv.remove(), 1100);
    setTimeout(() => { document.body.classList.add('dismiss-hero'); heroGone = true; hintEl.classList.add('show');
      setTimeout(() => hintEl.classList.remove('show'), 7000);
    }, 4200);
  }, 450);
};
manager.onError = url => { pctEl.textContent = '资源加载失败 ' + url.split('/').pop(); };

// ------------------------------------------------ 场景骨架
const POOL_R = 15;                       // 鱼群活动半径
let scene, camera, renderer, water, composer, bloomPass;
const clock = new THREE.Clock();
let heroGone = false;
const hintEl = document.getElementById('hint');

scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(DAY.fog, DAY.fogD);

camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 500);

renderer = new THREE.WebGLRenderer({ antialias: true, canvas: document.getElementById('scene') });
const DPR_CAP = isMobile ? 1.6 : 2;
renderer.setPixelRatio(Math.min(devicePixelRatio, DPR_CAP));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = !isMobile;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = DAY.exposure;

// 天空
new RGBELoader(manager).load('/textures/skybox.hdr', tex => {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  scene.environment = tex;
  scene.background = tex;
  scene.backgroundIntensity = DAY.bgInt;
  scene.environmentIntensity = Math.max(DAY.bgInt, .35);
});

// 光
const sunPos = new THREE.Vector3().setFromSphericalCoords(1, Math.PI * 0.4, Math.PI * 0.25);
scene.add(new THREE.HemisphereLight(0xffffff, 0x2a3d66, DAY.hemi));
const dirLight = new THREE.DirectionalLight(DAY.dirColor, DAY.dir);
dirLight.position.copy(sunPos).multiplyScalar(60);
dirLight.castShadow = !isMobile;
if (dirLight.castShadow) {
  dirLight.shadow.mapSize.set(1024, 1024);
  dirLight.shadow.camera.left = dirLight.shadow.camera.bottom = -25;
  dirLight.shadow.camera.right = dirLight.shadow.camera.top = 25;
  dirLight.shadow.camera.far = 120;
  dirLight.shadow.bias = -0.002;
}
scene.add(dirLight);
const rimLight = new THREE.DirectionalLight(0xbfdfff, DAY.rim);
rimLight.position.set(-10, 15, -15);
scene.add(rimLight);

// ---------------- 池底：沙 + 卵石 + 焦散光斑 ----------------
function makeCausticsTexture () {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#7f7460'; g.fillRect(0, 0, s, s);
  // 细沙噪点
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${190 + Math.random() * 50 | 0},${175 + Math.random() * 45 | 0},${140 + Math.random() * 40 | 0},${.05 + Math.random() * .1})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1.6, 1.6);
  }
  // 焦散网纹
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    g.strokeStyle = `rgba(235,255,246,${.05 + Math.random() * .07})`;
    g.lineWidth = 1.5 + Math.random() * 2.5;
    g.filter = `blur(${2 + Math.random() * 3}px)`;
    g.beginPath();
    const cx = Math.random() * s, cy = Math.random() * s, r = 25 + Math.random() * 65;
    g.ellipse(cx, cy, r, r * (0.55 + Math.random() * .5), Math.random() * Math.PI, 0, Math.PI * 2);
    g.stroke();
  }
  g.filter = 'none';
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const sandTex = makeCausticsTexture();
sandTex.repeat.set(7, 7);
const sand = new THREE.Mesh(
  new THREE.CircleGeometry(90, 48),
  new THREE.MeshStandardMaterial({ map: sandTex, color: 0x9c8c66, roughness: 1 })
);
sand.rotation.x = -Math.PI / 2;
sand.position.y = -3.2;
sand.receiveShadow = true;
scene.add(sand);

// 卵石
{
  const rockGeo = new THREE.SphereGeometry(1, 7, 5);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8b8073, roughness: .95 });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 42);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  for (let i = 0; i < 42; i++) {
    const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 30;
    const sx = .5 + Math.random() * 1.6;
    e.set(Math.random(), Math.random() * 6, Math.random()); q.setFromEuler(e);
    m.compose(
      new THREE.Vector3(Math.cos(a) * r, -2.55, Math.sin(a) * r),
      q, new THREE.Vector3(sx, sx * (.4 + Math.random() * .35), sx * (.7 + Math.random() * .5))
    );
    rocks.setMatrixAt(i, m);
  }
  rocks.receiveShadow = true;
  scene.add(rocks);
}

// ---------------- 水面 ----------------
const waterNormals = new THREE.TextureLoader(manager).load('/textures/waternormals.jpg', t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 14);
});
water = new Water(new THREE.PlaneGeometry(400, 400), {
  textureWidth: isMobile ? 256 : 512,
  textureHeight: isMobile ? 256 : 512,
  waterNormals,
  sunDirection: sunPos.clone().normalize(),
  sunColor: DAY.sunColor,
  waterColor: DAY.waterColor,
  distortionScale: 2.6,
  fog: false
});
water.rotation.x = -Math.PI / 2;
water.position.y = 0;
water.material.transparent = true;
water.material.uniforms.alpha.value = 0.78;   // 让水下锦鲤透出来
scene.add(water);

// ---------------- 涟漪（自定义 shader 平面） ----------------
const MAX_RIPPLES = 12;
const rippleUniforms = {
  uTime:    { value: 0 },
  uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0)) }, // x,z,t0,强度
};
const rippleMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms: rippleUniforms,
  vertexShader: /* glsl */`
    varying vec2 vPos;
    void main(){
      vPos = position.xy;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`,
  fragmentShader: /* glsl */`
    uniform float uTime;
    uniform vec4 uRipples[${MAX_RIPPLES}];
    varying vec2 vPos;
    void main(){
      float a = 0.0;
      for (int i = 0; i < ${MAX_RIPPLES}; i++){
        vec4 rp = uRipples[i];
        float age = uTime - rp.z;
        if (age < 0.0 || age > 3.2) continue;
        float d = distance(vPos, rp.xy);
        float front = age * 3.4;                       // 波前扩散速度
        float band = exp(-pow((d - front) * 2.2, 2.0)); // 波前高斯带
        float rings = 0.5 + 0.5 * cos((d - front) * 9.0);
        float fade = (1.0 - age / 3.2);
        a += band * rings * fade * fade * rp.w;
      }
      gl_FragColor = vec4(vec3(0.75, 1.0, 0.95), a * 0.5);
    }`
});
const ripplePlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), rippleMat);
ripplePlane.rotation.x = -Math.PI / 2;
ripplePlane.position.y = 0.06;
scene.add(ripplePlane);
let rippleIdx = 0;
function addRipple (x, z, strength = 1) {
  rippleUniforms.uRipples.value[rippleIdx].set(x, z, clock.elapsedTime, strength);
  rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
}

// ---------------- 花瓣 ----------------
let petals = null;
if (!reducedMotion) {
  const pc = document.createElement('canvas'); pc.width = pc.height = 64;
  const pg = pc.getContext('2d');
  pg.translate(32, 32); pg.rotate(.5);
  const grad = pg.createLinearGradient(-14, -18, 10, 16);
  grad.addColorStop(0, 'rgba(255,214,224,.95)'); grad.addColorStop(1, 'rgba(244,150,178,.9)');
  pg.fillStyle = grad;
  pg.beginPath(); pg.ellipse(0, 0, 11, 17, 0, 0, Math.PI * 2); pg.fill();
  const petalTex = new THREE.CanvasTexture(pc);
  const N = isMobile ? 10 : 16;
  petals = { list: [], mesh: new THREE.InstancedMesh(
    new THREE.PlaneGeometry(.42, .58),
    new THREE.MeshBasicMaterial({ map: petalTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    N) };
  for (let i = 0; i < N; i++) petals.list.push({
    x: (Math.random() - .5) * 34, y: 2 + Math.random() * 12, z: (Math.random() - .5) * 34,
    vy: .25 + Math.random() * .3, ph: Math.random() * 6.28, spin: Math.random() * 6.28, onWater: -1
  });
  scene.add(petals.mesh);
}

// ---------------- 锦鲤鱼群 ----------------
// 花色：原色红白 / 金黄 / 墨色 / 橙红 / 银白
const VARIANTS = [
  { tint: 0xffffff },
  { tint: 0xffc76a },
  { tint: 0x5a5a66, dark: true },
  { tint: 0xff9d6b },
  { tint: 0xffffff },
  { tint: 0xffd9a8 },
];
const KOI_N = isMobile ? 5 : 6;
const kois = [];
let koiTemplate = null, koiAnims = null;

new GLTFLoader(manager).load('/models/koi.glb', gltf => {
  koiTemplate = gltf.scene;
  koiAnims = gltf.animations;
  const swimClips = koiAnims.filter(c => /swim_A\d/.test(c.name));
  for (let i = 0; i < KOI_N; i++) {
    const root = new THREE.Group();
    const model = SkeletonUtils.clone(koiTemplate);
    model.rotation.y = Math.PI;                 // 模型鼻头朝 root 的 +Z
    const v = VARIANTS[i % VARIANTS.length];
    model.traverse(n => {
      if (n.isMesh) {
        n.castShadow = !isMobile;
        n.material = n.material.clone();
        if (n.material.color) n.material.color.setHex(v.tint);
        if (v.dark && n.material.color) n.material.color.multiplyScalar(.75);
        if ('metalness' in n.material) n.material.metalness = .12;
        if ('roughness' in n.material) n.material.roughness = .45;
        if (n.material.emissive) { n.material.emissive.setHex(0xffe8d0); n.material.emissiveIntensity = .04; }
      }
    });
    const scale = 8.5 + Math.random() * 2.6;
    model.scale.setScalar(scale);
    root.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const clip = swimClips.length ? swimClips[i % swimClips.length] : koiAnims[0];
    const action = mixer.clipAction(clip);
    action.play();
    action.time = Math.random() * clip.duration;

    const a = (i / KOI_N) * Math.PI * 2;
    const koi = {
      root, mixer, action, scale,
      x: Math.cos(a) * 6, z: Math.sin(a) * 6,
      heading: Math.random() * Math.PI * 2,
      speed: 1.1 + Math.random() * .5,
      baseSpeed: 1.1 + Math.random() * .5,
      depth: -0.55 - Math.random() * .7,
      wanderPh: Math.random() * 100,
      bank: 0, jump: null,
    };
    root.position.set(koi.x, koi.depth, koi.z);
    scene.add(root);
    kois.push(koi);
  }
}, undefined, () => { pctEl.textContent = '模型加载失败'; });

// 鱼群目标（涟漪吸引）
const attract = { x: 0, z: 0, until: -1 };

function updateKois (dt, t) {
  for (const k of kois) {
    if (k.jump) { updateJump(k, dt, t); continue; }
    // —— 转向决策 ——
    k.wanderPh += dt;
    let steer = Math.sin(k.wanderPh * .6) * .5 + Math.sin(k.wanderPh * .23 + 2) * .35;

    // 涟漪吸引
    let feeding = false;
    if (t < attract.until) {
      const dx = attract.x - k.x, dz = attract.z - k.z;
      const dist = Math.hypot(dx, dz);
      if (dist > 1.2) {
        const want = Math.atan2(dx, dz);
        let dd = want - k.heading;
        while (dd >  Math.PI) dd -= Math.PI * 2;
        while (dd < -Math.PI) dd += Math.PI * 2;
        steer += THREE.MathUtils.clamp(dd * 2.2, -2.2, 2.2);
        feeding = true;
      } else { k.speed = Math.max(.35, k.speed - dt * 1.5); } // 到点后悠着转
    }

    // 边界软约束：靠近池缘时往回拐
    const r = Math.hypot(k.x, k.z);
    if (r > POOL_R * .72) {
      const back = Math.atan2(-k.x, -k.z);
      let dd = back - k.heading;
      while (dd >  Math.PI) dd -= Math.PI * 2;
      while (dd < -Math.PI) dd += Math.PI * 2;
      steer += dd * THREE.MathUtils.smoothstep(r, POOL_R * .72, POOL_R) * 3.2;
    }

    // 同伴分离
    for (const o of kois) {
      if (o === k || o.jump) continue;
      const dx = k.x - o.x, dz = k.z - o.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 4.4 && d2 > .0001) {
        const away = Math.atan2(dx, dz);
        let dd = away - k.heading;
        while (dd >  Math.PI) dd -= Math.PI * 2;
        while (dd < -Math.PI) dd += Math.PI * 2;
        steer += dd * (1.6 / (1 + d2));
      }
    }

    const turn = THREE.MathUtils.clamp(steer, -1.6, 1.6) * dt;
    k.heading += turn;
    k.bank += ((-turn * 14) - k.bank) * Math.min(1, dt * 3);

    // —— 速度 ——
    const target = feeding ? k.baseSpeed * 1.9 : k.baseSpeed;
    k.speed += (target - k.speed) * Math.min(1, dt * .8);

    k.x += Math.sin(k.heading) * k.speed * dt;
    k.z += Math.cos(k.heading) * k.speed * dt;

    // 上下起伏
    const y = k.depth + Math.sin(t * .7 + k.wanderPh) * .16;

    k.root.position.set(k.x, y, k.z);
    k.root.rotation.set(0, k.heading, k.bank * .04);
    k.action.timeScale = .65 + k.speed * .55;
    k.mixer.update(dt);

    // 游太快时偶尔留下小水纹
    if (feeding && Math.random() < dt * 1.2 && y > -0.75) addRipple(k.x, k.z, .25);
  }
}

// ---------------- 求好运：鲤鱼跃出 + 水花 + 签文 ----------------
let splash = null;
function makeSplash (x, z) {
  const N = 90;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), vel = [];
  for (let i = 0; i < N; i++) {
    pos.set([x, 0.05, z], i * 3);
    const a = Math.random() * Math.PI * 2, s = .8 + Math.random() * 3.4;
    vel.push(new THREE.Vector3(Math.cos(a) * s * .55, 2.2 + Math.random() * 3.4, Math.sin(a) * s * .55));
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: 0xd8fff4, size: .14, transparent: true, opacity: .95, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  splash = { pts, vel, t: 0 };
}
function updateSplash (dt) {
  if (!splash) return;
  splash.t += dt;
  const p = splash.pts.geometry.attributes.position;
  for (let i = 0; i < splash.vel.length; i++) {
    const v = splash.vel[i];
    v.y -= 9.5 * dt;
    p.setXYZ(i, p.getX(i) + v.x * dt, Math.max(0, p.getY(i) + v.y * dt), p.getZ(i) + v.z * dt);
  }
  p.needsUpdate = true;
  splash.pts.material.opacity = Math.max(0, .95 - splash.t * .9);
  if (splash.t > 1.4) { scene.remove(splash.pts); splash.pts.geometry.dispose(); splash = null; }
}

let seeking = false;
function seekFortune () {
  if (seeking || !kois.length) return;
  seeking = true;
  playChime();
  // 选一条离画面中心最近的鱼
  const k = kois.reduce((a, b) => (Math.hypot(a.x, a.z) < Math.hypot(b.x, b.z) ? a : b));
  const t0 = clock.elapsedTime;
  k.jump = { t0, x0: k.x, z0: k.z, h0: k.heading, splashed: false };
  document.body.classList.add('dismiss-hero');
}
function updateJump (k, dt, t) {
  const J = k.jump, T = 1.75;
  const u = (t - J.t0) / T;
  if (u >= 1) {
    if (!J.landed) { J.landed = true; makeSplash(k.x, k.z); addRipple(k.x, k.z, 1.8); playSplash();
      setTimeout(showFortune, 420); }
    k.jump = null;
    k.root.rotation.set(0, k.heading, 0);
    return;
  }
  k.mixer.update(dt * 1.6);
  // 前进 + 抛物线（起跳前 0.25 蓄力下潜）
  const fwd = u * 6.5;
  k.x = J.x0 + Math.sin(J.h0) * fwd;
  k.z = J.z0 + Math.cos(J.h0) * fwd;
  let y;
  if (u < .14) y = k.depth - u / .14 * .8;                       // 下潜蓄力
  else {
    const v = (u - .14) / .86;                                    // 跃出弧线
    y = k.depth - .8 + Math.sin(v * Math.PI) * (3.6 + .8);
  }
  const pitch = u < .14 ? .5 : -Math.cos((u - .14) / .86 * Math.PI) * 1.1;
  k.root.position.set(k.x, y, k.z);
  k.root.rotation.set(-pitch, J.h0, 0);
  // 出水与入水的水花
  if (!J.splashed && u > .2) { J.splashed = true; makeSplash(k.x, k.z); addRipple(k.x, k.z, 1.4); playSplash(); }
  if (u > .9 && !J.landed) { J.landed = true; makeSplash(k.x, k.z); addRipple(k.x, k.z, 1.8); playSplash();
    setTimeout(showFortune, 420); }
}

// ---------------- 签文卡片 ----------------
const fmask = document.getElementById('fmask');
const cardCanvas = document.getElementById('cardCanvas');
function roundRect (g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function drawVertical (g, text, x, y, size, gap, font, color) {
  g.font = `${size}px ${font}`;
  g.fillStyle = color;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  [...text].forEach((ch, i) => g.fillText(ch, x, y + i * (size + gap)));
}
async function drawCard (f, no) {
  await document.fonts.ready;
  const g = cardCanvas.getContext('2d');
  const W = 720, H = 1160;
  const serif = '"Noto Serif SC","Songti SC",serif';
  const brush = '"Ma Shan Zheng",' + serif;

  // 宣纸底
  g.fillStyle = '#f5efe1'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = `rgba(120,100,70,${Math.random() * .05})`;
    g.fillRect(Math.random() * W, Math.random() * H, 1.4, 1.4);
  }
  // 双线朱框
  g.strokeStyle = '#b8452f'; g.lineWidth = 5; roundRect(g, 26, 26, W - 52, H - 52, 14); g.stroke();
  g.lineWidth = 1.6; roundRect(g, 40, 40, W - 80, H - 80, 8); g.stroke();

  // 顶部印章
  g.fillStyle = '#c0392b';
  roundRect(g, W / 2 - 51, 78, 102, 102, 16); g.fill();
  g.fillStyle = '#f5efe1';
  g.font = `600 38px ${serif}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('锦', W / 2, 108); g.fillText('鲤', W / 2, 152);

  g.fillStyle = '#8a6f4d'; g.font = `300 21px ${serif}`;
  g.fillText(`第 ${no} 签`, W / 2, 226);

  // 大字签等
  g.fillStyle = '#b8452f';
  g.font = `92px ${brush}`;
  g.fillText(f.g, W / 2, 320);

  // 竖排诗句（右→左，按字数垂直居中，避让下方解曰区）
  const step = 46;
  const col = (text, x) => {
    const y0 = 580 - ((text.length - 1) * step) / 2;
    drawVertical(g, text, x, y0, 34, step - 34, brush, '#243c36');
  };
  col(f.p[0], W / 2 + 70);
  col(f.p[1], W / 2 - 70);

  // 解曰
  g.font = `300 24px ${serif}`; g.fillStyle = '#6d5a3f';
  g.textAlign = 'center';
  g.fillText('— 解曰 —', W / 2, 862);
  g.font = `400 27px ${serif}`; g.fillStyle = '#3d3427';
  g.fillText(f.n, W / 2, 910);

  // 宜 / 忌
  g.font = `400 24px ${serif}`;
  g.fillStyle = '#2e6e51'; g.textAlign = 'right'; g.fillText(f.y, W / 2 - 24, 974);
  g.fillStyle = '#a04a32'; g.textAlign = 'left';  g.fillText(f.j, W / 2 + 24, 974);
  g.textAlign = 'center';

  // 底部
  const d = new Date();
  g.fillStyle = '#8a6f4d'; g.font = `300 20px ${serif}`;
  g.fillText(`${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 锦鲤所赠`, W / 2, 1042);
  g.fillStyle = '#b8452f'; g.font = `600 26px ${serif}`;
  g.fillText('jin.li', W / 2, 1086);
}
let lastFortune = null;
async function showFortune () {
  try {
    const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
    const no = Math.floor(Math.random() * 88) + 1;
    lastFortune = f;
    await drawCard(f, no);
    fmask.classList.add('show');
  } catch (e) { /* 极端情况下字体或 canvas 失败，静默恢复按钮 */ }
  seeking = false;
}
document.getElementById('seekBtn').addEventListener('click', seekFortune);
document.getElementById('closeBtn').addEventListener('click', () => fmask.classList.remove('show'));
document.getElementById('againBtn').addEventListener('click', () => { fmask.classList.remove('show'); setTimeout(seekFortune, 350); });
document.getElementById('saveBtn').addEventListener('click', () => {
  cardCanvas.toBlob(async blob => {
    if (!blob) return;
    const file = new File([blob], 'jinli-fortune.png', { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: '锦鲤 · jin.li' }); return; } catch (e) { /* 用户取消则落到下载 */ }
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'jinli-fortune.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  });
});
fmask.addEventListener('click', e => { if (e.target === fmask) fmask.classList.remove('show'); });

// ---------------- 声音（程序生成，无外部资源） ----------------
let audio = null;
function initAudio () {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  // 水底噪声
  const len = ctx.sampleRate * 3;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; last = (last + .015 * w) / 1.015; ch[i] = last * 4.2; }
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 420;
  const lfoG = ctx.createGain(); lfoG.gain.value = .35;
  const noiseG = ctx.createGain(); noiseG.gain.value = .5;
  const lfo = ctx.createOscillator(); lfo.frequency.value = .11;
  lfo.connect(lfoG.gain);
  src.connect(lp); lp.connect(lfoG); lfoG.connect(noiseG); noiseG.connect(master);
  src.start(); lfo.start();
  audio = { ctx, master };
  // 随机水滴
  (function drip () {
    if (!audio) return;
    if (audio.master.gain.value > 0.01) {
      const t = ctx.currentTime;
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.frequency.setValueAtTime(620 + Math.random() * 500, t);
      o.frequency.exponentialRampToValueAtTime(180, t + .16);
      og.gain.setValueAtTime(.0001, t);
      og.gain.exponentialRampToValueAtTime(.11, t + .012);
      og.gain.exponentialRampToValueAtTime(.0001, t + .3);
      o.connect(og); og.connect(master);
      o.start(t); o.stop(t + .32);
    }
    setTimeout(drip, 1800 + Math.random() * 5200);
  })();
}
function playChime () {
  if (!audio || audio.master.gain.value < .01) return;
  const { ctx, master } = audio, t = ctx.currentTime;
  [523.25, 659.25, 783.99].forEach((f, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(.0001, t + i * .09);
    g.gain.exponentialRampToValueAtTime(.06, t + i * .09 + .02);
    g.gain.exponentialRampToValueAtTime(.0001, t + i * .09 + 1.6);
    o.connect(g); g.connect(master);
    o.start(t + i * .09); o.stop(t + i * .09 + 1.7);
  });
}
function playSplash () {
  if (!audio || audio.master.gain.value < .01) return;
  const { ctx, master } = audio, t = ctx.currentTime;
  const len = ctx.sampleRate * .5, buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .8;
  const g = ctx.createGain(); g.gain.value = .5;
  src.connect(bp); bp.connect(g); g.connect(master);
  src.start(t);
}
const soundBtn = document.getElementById('soundBtn');
soundBtn.addEventListener('click', () => {
  if (!audio) initAudio();
  const on = soundBtn.classList.toggle('muted');
  const target = on ? 0 : .8;
  audio.ctx.resume();
  audio.master.gain.linearRampToValueAtTime(target, audio.ctx.currentTime + .8);
});

// ---------------- 交互：点水 → 涟漪 + 鱼来 ----------------
const raycaster = new THREE.Raycaster();
const waterPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ndc = new THREE.Vector2();
const hit = new THREE.Vector3();
let pointerX = 0, pointerY = 0;

function pondTouch (cx, cy) {
  ndc.set(cx / innerWidth * 2 - 1, -(cy / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  if (raycaster.ray.intersectPlane(waterPlane, hit)) {
    const r = Math.hypot(hit.x, hit.z);
    if (r < POOL_R * 1.4) {
      addRipple(hit.x, hit.z, 1);
      attract.x = hit.x; attract.z = hit.z;
      attract.until = clock.elapsedTime + 6;
      if (audio && audio.master.gain.value > .01) playSplash();
      document.body.classList.add('dismiss-hero');
      hintEl.classList.remove('show');
    }
  }
}
addEventListener('pointerdown', e => {
  if (e.target.closest('.ui') || e.target.closest('.fortune-mask')) return;
  pondTouch(e.clientX, e.clientY);
});
addEventListener('pointermove', e => {
  pointerX = e.clientX / innerWidth * 2 - 1;
  pointerY = e.clientY / innerHeight * 2 - 1;
});

// ---------------- 电影感运镜 ----------------
// 俯视池面、缓慢环绕；开场从高处缓降落位
const camRig = { angle: Math.PI * .25, dist: 13.5, height: 12.5, look: -0.6 };
let camStart = -1;
function updateCamera (dt, t) {
  if (camStart < 0) camStart = t;
  const intro = THREE.MathUtils.clamp((t - camStart) / 4.5, 0, 1);
  const ease = 1 - Math.pow(1 - intro, 3);
  if (!reducedMotion) camRig.angle += dt * .028;                   // 极慢环绕
  const breathe = Math.sin(t * .17) * .5;
  const d = camRig.dist + breathe + (1 - ease) * 10;              // 开场更远
  const h = camRig.height + Math.sin(t * .11) * .3 + (1 - ease) * 9; // 开场更高
  const px = Math.cos(camRig.angle) * d + pointerX * 1.1;
  const pz = Math.sin(camRig.angle) * d + pointerY * .7;
  camera.position.lerp(new THREE.Vector3(px, h, pz), Math.min(1, dt * 2.4));
  camera.lookAt(pointerX * 1.4, camRig.look, pointerY * 1.0);
}

// ---------------- 后期 ----------------
function setupPost () {
  if (isMobile || reducedMotion) return;
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), DAY.bloom, .55, .82);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());
}
setupPost();

// ---------------- 自适应画质 ----------------
let fpsAcc = 0, fpsN = 0, fpsChecked = false;
function watchFps (dt) {
  if (fpsChecked || dt <= 0) return;
  fpsAcc += 1 / dt; fpsN++;
  if (fpsN >= 240) {
    fpsChecked = true;
    const avg = fpsAcc / fpsN;
    if (avg < 30) {
      renderer.setPixelRatio(Math.max(1, Math.min(devicePixelRatio, DPR_CAP) * .72));
      if (composer) { composer = null; }   // 关 bloom 直接渲染
    }
  }
}

// ---------------- 主循环 ----------------
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer && composer.setSize(innerWidth, innerHeight);
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) clock.stop(); else clock.start();
});

// 偶发的自然涟漪（雨点/鱼嘴）
let nextAmbient = 3;

function animate () {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  const t = clock.elapsedTime;

  water.material.uniforms.time.value += dt * .35;
  rippleUniforms.uTime.value = t;
  sandTex.offset.x = Math.sin(t * .05) * .02;
  sandTex.offset.y = t * .004;

  updateKois(dt, t);
  updateSplash(dt);
  updateCamera(dt, t);

  if (petals) {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    petals.list.forEach((p, i) => {
      if (p.onWater < 0) {
        p.y -= p.vy * dt;
        p.x += Math.sin(t * .8 + p.ph) * dt * .6;
        p.z += Math.cos(t * .6 + p.ph) * dt * .4;
        p.spin += dt * 1.4;
        if (p.y <= .12) { p.onWater = t; addRipple(p.x, p.z, .3); }
        e.set(p.spin, p.ph, p.spin * .6);
      } else {
        p.y = .12;
        p.x += dt * .07; p.z += dt * .04;
        e.set(-Math.PI / 2, 0, p.ph + Math.sin(t * .4 + p.ph) * .2);
        if (t - p.onWater > 14) { p.x = (Math.random() - .5) * 34; p.z = (Math.random() - .5) * 34; p.y = 8 + Math.random() * 8; p.onWater = -1; }
      }
      q.setFromEuler(e);
      m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, 1, 1));
      petals.mesh.setMatrixAt(i, m);
    });
    petals.mesh.instanceMatrix.needsUpdate = true;
  }

  if (t > nextAmbient) {
    nextAmbient = t + 4 + Math.random() * 9;
    if (!reducedMotion) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * POOL_R * .9;
      addRipple(Math.cos(a) * r, Math.sin(a) * r, .35);
    }
  }

  watchFps(dt);
  if (composer) composer.render(); else renderer.render(scene, camera);
}
animate();
