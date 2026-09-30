# 受保护的项目展示

公开网站由 GitHub Pages 托管；本目录是独立的 Cloudflare Worker。项目正文和访客账号保存在 D1，图片保存在私有 R2 桶。访客使用分配给自己的邮箱和密码登录项目站，不需要 Cloudflare 账号。工作经历卡片只包含项目站链接，受保护内容不进入公开仓库。

## 本地预览

需要 Node.js 24+ 和 Ruby。Windows 用户名含非 ASCII 字符时，Ruby 可能无法读取路径；可先将仓库映射为只含英文的盘符，再从映射盘符运行以下命令。

```sh
npm ci
npx wrangler d1 migrations apply yaqi-projects --local
node scripts/bootstrap-admin.mjs admin@example.com --local
npm run check
npm run dev
```

首次管理员密码只在创建成功后显示一次。`npm run dev` 默认在 `http://127.0.0.1:8787/zh/login/` 提供本地登录页。本地 D1 和正式 D1 相互独立。

## 正式切换顺序

1. 在 Cloudflare 控制台确认现有 D1 `yaqi-projects` 和私有 R2 `yaqi-projects-media` 的绑定仍与 `wrangler.jsonc` 一致。R2 不启用公共 `r2.dev` 地址或公共自定义域名。
2. 登录 Wrangler，运行 `npx wrangler d1 migrations apply yaqi-projects --remote`。已有项目数据会保留，新迁移增加账号、会话、登录限速和申请记录表。
3. 运行 `node scripts/bootstrap-admin.mjs <管理员邮箱> --remote` 建立首个管理员。保存屏幕上只显示一次的密码，不要提交到仓库。
4. 运行 `npm run deploy`。此时先**保留 Worker 的 Cloudflare Access 整站保护**。登录 Access 后，检查 `/{lang}/login/`、申请页、未登录会话的项目与图片跳转、管理员申请列表与账号管理、访客账号登录、退出后返回公开网站，以及四种语言。登录页和本站会话工作正常后才关闭该 Worker 的 Access 整站保护。
5. 关闭 Access 后，用无痕窗口直接检查正式地址：项目、教育、图片和后台都必须先经过本站登录页；未获分配账号者不能访问；访客不能进入后台。若任一检查失败，重新开启 Access，修复后再测试。

密码哈希连续执行六段各 100,000 次的 PBKDF2，以适配 Workers 单次最多 100,000 次的限制，并维持总计 600,000 次计算。已在部署后的 Worker 上验证真实登录；若以后 CPU 用量超出套餐限制，应升级套餐，不能降低密码校验强度。

## 访客账号与内容

访客可在 `/{lang}/request-access/` 填写邮箱及申请理由。申请只进入 D1 待审核列表，不会自动开通账号或发信。管理员登录后在 `/{lang}/admin/requests/` 批准或拒绝申请；批准新访客会创建账号，批准已有访客会重置密码并撤销旧会话。系统生成的密码只在提交后的页面显示一次，由管理员自行发给对应邮箱。管理员也可在 `/{lang}/admin/accounts/` 创建、重置或停用账号。每位访客使用独立账号；停用或重置密码会撤销该账号已有会话。访客无注册或后台入口。本站会话最长 24 小时，退出时立即撤销。

项目草稿、发布、四语内容、排序、关联和图片在 `/{lang}/admin/` 管理。教育资料如需导入，请把私有 JSON 文件保存在公开仓库之外，再运行 `node scripts/import-private-content.mjs <私有文件路径> --local|--remote`。学校条目的 `key` 用于长期有效的定位链接；项目可同时设置 `education_keys` 和 `experience_keys`。项目正文、学术 PDF 和原始资料不得提交到公开 Git 仓库。PDF 存放于不开放公共域名的私有 R2 桶，`project_files` 表记录文件与项目的关系；导入文件前要检查其中的第三方联系方式。

## 路径

- `/{lang}/login/`：独立登录页；登录成功后仅返回本站内已验证的目标路径。
- `/{lang}/request-access/`：申请查看，保存邮箱、理由和原目标位置；申请本身不授权访问。
- `/{lang}/projects/`：工作及教育项目总览；`/{lang}/projects/work/{key}/` 和 `/{lang}/projects/education/{key}/`：总览中的对应位置。
- `/{lang}/experiences/`：工作经历；`/{lang}/experiences/{key}/`：该经历关联的已发布项目。
- `/files/{id}`：仅登录后下载已发布项目的学术 PDF；草稿文件仅管理员可读。
- `/{lang}/admin/`：内容管理；`/{lang}/admin/accounts/`：账号管理；`/{lang}/admin/requests/`：申请审核。
- `/{lang}/logout/`：撤销当前会话并返回公开网站同语言的“关于我”。

`lang` 为 `zh`、`en`、`ja` 或 `fr`。所有 HTML 和图片响应均禁用缓存和搜索索引。四语内容及至少一段工作或教育经历齐备后，项目才能发布。
