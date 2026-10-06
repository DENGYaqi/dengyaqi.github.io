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

项目与教育经历不提供网页编辑后台。将包含学校、项目草稿或已发布项目的私有 JSON 保存在公开仓库之外，运行 `node scripts/import-private-content.mjs <私有文件路径> --local|--remote` 导入。已发布项目须有四语标题、摘要和正文；同时未关联工作与学校的已发布项目显示在“其他项目”，无需新增数据库字段。学校 `key` 用于长期有效的定位链接。工作经历页面的私有内容也通过同一命令导入：`work_experiences` 数组按公开经历的 `key` 对应，每项含四语 `description` 和按显示顺序排列的 `projects`；每个项目有四语 `title`，已有详情时可填 `project_id`。教育时间线由 `education_experiences` 数组导入，每项按学校 `key` 对应，`details` 在四语下分别含 `degree`、`study_mode`、`major`，`projects` 按展示顺序列四语 `title` 和可选 `project_id`；无项目时填空数组。只有该 ID 对应的项目已发布且关联同一经历或学校，标题才会变成详情链接，否则只显示“待完善”。“其他项目”只展示站内介绍，不提供源码链接、下载或在线演示；不要将本机或局域网 IP 写入线上页面。项目图片与学术 PDF 保存在不开放公共域名的私有 R2 桶，并分别由 D1 的 `media`、`project_files` 表记录关联。项目正文、学术 PDF 和原始资料不得提交到公开 Git 仓库；导入文件前要检查其中的第三方联系方式。公开博客的教育卡片与登录后 D1 内容分别维护。

## 路径

- `/{lang}/login/`：独立登录页；登录成功后仅返回本站内已验证的目标路径。
- `/{lang}/request-access/`：申请查看，保存邮箱、理由和原目标位置；申请本身不授权访问。
- `/{lang}/projects/`：其他项目列表；`/{lang}/projects/{id}/`：受保护的项目详情；`/{lang}/projects/education/`：完整教育时间线；`/{lang}/projects/education/{key}/`：单所学校及对应项目。
- `/{lang}/experiences/`：完整工作经历时间线；`/{lang}/experiences/{key}/` 与 `/{lang}/projects/work/{key}/`：单段经历及对应的项目名单。
- `/files/{id}`：仅登录后下载已发布项目的学术 PDF；草稿文件仅管理员可读。
- `/{lang}/admin/accounts/`：访客账号管理；`/{lang}/admin/requests/`：申请审核。原内容管理地址已关闭。
- `/{lang}/logout/`：撤销当前会话并返回公开网站同语言的“关于我”。

`lang` 为 `zh`、`en`、`ja` 或 `fr`。所有 HTML 和图片响应均禁用缓存和搜索索引。四语内容齐备后，项目才能发布。
