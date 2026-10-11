# 锐锐独立站

浅粉色首页；点击聊天入口进入 `/chat` 全屏聊天。支持文字、图片选择与压缩、预览、放大、发送失败重试。`/admin` 使用密码登录和本站路径下的签名会话 Cookie。

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

`backend/` 是此站专用 Cloudflare Pages Functions。独立项目 `ruirui-whispers-20261010`，独立 BOARD KV、会话签名密钥与 Key 加密密钥。前端直接跨域请求该站自己的 Cloudflare 后端，CORS 仅允许 `https://chanray-may9.github.io`。未连接 Chanray 的数据存储或 AI 配置。

需要在后端设置 `ADMIN_PASSWORD`、`ADMIN_TOKEN`、`ADMIN_ENCRYPTION_KEY`。后台 API Key 以 AES-GCM 加密存入独立 KV，查询不会返回原 Key。源代码不包含实际密码或密钥。默认 API 为 `https://api.deepseek.com/chat/completions`，模型为 `deepseek-flash`，可在后台单独修改。真实 AI 需要用户配置有效 Key；不会自动调用付费模型。

图片发送使用 inline raster image 的 OpenAI-compatible 消息格式。图片在浏览器压缩至最长边 1440 像素，发送给此站服务端和配置的 AI 服务；不写入持久存储。图片理解需要所选服务和模型支持图片。历史请求仅携带文字和当前图片，聊天文字和图片保存在当前浏览器的 IndexedDB，支持多段聊天记录、刷新恢复和切换历史；正常与隐藏模式的记录分别保存。清空当前聊天会确认，并保留其他聊天。清除浏览器站点数据会删除本机记录，记录不会跨设备同步。未经支持的模型不会获得模拟图片回复。

后端允许 JPEG/PNG/WebP 的有界内联图片，拒绝远程 URL 和 SVG。Cookie 写操作检查 Origin。KV 没有原子并发保证，生产流量需配置平台限流。

## 发布与回退

前端为 React + Vite 静态站，发布地址：https://chanray-may9.github.io/chanray-sex/ 。推送 main 后 GitHub Actions 自动执行 npm ci、类型检查、测试、构建和 Pages 发布，产物为 dist/client。首页、chat、admin 均生成独立 index.html，可直接访问和刷新。后端继续使用独立 Cloudflare Pages Functions、BOARD KV 和 ACTIVATIONS D1，不依赖 OpenAI Sites。

GitHub Pages 不运行服务端代理，因此使用 CORS + 签名会话请求头，不依赖第三方 Cookie。后端只对允许的 GitHub Origin 将会话请求头转换为受签名校验的 Cookie；密码和真实 API Key 不写入前端。前端会话 Cookie 由 JavaScript 管理（不能标为 HttpOnly），使用 Secure、SameSite=Strict 和项目路径。管理员退出会在服务端撤销会话。旧域名的本机聊天记录和激活 Cookie 因浏览器域名隔离不会自动迁入新域名，后台数据保留原 KV/D1。

后端部署：将 backend/functions、src、public、site、wrangler.jsonc 复制到独立目录后运行固定版本 Wrangler：node ../ruirui/node_modules/wrangler/bin/wrangler.js pages deploy site --project-name ruirui-whispers-20261010 --branch main。每轮修改前保存 Git bundle。前端回退使用 Git revert 后推送，后端通过 Cloudflare Pages 选择已有部署；文案使用后台历史恢复。

## 隐藏模式与激活码

前端设置可输入一次性激活码。正常与隐藏模式共用相同页面结构和组件，文案、历史备份及 AI 配置分别存储（隐藏模式使用独立 KV 命名空间）。未激活浏览器请求不能通过 URL 查询参数读取隐藏文案。后台可选择正在管理的模式，编辑、预览和发布各自的文案。

激活码由后台批量生成，每批 1–100 个。使用 96 位随机值，D1 仅保存 SHA-256 哈希及状态；原码只在生成时返回，务必复制或下载。后台支持查看使用状态并作废未使用的码。D1 的条件 UPDATE ... RETURNING 原子核销，防止并发重复使用。专用 ACTIVATIONS D1 绑定见 backend/wrangler.jsonc，首次部署需执行 backend/schema.sql。GitHub Pages 激活状态保存在本站路径下的签名 Secure Cookie，最长一年。此浏览器可以随时切回正常模式，再进入隐藏模式；清除 Cookie 后原激活码不可重复使用，需要新码。
