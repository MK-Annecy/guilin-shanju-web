# 归林山居 · 国际版网站 (Gui Lin Shan Ju · Web)

云南普洱的森林静修处，面向国内外访客的官网与预订平台。

> 配合现有的微信小程序 `../guilin-shanju/`，同一品牌、同一内容、同一房型数据。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发（中英双语）
npm run dev
# 打开 http://localhost:3000 （自动跳转到 /zh）
# 或 http://localhost:3000/en （英文）

# 生产构建
npm run build
```

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根 layout（透传）
│   ├── globals.css             # 品牌色 + Tailwind v4 配置
│   └── [locale]/               # i18n 路由
│       ├── layout.tsx          # 字体 + Header + Footer
│       ├── page.tsx            # 首页
│       ├── rooms/              # 房型列表 + 详情
│       ├── experiences/        # 山间体验
│       ├── gallery/            # 画廊
│       ├── about/              # 关于
│       ├── contact/            # 联系
│       └── book/[id]/          # 预订流程
├── components/
│   ├── header.tsx              # 导航（响应式 + 中英切换）
│   ├── footer.tsx
│   ├── hero.tsx                # 首页大图 hero
│   ├── room-card.tsx
│   └── experience-card.tsx
├── i18n/
│   ├── routing.ts              # 路由配置（zh / en）
│   └── request.ts              # next-intl server config
├── messages/
│   ├── zh.json                 # 中文文案
│   └── en.json                 # 英文文案
├── lib/
│   └── utils.ts                # cn() 等工具
└── middleware.ts               # i18n 路由中间件
```

## 🎨 品牌色（已写入 globals.css）

| 名称 | HEX | 用途 |
|---|---|---|
| 苔藓绿 moss | `#5C7A5C` | 主色、按钮 |
| 暖木棕 wood | `#8B6F47` | 副色、强调 |
| 云雾白 cloud | `#F5F5F0` | 背景 |
| 深苔藓 moss-dark | `#3F5640` | hover 态 |

## 🌐 部署到 Cloudflare Pages

### 方式 A：Git 集成（推荐）

1. 推送到 GitHub：`git push`
2. 登录 https://dash.cloudflare.com/
3. **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
4. 选择仓库 + 分支（main）
5. **Build settings**：
   - Framework preset: `Next.js`
   - Build command: `npm run build`
   - Build output: 留空（自动检测）
6. **Environment variables**（暂不需要）
7. Deploy

### 方式 B：直接上传

1. `npm run build`
2. Cloudflare Dashboard → Pages → Create → **Upload assets**
3. 上传 `.next/` 和 `public/`

### 自定义域名

Pages 项目 → **Custom domains** → 添加 `forestretreat.cn`（`www.forestretreat.cn` 也建议加）

## 🔧 关键配置文件

- `next.config.ts` — Next.js + next-intl + 图片优化
- `wrangler.toml` — Cloudflare 部署配置（可选）
- `src/i18n/routing.ts` — 语言列表

## 📝 待办

- [ ] 接入 Supabase（订单持久化）
- [ ] 接入 Stripe / 微信支付
- [ ] 替换 Unsplash 临时图为真实摄影
- [ ] 添加 ICP 备案号（合规）
- [ ] 添加 Google Analytics / Plausible
- [ ] 添加 sitemap.xml / robots.txt

## 📞 联系

- 邮箱：stay@forestretreat.cn
- 地址：云南省普洱市澜沧县惠民镇云山林场
