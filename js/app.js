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
let lang = 'zh';   // 默认中文，右上角可切英文
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
  { g:'大吉', p:['大鹏一日同风起','扶摇直上九万里'], n:'风口已至，放手一搏。',     y:'宜 起飞', j:'忌 观望' },
  { g:'上吉', p:['不畏浮云遮望眼','自缘身在最高层'], n:'看得远的人，不被眼前迷惑。', y:'宜 远见', j:'忌 短视' },
  { g:'中吉', p:['宠辱不惊看庭前','花开花落云卷舒'], n:'心宽处，事事皆宽。',       y:'宜 淡定', j:'忌 计较' },
  { g:'大吉', p:['好雨知时节','当春乃发生'],         n:'该来的都在路上，且是好的。', y:'宜 顺势', j:'忌 逆行' },
  { g:'上吉', p:['宝剑锋从磨砺出','梅花香自苦寒来'], n:'眼下的苦，都是将来的香。', y:'宜 磨炼', j:'忌 抱怨' },
  { g:'中吉', p:['问渠那得清如许','为有源头活水来'], n:'常学常新，好运自来。',     y:'宜 学习', j:'忌 守旧' },
  { g:'大吉', p:['仰天大笑出门去','我辈岂是蓬蒿人'], n:'自信满怀，机会临门。',     y:'宜 亮相', j:'忌 藏拙' },
  { g:'上吉', p:['莫愁前路无知己','天下谁人不识君'], n:'你的才华，终会被看见。',   y:'宜 交友', j:'忌 自闭' },
  { g:'中吉', p:['小荷才露尖尖角','早有蜻蜓立上头'], n:'新的开始，已有人赏识。',   y:'宜 展露', j:'忌 埋没' },
  { g:'大吉', p:['春江潮水连海平','海上明月共潮生'], n:'水到渠成，圆满在望。',     y:'宜 团圆', j:'忌 分心' },
  { g:'上吉', p:['接天莲叶无穷碧','映日荷花别样红'], n:'正当盛时，尽情绽放。',     y:'宜 绽放', j:'忌 收敛' },
  { g:'中吉', p:['泉眼无声惜细流','树阴照水爱晴柔'], n:'细水长流，福气绵长。',     y:'宜 细水长流', j:'忌 急功' },
  { g:'大吉', p:['九万里风鹏正举','风休住蓬舟吹取'], n:'乘长风，去更远的地方。',   y:'宜 远行', j:'忌 恋栈' },
  { g:'上吉', p:['等闲识得东风面','万紫千红总是春'], n:'处处生机，随手皆是机遇。', y:'宜 尝新', j:'忌 挑剔' },
  { g:'中吉', p:['竹外桃花三两枝','春江水暖鸭先知'], n:'先行者先得，敏锐些。',     y:'宜 先行', j:'忌 迟疑' },
  { g:'大吉', p:['潮平两岸阔','风正一帆悬'],         n:'风平浪静，正好扬帆。',     y:'宜 启程', j:'忌 拖延' },
  { g:'上吉', p:['野火烧不尽','春风吹又生'],         n:'生命力就是你的底牌。',     y:'宜 重来', j:'忌 气馁' },
  { g:'中吉', p:['芳林新叶催陈叶','流水前波让后波'], n:'新旧交替，正是你的时机。', y:'宜 更新', j:'忌 守成' },
  { g:'大吉', p:['三十功名尘与土','八千里路云和月'], n:'志在千里者，不争朝夕。',   y:'宜 立志', j:'忌 浮躁' },
  { g:'上吉', p:['落红不是无情物','化作春泥更护花'], n:'付出不会白费，回报在后头。', y:'宜 付出', j:'忌 算计' },
  { g:'中吉', p:['绿蚁新醅酒','红泥小火炉'],         n:'小聚小暖，即是好日子。',   y:'宜 小聚', j:'忌 独处' },
  { g:'大吉', p:['晴空一鹤排云上','便引诗情到碧霄'], n:'一鸣惊人，就在近日。',     y:'宜 出手', j:'忌 低调过头' },
  { g:'上吉', p:['纸上得来终觉浅','绝知此事要躬行'], n:'去做，答案在路上。',       y:'宜 实干', j:'忌 空想' },
  { g:'中吉', p:['月落乌啼霜满天','江枫渔火对愁眠'], n:'夜再长，天总会亮。',       y:'宜 早睡', j:'忌 熬夜' },
  { g:'大吉', p:['东风夜放花千树','更吹落星如雨'],   n:'热闹与惊喜，一起到来。',   y:'宜 赴约', j:'忌 缺席' },
  { g:'上吉', p:['疏影横斜水清浅','暗香浮动月黄昏'], n:'低调的美，自有人懂。',     y:'宜 沉淀', j:'忌 喧哗' },
  { g:'中吉', p:['独坐幽篁里','弹琴复长啸'],         n:'独处的时光，最养运气。',   y:'宜 独乐', j:'忌 攀比' },
  { g:'大吉', p:['黄河之水天上来','奔流到海不复回'], n:'势不可挡，一往无前。',     y:'宜 全力以赴', j:'忌 三心二意' },
  { g:'上吉', p:['近水楼台先得月','向阳花木易为春'], n:'你已站在好位置，别浪费。', y:'宜 借势', j:'忌 错过' },
  { g:'中吉', p:['稻花香里说丰年','听取蛙声一片'],   n:'丰收在望，安心等待。',     y:'宜 安心', j:'忌 患得患失' },
  { g:'大吉', p:['千磨万击还坚劲','任尔东西南北风'], n:'根基已牢，无惧风雨。',     y:'宜 坚定', j:'忌 动摇' },
];

// ------------------------------------------------ 白天氛围（固定）
const DAY = { exposure:.82, bgInt:1.0, hemi:.42, dir:1.28, dirColor:0xfff4e0, rim:.46,
              waterColor:0x1fae5e, sunColor:0xffffff, bloom:.22, fog:0x14603c, fogD:0.0026 };

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

// ---------------- 池底：深绿池底 + 焦散光斑（去黄沙，成就翠绿水色） ----------------
function makeCausticsTexture () {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#155840'; g.fillRect(0, 0, s, s);
  // 深浅不一的绿底细纹
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${18 + Math.random() * 30 | 0},${70 + Math.random() * 55 | 0},${52 + Math.random() * 40 | 0},${.05 + Math.random() * .1})`;
    g.fillRect(Math.random() * s, Math.random() * s, 1.6, 1.6);
  }
  // 焦散网纹
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    g.strokeStyle = `rgba(190,255,224,${.04 + Math.random() * .06})`;
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
const SAND_Y = -2.4;                 // 池底深度
const sandTex = makeCausticsTexture();
sandTex.repeat.set(7, 7);
const sand = new THREE.Mesh(
  new THREE.CircleGeometry(90, 48),
  new THREE.MeshStandardMaterial({ map: sandTex, color: 0xffffff, roughness: 1 })
);
sand.rotation.x = -Math.PI / 2;
sand.position.y = SAND_Y;
sand.receiveShadow = true;
scene.add(sand);

// ---------------- 水面 ----------------
const waterNormals = new THREE.TextureLoader(manager).load('/textures/waternormals.jpg', t => {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(10, 10);
});
water = new Water(new THREE.PlaneGeometry(400, 400), {
  textureWidth: isMobile ? 256 : 512,
  textureHeight: isMobile ? 256 : 512,
  waterNormals,
  sunDirection: sunPos.clone().normalize(),
  sunColor: DAY.sunColor,
  waterColor: DAY.waterColor,
  distortionScale: 1.3,
  fog: false
});
water.rotation.x = -Math.PI / 2;
water.position.y = 0;
water.material.transparent = true;
water.material.uniforms.alpha.value = 0.34;   // 清澈见底，鱼完全可见
scene.add(water);

// ---------------- 涟漪（自定义 shader 平面） ----------------
const MAX_RIPPLES = 12;
const rippleUniforms = {
  uTime:    { value: 0 },
  uRipples: { value: Array.from({ length: MAX_RIPPLES }, () => new THREE.Vector4(0, 0, -100, 0)) }, // x,z,t0,强度
};
const rippleMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false,
  blending: THREE.NormalBlending,
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
    // 真实感涟漪：单一主波群 + 色散（波长随传播变长）+ 角向不均匀 +
    // 尖峰缓谷波形；振幅按 1/sqrt(r) 摊薄、随时间指数衰减
    void main(){
      float w = 0.0;
      for (int i = 0; i < ${MAX_RIPPLES}; i++){
        vec4 rp = uRipples[i];
        float age = uTime - rp.z;
        if (age < 0.0 || age > 6.5) continue;
        vec2 rel = vPos - rp.xy;
        float d = length(rel);
        float grow = smoothstep(0.0, 0.1, age);
        float fade = exp(-age * 0.7) * (1.0 - smoothstep(5.0, 6.5, age));
        float lambda = 0.5 + age * 0.55;              // 色散：外圈波长渐大
        float x = d - (0.18 + age * 1.15);
        float env = exp(-x * x / (0.5 * lambda * lambda));
        float ph = 6.2831 * x / lambda;
        float wave = sin(ph) + 0.33 * sin(2.0 * ph + 1.2);   // 尖峰缓谷
        float ang = atan(rel.y, rel.x);
        float irr = 0.82 + 0.12 * sin(ang * 3.0 + rp.z * 13.0)
                         + 0.06 * sin(ang * 7.0 - rp.z * 5.0); // 圆环轻微不均匀
        w += wave * env * irr * rp.w * grow * fade / sqrt(1.0 + d * 1.3);
      }
      float s = clamp(w * 2.4, -1.0, 1.0);
      vec3 bright = vec3(0.88, 1.0, 0.96);
      vec3 dark   = vec3(0.03, 0.14, 0.10);
      vec3 col = s > 0.0 ? mix(vec3(0.5), bright, s) : mix(vec3(0.5), dark, -s);
      float a = s > 0.0 ? s * 0.4 : -s * 0.2;
      gl_FragColor = vec4(col, a);
    }`
});
const ripplePlane = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), rippleMat);
ripplePlane.rotation.x = -Math.PI / 2;
ripplePlane.position.y = 0.09;
scene.add(ripplePlane);
let rippleIdx = 0;
function addRipple (x, z, strength = 1) {
  rippleUniforms.uRipples.value[rippleIdx].set(x, z, clock.elapsedTime, strength);
  rippleIdx = (rippleIdx + 1) % MAX_RIPPLES;
}

// ---------------- 锦鲤鱼群 ----------------
// 六个流行品种，花纹在 UV 空间逐像素绘制（贴图 2048² 布局：两条对角鱼身条带，
// 头在条带下端 y>1250 处；眼球在右下角、口腔件在顶部中央——这两处不上色）：
//   红白 Kohaku   —— 原版红斑
//   大正三色 Sanke —— 红斑 + 种子噪声生成的墨斑（白底为主，避开头部）
//   昭和三色 Showa —— 更大块的缠身墨斑，头部也有墨
//   丹顶 Tancho    —— 全身纯白，仅头顶一枚圆红斑
//   黄金 Yamabuki  —— 通体金黄的金属系
//   白金 Platinum  —— 通体银白的金属系
// 体型也按品种差异化：sx=体宽 sy=体高 sz=体长
const VARIANTS = [
  { id: 'kohaku',   body: { sx: 1.00, sy: 1.00, sz: 1.00 } },
  { id: 'sanke',    body: { sx: 1.06, sy: 1.05, sz: 1.08 }, sumi: { seed: 7,  freq: 6.8, thr: .58, head: false } },
  { id: 'showa',    body: { sx: 1.17, sy: 1.10, sz: 0.99 }, sumi: { seed: 23, freq: 4.6, thr: .52, head: true  } },
  { id: 'tancho',   body: { sx: 0.93, sy: 0.96, sz: 0.97 } },
  { id: 'yamabuki', body: { sx: 0.97, sy: 0.95, sz: 1.14 } },
  { id: 'platinum', body: { sx: 0.88, sy: 0.94, sz: 1.06 } },
];

// —— 种子化二维值噪声（斑块生成用，跨会话稳定）——
function hash2 (ix, iy, seed) {
  let h = (ix * 374761393 + iy * 668265263 + seed * 974634) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function vnoise (x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const a = hash2(ix, iy, seed), b = hash2(ix + 1, iy, seed);
  const c2 = hash2(ix, iy + 1, seed), d = hash2(ix + 1, iy + 1, seed);
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  return a + (b - a) * ux + (c2 - a) * uy + (a - b - c2 + d) * ux * uy;
}
function fbm (x, y, seed) {
  return vnoise(x, y, seed) * .62 + vnoise(x * 2.3 + 7.1, y * 2.3 + 3.7, seed + 13) * .38;
}
const sstep = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

const variantMapCache = {};
function variantTexture (srcMap, v) {
  if (v.id === 'kohaku' || !srcMap || !srcMap.image) return srcMap;
  const key = v.id + '_' + srcMap.uuid;
  if (variantMapCache[key]) return variantMapCache[key];
  const img = srcMap.image;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), px = id.data;
  const w = c.width, sc = w / 2048;
  const inEye  = (x, y) => x > 1740 * sc && y > 1740 * sc;          // 眼球件
  const inOral = (x, y) => x > 1180 * sc && x < 1630 * sc && y < 270 * sc; // 口腔件

  // 丹顶：先扫描两条身体条带头部红斑的质心，作为圆斑落点
  let heads = null;
  if (v.id === 'tancho') {
    const acc = [{ x: 0, y: 0, n: 0 }, { x: 0, y: 0, n: 0 }];
    for (let y = Math.floor(1250 * sc); y < c.height; y += 2) {
      for (let x = 0; x < w; x += 2) {
        const i = (y * w + x) * 4;
        const r = px[i], gr = px[i + 1], b = px[i + 2];
        if (r > 130 && r - gr > 45 && r - b > 45 && !inEye(x, y)) {
          const a = acc[x < 1150 * sc ? 0 : 1];
          a.x += x; a.y += y; a.n++;
        }
      }
    }
    heads = acc.map((a, i) => a.n > 40
      ? { x: a.x / a.n, y: a.y / a.n }
      : (i === 0 ? { x: 950 * sc, y: 1470 * sc } : { x: 1420 * sc, y: 1600 * sc }));
  }

  const R = 92 * sc, EDGE = 20 * sc;      // 丹顶圆斑半径与柔边
  for (let i = 0; i < px.length; i += 4) {
    const p = i >> 2, x = p % w, y = (p / w) | 0;
    if (inEye(x, y) || inOral(x, y)) continue;
    const r = px[i] / 255, gr = px[i + 1] / 255, b = px[i + 2] / 255;
    const mx = Math.max(r, gr, b);
    const l = (mx + Math.min(r, gr, b)) / 2;
    const redA  = sstep(.05, .20, r - Math.max(gr, b));    // 红斑强度
    const blueA = sstep(.035, .12, b - r);                 // 蓝灰杂斑强度
    const patA  = Math.max(redA, blueA);
    // “无花纹底色亮度”：花纹处回填白底亮度（≈.87），保留鳞片明暗起伏
    const base = mx * (1 - patA) + (.87 + (mx - .87) * .25) * patA;

    if (v.id === 'yamabuki') {            // 通体金黄：花纹亮度全部抹平后镀金
      const t2 = .26 + base * .74;
      px[i]     = Math.min(255, Math.round(268 * t2));
      px[i + 1] = Math.min(255, Math.round(186 * t2));
      px[i + 2] = Math.round(34 * t2 * t2);
    } else if (v.id === 'platinum') {     // 通体银白：同样抹平花纹
      const t2 = Math.min(1, .16 + base * .92);
      px[i] = px[i + 1] = Math.round(250 * t2);
      px[i + 2] = Math.min(255, Math.round(252 * t2));
    } else if (v.id === 'tancho') {       // 白身 + 头顶圆红斑
      const h = x < 1150 * sc ? heads[0] : heads[1];
      const d = Math.hypot(x - h.x, y - h.y);
      const circle = 1 - sstep(R - EDGE, R + EDGE, d);
      if (circle > 0) {
        const shade = .55 + base * .6;
        px[i]     = Math.round(px[i]     * (1 - circle) + Math.min(255, 216 * shade + 40) * circle);
        px[i + 1] = Math.round(px[i + 1] * (1 - circle) + 42 * shade * circle);
        px[i + 2] = Math.round(px[i + 2] * (1 - circle) + 34 * shade * circle);
      } else if (patA > 0) {              // 圆斑之外的红斑蓝斑全部褪成白
        const t2 = Math.min(1, .2 + base * .9);
        px[i]     = Math.round(px[i]     * (1 - patA) + 250 * t2 * patA);
        px[i + 1] = Math.round(px[i + 1] * (1 - patA) + 247 * t2 * patA);
        px[i + 2] = Math.round(px[i + 2] * (1 - patA) + 242 * t2 * patA);
      }
    } else if (v.sumi) {                  // 三色：清掉蓝灰杂斑，再落墨
      if (blueA > 0) {
        const t2 = Math.min(1, .2 + base * .9);
        px[i]     = Math.round(px[i]     * (1 - blueA) + 249 * t2 * blueA);
        px[i + 1] = Math.round(px[i + 1] * (1 - blueA) + 246 * t2 * blueA);
        px[i + 2] = Math.round(px[i + 2] * (1 - blueA) + 241 * t2 * blueA);
      }
      if (!v.sumi.head && y > 1300 * sc) continue;        // 大正：头部留白
      if (v.id === 'sanke' && redA > .45) continue;       // 大正：墨不压红
      const m = fbm(x / w * v.sumi.freq, y / w * v.sumi.freq, v.sumi.seed);
      const ink = sstep(v.sumi.thr, v.sumi.thr + .075, m);
      if (ink > 0) {
        const v0 = .06 + l * .13;         // 保留鳞片明暗的炭墨
        px[i]     = Math.round(px[i]     * (1 - ink) + 255 * v0 * ink);
        px[i + 1] = Math.round(px[i + 1] * (1 - ink) + 255 * (v0 + .012) * ink);
        px[i + 2] = Math.round(px[i + 2] * (1 - ink) + 255 * (v0 + .035) * ink);
      }
    }
  }
  g.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.flipY = srcMap.flipY; tex.colorSpace = srcMap.colorSpace;
  tex.wrapS = srcMap.wrapS; tex.wrapT = srcMap.wrapT;
  tex.anisotropy = srcMap.anisotropy;
  variantMapCache[key] = tex;
  return tex;
}
const KOI_N = 6;                                   // 六个品种一条不少
const kois = [];
const DEBUG_DIR = /debug/.test(location.search);   // ?debug 显示速度方向箭头
let koiTemplate = null, koiAnims = null;

new GLTFLoader(manager).load('/models/koi.glb', gltf => {
  koiTemplate = gltf.scene;
  koiAnims = gltf.animations;
  const swimClips = koiAnims.filter(c => /swim_A\d/.test(c.name));
  for (let i = 0; i < KOI_N; i++) {
    const root = new THREE.Group();
    root.rotation.order = 'YXZ';               // 偏航→俯仰→侧倾
    const model = SkeletonUtils.clone(koiTemplate);
    // 校准（calib.html 顶视验证）：模型鼻头即 +Z，与前进向量 (sinθ, cosθ) 一致，无需翻转
    const v = VARIANTS[i % VARIANTS.length];
    model.traverse(n => {
      if (n.isMesh) {
        n.castShadow = !isMobile;
        n.material = n.material.clone();
        if (n.material.map) n.material.map = variantTexture(n.material.map, v);
        if ('metalness' in n.material) n.material.metalness = .12;
        if ('roughness' in n.material) n.material.roughness = .45;
        if (n.material.emissive) { n.material.emissive.setHex(0xffe8d0); n.material.emissiveIntensity = .04; }
      }
    });
    const scale = 8.5 + Math.random() * 1.8;
    model.scale.set(scale * v.body.sx, scale * v.body.sy, scale * v.body.sz);
    root.add(model);

    const mixer = new THREE.AnimationMixer(model);
    const clip = swimClips.length ? swimClips[i % swimClips.length] : koiAnims[0];
    const action = mixer.clipAction(clip);
    action.play();
    action.time = Math.random() * clip.duration;

    const a = (i / KOI_N) * Math.PI * 2;
    const cruise = .55 + Math.random() * .35;
    const koi = {
      root, mixer, action, scale: scale * Math.max(v.body.sx, v.body.sz),
      x: Math.cos(a) * 6, z: Math.sin(a) * 6,
      heading: Math.random() * Math.PI * 2,
      speed: cruise, baseSpeed: cruise,
      angVel: 0,                                 // 当前角速度 rad/s（惯性转向）
      depth: -0.30 - Math.random() * .18,        // 贴近水面巡游，背脊隐约破水
      wanderPh: Math.random() * 100,
      wanderTarget: null, wanderUntil: 0,        // 闲游目标点
      roll: 0, pitch: 0, jump: null,
    };
    root.position.set(koi.x, koi.depth, koi.z);
    scene.add(root);
    if (DEBUG_DIR) { koi.arrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(), 3.2, 0xffee00, .8, .5); scene.add(koi.arrow); }
    kois.push(koi);
  }
}, undefined, () => { pctEl.textContent = '模型加载失败'; });

// 鱼群目标（涟漪吸引）
const attract = { x: 0, z: 0, until: -1 };

// 角度归一到 [-π, π]
function wrapAngle (a) {
  while (a >  Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

const MAX_TURN = 1.3;        // 最大角速度 rad/s（鱼不能瞬间掉头）
const TURN_ACC = 2.6;        // 角加速度：转向需要时间建立/消解
const KOI_ACCEL = 0.9;       // 直线加减速

function updateKois (dt, t) {
  for (const k of kois) {
    if (k.jump) { updateJump(k, dt, t); continue; }

    // —— 1. 求“期望朝向” desired（把各种影响合成为一个目标方向向量）——
    let wantX = Math.sin(k.heading), wantZ = Math.cos(k.heading); // 默认保持直行
    let urgency = 0;         // 转向紧迫度 0..1，越大越急、也越减速
    let feeding = false;

    // 闲游：每隔几秒挑一个池内目标点，缓缓游过去（自然的巡游感）
    if (!k.wanderTarget || t > k.wanderUntil ||
        Math.hypot(k.wanderTarget.x - k.x, k.wanderTarget.z - k.z) < 1.5) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * POOL_R * .6;
      k.wanderTarget = { x: Math.cos(a) * r, z: Math.sin(a) * r };
      k.wanderUntil = t + 5 + Math.random() * 6;
    }
    wantX = k.wanderTarget.x - k.x; wantZ = k.wanderTarget.z - k.z;

    // 涟漪聚食：覆盖闲游目标，权重更高
    if (t < attract.until) {
      const dx = attract.x - k.x, dz = attract.z - k.z;
      if (Math.hypot(dx, dz) > 1.0) { wantX = dx * 3; wantZ = dz * 3; feeding = true; }
    }

    // 避让同伴：叠加一个排斥向量
    for (const o of kois) {
      if (o === k || o.jump) continue;
      const dx = k.x - o.x, dz = k.z - o.z;
      const d2 = dx * dx + dz * dz;
      if (d2 < 9 && d2 > .0001) {
        const w = 4.5 / (0.6 + d2);
        wantX += dx * w; wantZ += dz * w;
      }
    }

    // 池缘回避：接近边界时强烈拉回圆心
    const r = Math.hypot(k.x, k.z);
    if (r > POOL_R * .7) {
      const s = THREE.MathUtils.smoothstep(r, POOL_R * .7, POOL_R * 1.02) * 6;
      wantX += (-k.x / r) * s; wantZ += (-k.z / r) * s;
      urgency = Math.max(urgency, THREE.MathUtils.smoothstep(r, POOL_R * .7, POOL_R));
    }

    // —— 2. 惯性转向：朝 desired 逼近，但受角速度/角加速度限制 ——
    const desired = Math.atan2(wantX, wantZ);
    const diff = wrapAngle(desired - k.heading);
    urgency = Math.max(urgency, Math.min(1, Math.abs(diff) / Math.PI));
    // 目标角速度正比于角度差，但封顶；再用角加速度平滑逼近（消除抖动/急停）
    const wantAngVel = THREE.MathUtils.clamp(diff * 2.2, -MAX_TURN, MAX_TURN);
    k.angVel += THREE.MathUtils.clamp(wantAngVel - k.angVel, -TURN_ACC * dt, TURN_ACC * dt);
    k.heading += k.angVel * dt;

    // —— 3. 速度：转急了自然减速（真实鱼过弯放慢），聚食时加速 ——
    let targetSpeed = k.baseSpeed * (1 - urgency * .55);
    if (feeding) targetSpeed = k.baseSpeed * 2.0;
    k.speed += THREE.MathUtils.clamp(targetSpeed - k.speed, -KOI_ACCEL * dt, KOI_ACCEL * dt);

    // —— 4. 只沿鼻尖方向前进（永远不侧移/倒退）——
    k.x += Math.sin(k.heading) * k.speed * dt;
    k.z += Math.cos(k.heading) * k.speed * dt;

    // —— 5. 姿态：转弯侧倾(roll) + 起伏俯仰(pitch)，平滑跟随 ——
    const targetRoll = THREE.MathUtils.clamp(-k.angVel * .5, -.5, .5);
    k.roll += (targetRoll - k.roll) * Math.min(1, dt * 2.5);
    const yWave = Math.sin(t * .5 + k.wanderPh) * .12;
    const y = k.depth + yWave;
    const targetPitch = -Math.cos(t * .5 + k.wanderPh) * .12;   // 起伏对应的抬头/低头
    k.pitch += (targetPitch - k.pitch) * Math.min(1, dt * 2);

    k.root.position.set(k.x, y, k.z);
    k.root.rotation.set(k.pitch, k.heading, k.roll);

    // —— 6. 尾鳍摆动频率随速度（游得快尾巴摆得快）——
    k.action.timeScale = .5 + k.speed * .9;
    k.mixer.update(dt);

    if (k.arrow) { k.arrow.position.set(k.x, .6, k.z); k.arrow.setDirection(new THREE.Vector3(Math.sin(k.heading), 0, Math.cos(k.heading))); }

    if (feeding && k.speed > 1 && Math.random() < dt * 1.0) addRipple(k.x, k.z, .2);
  }

  // —— 7. 硬性分离：任何两条鱼不允许身体重叠（不穿模）——
  for (let i = 0; i < kois.length; i++) {
    for (let j = i + 1; j < kois.length; j++) {
      const a = kois[i], b = kois[j];
      if (a.jump || b.jump) continue;
      const dx = b.x - a.x, dz = b.z - a.z;
      const d = Math.hypot(dx, dz);
      const minD = (a.scale + b.scale) * 0.105;      // 近似两条鱼的体半径之和
      if (d > 0.0001 && d < minD) {
        const push = (minD - d) / 2, nx = dx / d, nz = dz / d;
        a.x -= nx * push; a.z -= nz * push;
        b.x += nx * push; b.z += nz * push;
        a.root.position.x = a.x; a.root.position.z = a.z;
        b.root.position.x = b.x; b.root.position.z = b.z;
      }
    }
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
  k.root.rotation.set(pitch, J.h0, 0);   // 鼻头+Z：正俯角=低头（入水/蓄力），负=昂头跃升
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
// 古筝式吉祥乐：Karplus-Strong 物理建模拨弦（真实弦振动质感），
// C 宫五声音阶，偶发上滑音与双音，轻回声余韵
let audio = null;
const PENTA = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
const pluckBufs = {};
function makePluckBuf (ctx, freq) {
  const sr = ctx.sampleRate, dur = 2.8, n = Math.floor(sr * dur);
  const buf = ctx.createBuffer(1, n, sr);
  const out = buf.getChannelData(0);
  const N = Math.round(sr / freq);
  const line = new Float32Array(N);
  for (let i = 0; i < N; i++) line[i] = (Math.random() * 2 - 1) * (1 - i / N * .35); // 靠桥拨弦的亮噪起振
  let idx = 0, prev = 0;
  for (let i = 0; i < n; i++) {
    out[i] = line[idx];
    let s = .5 * (line[idx] + line[(idx + 1) % N]) * .9965;  // 弦损耗
    s = .74 * s + .26 * prev; prev = s;                       // 轻低通→温润木感
    line[idx] = s;
    idx = (idx + 1) % N;
  }
  const fadeN = Math.floor(sr * .006);
  for (let i = 0; i < fadeN; i++) out[i] *= i / fadeN;        // 去起振“咔”声
  return buf;
}
function pluck (freq, t, vol = .5, bend = false) {
  const { ctx, master } = audio;
  let b = pluckBufs[freq]; if (!b) b = pluckBufs[freq] = makePluckBuf(ctx, freq);
  const src = ctx.createBufferSource(); src.buffer = b;
  if (bend) {                                                 // 古筝上滑音
    src.playbackRate.setValueAtTime(.9, t);
    src.playbackRate.linearRampToValueAtTime(1, t + .24);
  }
  const g = ctx.createGain(); g.gain.value = vol;
  src.connect(g); g.connect(master);
  src.start(t);
}
function initAudio () {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const master = ctx.createGain(); master.gain.value = 0;
  master.connect(ctx.destination);
  // 轻回声（似远寺余韵）
  const delay = ctx.createDelay(); delay.delayTime.value = .31;
  const fb = ctx.createGain(); fb.gain.value = .22;
  const wet = ctx.createGain(); wet.gain.value = .14;
  master.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
  audio = { ctx, master };
  // 生成式旋律：五声音阶上随机漫步（级进为主），偶发滑音/双音
  let cur = 3;
  (function melody () {
    if (!audio) return;
    if (audio.master.gain.value > .01) {
      const t = ctx.currentTime + .05;
      const step = Math.random() < .7 ? (Math.random() < .5 ? -1 : 1)
                                      : (Math.random() < .5 ? -2 : 2);
      cur = Math.max(0, Math.min(PENTA.length - 1, cur + step));
      pluck(PENTA[cur], t, .4 + Math.random() * .2, Math.random() < .22);
      if (Math.random() < .3) {                               // 双音：低四/五度相和
        const j = Math.max(0, cur - 3);
        pluck(PENTA[j], t + .16 + Math.random() * .2, .26);
      }
    }
    setTimeout(melody, 2200 + Math.random() * 3600);
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
  const len = ctx.sampleRate * .3, buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.2);
  const src = ctx.createBufferSource(); src.buffer = buf;
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = .8;
  const g = ctx.createGain(); g.gain.value = .26;
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
      addRipple(hit.x, hit.z, 1.5);
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
