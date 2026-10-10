# 锐锐独立站

浅粉色首页；点击聊天入口进入 `/chat` 全屏聊天。支持文字、图片选择与压缩、预览、放大、发送失败重试。`/admin` 使用密码登录和独立 HttpOnly Cookie。

## 运行

需要 Node.js 22.13+，使用 package-lock.json：

```powershell
npm ci
npm run dev
npm run typecheck
npm test
npm run content:catalog
npm run build
```

站点文案保存在 `lib/site-copy.ts`，后台标签和其他可见文字由 `scripts/generate-catalog.mjs` 收集到 `lib/catalog.json` 和 `backend/src/content/catalog.json`。新文案加入后重新生成目录。后台支持搜索、分类、页面预览、发布、JSON 导入导出、历史恢复。用户输入、照片与 Key 不属于站点文案，不会被文案替换器修改。文案默认值修改后，已有后台发布值仍优先。

## 独立服务

`backend/` 是此站专用 Cloudflare Pages Functions。独立项目 `ruirui-whispers-20261010`，独立 BOARD KV、会话签名密钥与 Key 加密密钥。前端 `/api/*` 通过服务端转发至该站自己的后端。未连接 Chanray 的数据存储或 AI 配置。

需要在后端设置 `ADMIN_PASSWORD`、`ADMIN_TOKEN`、`ADMIN_ENCRYPTION_KEY`。后台 API Key 以 AES-GCM 加密存入独立 KV，查询不会返回原 Key。源代码不包含实际密码或密钥。默认 API 为 `https://api.deepseek.com/chat/completions`，模型为 `deepseek-flash`，可在后台单独修改。真实 AI 需要用户配置有效 Key；不会自动调用付费模型。

图片发送使用 inline raster image 的 OpenAI-compatible 消息格式。图片在浏览器压缩至最长边 1440 像素，发送给此站服务端和配置的 AI 服务；不写入持久存储。图片理解需要所选服务和模型支持图片。历史请求仅携带文字和当前图片，聊天文字和图片保存在当前浏览器的 IndexedDB，支持多段聊天记录、刷新恢复和切换历史；正常与隐藏模式的记录分别保存。清空当前聊天会确认，并保留其他聊天。清除浏览器站点数据会删除本机记录，记录不会跨设备同步。未经支持的模型不会获得模拟图片回复。

后端允许 JPEG/PNG/WebP 的有界内联图片，拒绝远程 URL 和 SVG。Cookie 写操作检查 Origin。KV 没有原子并发保证，生产流量需配置平台限流。

## 发布与回退

前端通过 Sites 维护 `.openai/hosting.json` 中的站点身份并发布 Vinext Worker。后端使用 `backend/wrangler.jsonc` 部署 Pages Functions。因为 Vinext 会生成父目录 Wrangler 配置，建议将 backend 的 functions、src、public、site、wrangler.jsonc 复制到独立工作目录，从该目录执行固定版本 Wrangler Pages 部署，避免使用父目录 Worker 配置。

每轮修改前保存源码或 Git bundle。前端在 Sites 选择已保存版本回退；后端在 Cloudflare Pages 切换部署；文案恢复使用后台历史记录。修改 Key 前自行保留原 Key，后台不会导出密钥。

## 隐藏模式与激活码

前端设置可输入一次性激活码。正常与隐藏模式共用相同页面结构和组件，文案、历史备份及 AI 配置分别存储（隐藏模式使用独立 KV 命名空间）。未激活浏览器请求不能通过 URL 查询参数读取隐藏文案。后台可选择正在管理的模式，编辑、预览和发布各自的文案。

激活码由后台批量生成，每批 1–100 个。使用 96 位随机值，D1 仅保存 SHA-256 哈希及状态；原码只在生成时返回，务必复制或下载。后台支持查看使用状态并作废未使用的码。D1 的条件 UPDATE ... RETURNING 原子核销，防止并发重复使用。专用 ACTIVATIONS D1 绑定见 backend/wrangler.jsonc，首次部署需执行 backend/schema.sql。激活状态保存在签名的 HttpOnly Secure Cookie，最长一年。此浏览器可以随时切回正常模式，再进入隐藏模式；清除 Cookie 后原激活码不可重复使用，需要新码。
