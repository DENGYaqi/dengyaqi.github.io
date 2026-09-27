# 受保护的项目展示

公开网站仍由 GitHub Pages 托管；本目录是单独的 Cloudflare Worker。项目正文保存在 D1，图片保存在私有 R2 桶。只有 Cloudflare Access 放行的邮箱能访问页面。管理员邮箱与 CSRF 密钥仅保存在 Worker Secrets，访客名单仅保存在 Access 策略中。

## 本地检查

需要 Node.js 20+ 与 Ruby（现有 Jekyll 项目已经使用 Ruby）：

```sh
npm ci
npm run check
```

`npm run check` 从 `../_data/experience.yml` 更新公开的工作经历标题、公司和简介，运行安全与发布规则测试，再检查 Worker 构建。项目数据不会从公开网站导入。

## 首次部署

1. 在 Cloudflare 开通 Workers、D1、R2 及 Zero Trust。Zero Trust 免费计划仍要求填写支付信息；R2 也需要完成订阅开通。先在控制台确认费用与限额。
2. 在本目录运行 `npx wrangler login`，再运行 `npx wrangler d1 create yaqi-projects` 和 `npx wrangler r2 bucket create yaqi-projects-media`。把 D1 返回的实际 `database_id` 写入 `wrangler.jsonc`；若资源改名，同步修改配置中的名称。R2 桶必须保持私有，不能启用 `r2.dev` 公共地址或公共自定义域名。
3. 运行 `npx wrangler d1 migrations apply yaqi-projects --remote`，创建项目与图片表。运行 `npm run deploy` 创建 Worker。此时 Worker 尚未有 Access 身份，请求会返回 403。
4. 在 Cloudflare 控制台给该 **Worker 整体**开启 Access，选择正式与预览流量均受保护；启用 Email one-time PIN，只允许管理员及指定访客的**完整邮箱地址**，并将应用会话时长设为 1 小时。不要使用 Everyone、任意邮箱验证码或宽泛邮箱域名规则。管理员邮箱也要列入允许名单。
5. 在 Workers 的 Variables and Secrets 中分别添加 `ADMIN_EMAIL`（管理员邮箱）和随机生成的 `CSRF_SECRET`（至少 32 字节）。二者均使用 Secret 类型，不能写入仓库或 Wrangler `vars`。部署后，只有与 `ADMIN_EMAIL` 相同的已登录邮箱能进入后台。
6. 验证正式 `workers.dev` 地址和预览地址均先经过 Access；未受邀邮箱被拒绝；受邀访客无法进入 `/zh/admin/`；直接打开 `/media/{id}` 也受登录和草稿状态限制。在后台创建并发布至少一个四语项目。
7. 上述验证通过后，把公开网站 `_config.yml` 的 `experience_app_url` 设置为 Worker 的 HTTPS 来源地址（末尾不带 `/`），再部署 GitHub Pages。工作经历卡片会自动指向对应的 `/{lang}/experiences/{key}/` 页面。

邀请与撤销访客在 Cloudflare Access 控制台处理。撤销时需要**先从允许邮箱中删除，再撤销该用户现有会话**；仅删除邮箱不会立刻终止已经签发的会话。修改项目及关联关系在本应用的 `/{lang}/admin/` 处理。六段公开工作经历来自现有 YAML，项目本身只存在于 D1/R2。

## 路径与规则

- `/{lang}/projects/`：全部已发布项目；`/{lang}/projects/{id}/`：详情。
- `/{lang}/experiences/`：工作经历；`/{lang}/experiences/{key}/`：该经历关联的已发布项目。
- `/{lang}/admin/`：草稿、发布、四语内容、排序、关联与图片管理。`lang` 为 `zh`、`en`、`ja`、`fr`。
- 草稿只对管理员可见，且四种语言的标题、摘要、详情及至少一段经历齐备后才能发布。
- 图片仅接受 8 MB 以内的 JPEG、PNG、WebP。图片由 Worker 验证身份和项目状态后从私有 R2 桶读取。

Worker 没有配置公开静态资源绑定，因此所有路由都能读取 Access 身份；包含 CSS 与图片的请求也先经过身份检查。所有响应均禁用缓存与搜索索引。新的项目正文和图片不要提交到公开 Git 仓库。
