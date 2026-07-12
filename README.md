# 锦鲤 · jin.li

一方数字锦鲤池。碧水红鲤，波光潋滟；轻触水面，锦鲤游来；求一签好运，愿好运常伴。

纯静态站点（Three.js ES Modules + importmap，无构建步骤）。

## 体验

- **鱼群**：6 条不同花色的锦鲤（红白 / 金黄 / 墨色 / 橙红），boids 群游 + 转向侧倾，骨骼游动动画
- **涟漪聚鱼**：点击水面产生扩散涟漪，附近锦鲤加速游来聚集
- **求好运**：右下按钮，一条锦鲤跃出水面、水花落下，浮现签文卡片（16 种诗句签文 × 88 签号），可保存 PNG / 系统分享
- **昼夜氛围**：按访客本地时间自动切换 day / gold(晨昏) / night 三套光照水色，可用 `?sky=day|gold|night` 强制
- **氛围细节**：花瓣飘落触水生纹、池底焦散光斑、卵石、bloom 辉光（桌面端）、程序生成的水声/水滴/风铃音效（无音频资源）
- **中英双语**：右上切换，默认跟随浏览器语言

## 工程

- 移动端：DPR 上限 1.6、水面反射降为 256、关阴影/后期；桌面自适应降画质（实测 FPS < 30 自动降 DPR、关 bloom）
- 无 WebGL / prefers-reduced-motion 降级
- SEO：meta / Open Graph / Twitter Card / JSON-LD / sitemap / manifest，分享图 `assets/og.jpg` 取自实景
- `node test.cjs` 无头浏览器端到端验证（加载、点水、求签全链路 + 截图）

## 素材

- `models/koi.glb` 带骨骼游动动画的锦鲤（源自旧版 jin.li）
- `textures/skybox.hdr`、`textures/waternormals.jpg`
- `three/` 仅收录用到的 three.js r166 模块
