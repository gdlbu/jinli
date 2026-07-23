# 锦鲤 · jin.li

一方数字锦鲤池。碧水红鲤，波光潋滟；轻触水面，锦鲤游来；求一签好运，愿好运常伴。

纯静态站点（Three.js ES Modules + importmap，无构建步骤）。

## 体验

- **鱼群**：6 个流行锦鲤品种——红白 / 大正三色 / 昭和三色 / 丹顶 / 黄金 / 白金，花纹在贴图 UV 空间逐像素绘制（三色墨斑为种子噪声生成、丹顶自动定位头顶圆斑），体型按品种差异化；贴近水面巡游、清水下完全可见；带惯性的转向物理，硬性碰撞分离不穿模，骨骼游动动画；`?debug` 可显示方向箭头校验
- **涟漪聚鱼**：点击水面产生物理感涟漪（主波包约1.25m/s + 前导毛细波 + 尾随慢波，振幅按 1/√r 摊薄、随时间衰减），附近锦鲤加速游来聚集
- **求好运**：右下按钮，一条锦鲤跃出水面、水花落下，浮现签文卡片（48 种诗句签文 × 88 签号），可保存 PNG / 系统分享
- **氛围**：固定白天景，翠绿清澈见底；池底细沙焦散；bloom 辉光（桌面端）；真实古筝录音《Senor Guzheng and the Happy Monks》（欢快国风，Antti Luode 作，CC BY 3.0，via Wikimedia Commons），开声后懒加载；离线时回退 Karplus-Strong 生成式拨弦
- **中英双语**：默认中文，右上可切英文

## 工程

- 移动端：DPR 上限 1.6、水面反射降为 256、关阴影/后期；桌面自适应降画质（实测 FPS < 30 自动降 DPR、关 bloom）
- 无 WebGL / prefers-reduced-motion 降级
- SEO：meta / Open Graph / Twitter Card / JSON-LD / sitemap / manifest，分享图 `assets/og.jpg` 取自实景
- `node test.cjs` 无头浏览器端到端验证（加载、点水、求签全链路 + 截图）

## 素材

- `models/koi.glb` 带骨骼游动动画的锦鲤（源自旧版 jin.li）
- `textures/skybox.hdr`、`textures/waternormals.jpg`
- `assets/audio/guzheng-happy.mp3` — "Senor Guzheng and the Happy Monks" by Antti Luode, CC BY 3.0, via Wikimedia Commons
- `three/` 仅收录用到的 three.js r166 模块
