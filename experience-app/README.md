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

项目详情可按模块展示 GIF。每种语言的 `translations.modules` 使用同顺序的 `[{"title":"模块名称","media_id":"GIF UUID","poster_id":"封面 UUID","caption":"操作步骤及演示边界"}]`；四语使用相同的 GIF 和封面 ID。`poster_id`、`caption` 可选，旧模块仍兼容。带封面的模块默认只加载静态图，点击播放后加载 GIF；停止、关闭放大视图或切到后台时恢复封面。一次只播放一段，放大视图支持适应窗口、原尺寸和 Escape 关闭。项目从工作或学校页面打开时，详情顶部和底部保留对应来源的返回链接。

同一私有清单添加 `media: [{"id":"媒体 UUID","project_id":"项目 UUID","file":"绝对路径","sort_order":0}]`。GIF 和封面使用独立的新 ID，封面支持 PNG、JPEG、WebP。GIF 限 24 MiB、2–600 帧，封面限 4 MiB、单帧；尺寸不超过 2560×1600。脚本检查实际格式并完整解码，拒绝截断文件、重复 ID、跨项目引用和四语模块不一致。

采集前核对源码版本、真实入口、完整操作和结果，使用演示数据；不要录入客户信息、凭据或桌面通知。保留应用导航和结果区，长流程分段。缺少企业接口、设备或授权时，在四语介绍中说明已验证范围和具体阻碍；模拟数据、离线兜底及历史安装包必须标明。原录屏、私有清单、备份和项目正文均留在公开仓库外。

替换顺序：

1. 导出旧项目、关联与媒体记录，下载旧对象并记录 SHA-256。在清单的 `preserve_project_ids` 中列出本次不处理的项目 ID。
2. 准备四语内容、GIF、封面。运行 `node scripts/upload-private-gifs.mjs <私有清单>` 仅校验。需要撤下的旧展示资源填入 `retire_media`，每项含 `id`、`project_id`、`object_key`、`backup_file`、`sha256`；只能指定同一清单中重整项目的旧媒体。
3. 加 `--local` 进行本地演练。脚本先上传全部新对象，下载校验与本地文件一致后，才导入内容和媒体记录，并移除指定的旧媒体记录。旧 R2 对象此时仍保留。不能先导入带新媒体引用的内容。
4. 本地验收后使用 `--remote`，检查四语项目链接、静态封面、播放/停止、放大、移动端、未登录访问和保留项目。重复使用已有媒体 ID 会拒绝，避免静默覆盖；失败时先核对 D1 当前状态，保留旧对象及备份，不直接重新生成清理清单。
5. 页面验收完成后，运行 `node scripts/retire-private-media.mjs <私有清单> --local|--remote`。它再次检查当前数据库没有旧媒体记录或引用，且远程对象与备份一致。确认输出范围后加 `--delete-verified`，仅删除清单中的精确对象，不遍历或清空桶。

D1 与 R2 不能跨服务原子更新。上传或导入失败时不要清理旧对象；若导入失败，应从备份和当前数据库确定是否需要恢复内容。恢复已清理的媒体时，先将备份按原 `object_key` 上传，再恢复相应媒体记录及旧内容。任何恢复操作都必须排除无关项目，且先备份当前状态。`project_files` 中的学术资料不属于 GIF 清理范围。

项目术语词典由 D1 的 `glossary_terms` 和 `project_glossary_terms` 维护。先应用迁移，再将仓库外的私有 JSON 传给 `node scripts/import-private-glossary.mjs <私有文件路径> --local|--remote`。文件包含 `terms` 数组（每项有稳定 `key` 和 `translations`，其中 `zh`、`en`、`ja`、`fr` 各含非空 `text` 与 `definition`）及 `projects` 数组（每项有项目 `id` 和术语 `key` 的 `terms` 数组）。每个项目详情只请求一次受保护的 `/{lang}/projects/{id}/glossary/`；响应不缓存。同一词条可关联多个项目，词条和解释只存一份。导入时只更新文件列出的项目关联；需要清空某项目词条时，为该项目提供空 `terms` 数组。术语正文不进入公开仓库。

## 路径

- `/{lang}/login/`：独立登录页；登录成功后仅返回本站内已验证的目标路径。
- `/{lang}/request-access/`：申请查看，保存邮箱、理由和原目标位置；申请本身不授权访问。
- `/{lang}/projects/`：其他项目列表；`/{lang}/projects/{id}/`：受保护的项目详情；`/{lang}/projects/education/`：完整教育时间线；`/{lang}/projects/education/{key}/`：单所学校及对应项目。
- `/{lang}/projects/{id}/glossary/`：登录后一次读取该项目当前语言的术语；草稿仅管理员可读。
- `/{lang}/experiences/`：完整工作经历时间线；`/{lang}/experiences/{key}/` 与 `/{lang}/projects/work/{key}/`：单段经历及对应的项目名单。
- `/files/{id}`：仅登录后下载已发布项目的学术 PDF；草稿文件仅管理员可读。
- `/{lang}/admin/accounts/`：访客账号管理；`/{lang}/admin/requests/`：申请审核。原内容管理地址已关闭。
- `/{lang}/logout/`：撤销当前会话并返回公开网站同语言的“关于我”。

`lang` 为 `zh`、`en`、`ja` 或 `fr`。所有 HTML 和图片响应均禁用缓存和搜索索引。四语内容齐备后，项目才能发布。
