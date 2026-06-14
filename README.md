# 归林山居 · 国际版网站 (Gui Lin Shan Ju · Web)

云南普洱的森林静修处，面向国内外访客的官网与预订平台。

> 配合现有的微信小程序 `../guilin-shanju/`，同一品牌、同一内容、同一房型数据。

## 🚀 快速开始

```bash
# 安装依赖
npm install

# 本地开发（中英双语 + D1 本地模拟）
npm run dev
# 打开 http://localhost:3000 （自动跳转到 /zh）

# Workers 运行时本地预览（含真 D1 local binding）
npm run preview

# 生产构建（仅 Next.js 产物）
npm run build
```

## 📁 项目结构

```
src/
├── app/
│   ├── layout.tsx              # 根 layout（透传）
│   ├── globals.css             # 品牌色 + Tailwind v4 配置
│   ├── actions/
│   │   └── book.ts             # Server Action：提交预订到 D1
│   └── [locale]/               # i18n 路由
│       ├── layout.tsx
│       ├── page.tsx            # 首页
│       ├── rooms/              # 房型列表 + 详情
│       ├── experiences/        # 山间体验
│       ├── gallery/            # 画廊
│       ├── about/              # 关于
│       ├── contact/            # 联系
│       └── book/[id]/          # 预订流程（调 Server Action → D1）
├── components/
├── i18n/                       # next-intl 配置
├── lib/
│   ├── booking.ts              # 房型数据 + 价格 + 计算
│   ├── d1.ts                   # D1 binding accessor
│   └── utils.ts
├── messages/                   # zh.json / en.json
└── middleware.ts               # i18n 路由中间件

migrations/
└── 0001_create_bookings.sql    # D1 schema

wrangler.jsonc                  # Cloudflare Workers + D1 binding
open-next.config.ts             # OpenNext adapter config
.dev.vars                       # 本地开发环境变量（gitignored）
worker-configuration.d.ts       # Cloudflare bindings TS 类型
```

## 💾 数据库：Cloudflare D1

预订数据持久化到 Cloudflare D1（SQLite 兼容、Edge 部署、免费额度 5GB）。

### 表结构（migrations/0001_create_bookings.sql）

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | INTEGER PK | 自增主键 |
| `booking_ref` | TEXT UNIQUE | 人类可读编号 `GL-YYYYMMDD-XXXX` |
| `room_id` | TEXT | `suite` / `double` / `twin` |
| `check_in` / `check_out` | DATE | 入住 / 退房 |
| `nights` / `guests` | INTEGER | 晚数 / 人数 |
| `price_per_night` / `total_cny` | INTEGER | 单价 / 总价（CNY） |
| `guest_name` / `phone` / `email` | TEXT | 客人信息 |
| `remarks` | TEXT | 备注 |
| `status` | TEXT | `pending` / `confirmed` / `cancelled` / `completed` |
| `locale` | TEXT | 提交时的语言 `zh` / `en` |
| `created_at` / `updated_at` | TEXT | ISO8601 UTC |

## ☁️ 部署到 Cloudflare Workers（OpenNext）

> 从 Pages 切换到 Workers：OpenNext 在 Workers 上跑得最稳，Image Optimization、Server Actions 全部原生支持。Custom domain 一样能绑。

### 一次性配置

```bash
# 1. 登录 Cloudflare（会弹浏览器）
npx wrangler login

# 2. 创建 D1 数据库（拿到 database_id 后填回 wrangler.jsonc）
npx wrangler d1 create guilin-shanju-bookings
# 把输出的 "database_id" 替换 wrangler.jsonc 里的 REPLACE_WITH_REAL_D1_ID_AFTER_wrangler_d1_create

# 3. 在 Cloudflare 账户里创建一个 R2 bucket 给缓存用（可选但推荐）
npx wrangler r2 bucket create guilin-shanju-cache
# 拿到名字后回 wrangler.jsonc 加 r2_buckets 绑定（参考 OpenNext 文档）

# 4. 本地先试一遍
npm run db:migrate:local       # 应用迁移到本地 .wrangler D1
npm run dev                    # 起 dev server，试一下预订流程
npm run preview                # 用 wrangler runtime 完整预览

# 5. 跑通了，部署
npm run db:migrate:remote      # 应用迁移到 Cloudflare D1
npm run deploy                 # build + deploy 到 Workers
```

### 部署后配置

1. Cloudflare Dashboard → Workers → `guilin-shanju-web` → **Settings → Triggers**
2. **Custom Domains** → 添加 `forestretreat.cn` 和 `www.forestretreat.cn`
3. **Settings → Variables** → 添加生产环境变量（如果用 Resend/SendGrid 邮件通知就在这填 API key）
4. Dashboard → **Workers → D1** 也能直接 SQL 查询预订

### Git 集成自动部署（推荐）

```bash
git remote add origin https://github.com/MK-Annecy/guilin-shanju-web.git
git push
# 然后 Cloudflare Dashboard → Workers → guilin-shanju-web → Settings → Builds
# Connect to GitHub，选择 MK-Annecy/guilin-shanju-web，main 分支
# Build command: npm run deploy
```

## 🔍 查看订单

```bash
# 本地（dev 时）
npm run db:console:local

# 远端（生产）
npm run db:console:remote
```

或直接 Cloudflare Dashboard → Workers & Pages → D1 → `guilin-shanju-bookings` → Console。

## 🎨 品牌色

| 名称 | HEX | 用途 |
|---|---|---|
| 苔藓绿 moss | `#5C7A5C` | 主色、按钮 |
| 暖木棕 wood | `#8B6F47` | 副色、强调 |
| 云雾白 cloud | `#F5F5F0` | 背景 |
| 深苔藓 moss-dark | `#3F5640` | hover 态 |

## 🔧 关键文件

- `wrangler.jsonc` — Cloudflare Workers + D1 binding
- `open-next.config.ts` — OpenNext adapter
- `next.config.ts` — Next.js + next-intl + `initOpenNextCloudflareForDev()`
- `src/lib/booking.ts` — 单一数据源：房型 + 价格 + 计算
- `src/lib/d1.ts` — D1 binding 访问（getCloudflareContext）
- `src/app/actions/book.ts` — Server Action：写 D1（含 dev fallback）
- `src/i18n/routing.ts` — 语言列表

## 📝 待办

- [ ] 部署到 Cloudflare（已就绪，只缺 `wrangler d1 create`）
- [ ] 接邮件通知（Resend）— 提交预订后自动发邮件给 stay@forestretreat.cn
- [ ] 替换 Unsplash 临时图为真实摄影
- [ ] 加 ICP 备案号（合规）
- [ ] 加 Google Analytics / Plausible
- [ ] 加 sitemap.xml / robots.txt
- [ ] 简单的"管理后台"页面（看订单 / 改 status）— 用 D1 + 一个 /admin 路由 + Cloudflare Access 保护

## 📞 联系

- 邮箱：stay@forestretreat.cn
- 地址：云南省普洱市澜沧县惠民镇云山林场
