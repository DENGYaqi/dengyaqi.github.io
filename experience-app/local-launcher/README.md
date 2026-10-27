# 本机项目启动

管理员在项目 GIF 下点击“启动本机项目”，网站签发 60 秒有效的单次凭证，再通过 `yaqi-local` 协议唤起当前电脑的启动器。启动器检查签名和本机登记信息，必要时打开 Docker Desktop，按依赖顺序启动已有容器；服务就绪后打开本机项目。浏览器首次可能要求确认打开应用，不能自动跳过此确认。

这会启动**点击按钮的电脑**上的项目。访客不能借此控制站长电脑，站外在线体验仍由独立的 `LAUNCH_ENABLED` 开关控制。本模式不需要自有域名、路由器端口转发或公网 Docker API。

## 安装与配置

需要 Windows、Node.js 24+、已安装的 Docker Desktop，以及已创建的项目容器。源码目录中的 `install.ps1` 使用当前用户的 HKCU 协议登记，不需要管理员权限，不更改 PowerShell 执行策略。源码和配置移动后需要重新登记。卸载使用同目录 `uninstall.ps1`；只移除本工具拥有的协议项，不删除项目、数据或容器。

私有配置保存在公开仓库之外。字段如下：

| 字段 | 用途 |
| --- | --- |
| `version` | 固定为 `1` |
| `issuer` | 签发网站的完整 HTTPS origin |
| `public_key` | ECDSA P-256 公钥 JWK，仅含公钥，不能含 `d` |
| `docker_path` | 本机 Docker CLI 的绝对路径 |
| `context` | 固定的 Docker context 名称和本机 Windows named-pipe endpoint |
| `state_path` | 仓库外的 SQLite 绝对路径，用于凭证去重和启动记录 |
| `projects` | 以现有项目 UUID 为键的登记表 |

项目包含 `title`、`mode`。`mode: "docker"` 还需要 `open_url`、`health_urls`、`timeout_seconds`（5–180），以及按依赖顺序排列的 `containers`。每个容器记录完整 `id` 和 `fingerprint`（由 `config.mjs` 的同名函数根据 Docker inspect 结果生成），校验名称、镜像、Compose 归属、挂载和端口。容器重建后须人工重新核对、登记，不能按名称自动接纳替代容器。

`mode: "open"` 仅检查并打开已运行服务，不启动原生程序；`mode: "unavailable"` 显示 `reason` 中的四语原因，不操作 Docker。缺少配置、依赖硬件、仅有研究资料或被排除的项目应使用此状态。HTTP 地址只能是 loopback 且带明确端口，不允许任意网址、命令、Compose 文件或脚本从网页传入。

先对真实运行环境做只读检查，按项目登记必要服务，排除数据库迁移、初始化任务、爬虫和活动采集器。运行 `node local-launcher/validate.mjs <私有配置绝对路径>` 检查后，用 PowerShell 运行 `local-launcher/install.ps1 -ConfigPath <私有配置绝对路径>`。私有配置、签名私钥和 SQLite 文件应设置为仅当前用户及系统可读写。

## 网站与密钥

网站配置独立变量 `LOCAL_LAUNCH_ENABLED=true` 和 `LOCAL_LAUNCH_ISSUER=<网站 origin>`。使用 WebCrypto 生成 ECDSA P-256 密钥对，将**私钥 JWK JSON**作为 Wrangler secret `LOCAL_LAUNCH_PRIVATE_KEY` 上传；本机仅放对应公钥。不要把私钥、私有配置或本地地址提交到 Git。

- `POST /api/projects/{id}/local-launch`：管理员登录、同源 CSRF、已发布项目、每账号每分钟最多 10 次；返回单次 URI 和到期时间，禁止缓存。
- `GET /{lang}/local-launch/setup/`：管理员配置说明。
- `GET /local-launch.js`：无配置和凭据的前端交互脚本。

不新增云端表，不修改项目正文、媒体或关联。签发限速复用 `login_attempts`。本机 SQLite 独立记录票据、项目、状态、时间和本次启动的容器 ID，不保存票据原文。最多并发启动两个项目，同一项目不能并发启动；崩溃记录在十分钟后允许重试，凭据重放仍被拒绝。

撤销本机功能可关闭 `LOCAL_LAUNCH_ENABLED`；已签发票据最多再有效 60 秒。密钥轮换时先关闭功能，更新网站私钥和本机公钥，再开启。此模式不会停止已启动的业务服务，退出网站、关闭网页或卸载启动器也不会自动停止；需要时在 Docker Desktop 管理。

## 验证与故障

`node --test tests/local-launch.test.js` 覆盖鉴权、CSRF、篡改、超时、重放、并发、容器校验、启动顺序、重用运行中服务、失败不回滚、状态页访问限制及浏览器回退。`npm run check` 包括全部回归和两个 Worker 的部署预检查。

可显式运行 `node scripts/check-local-launch-docker.mjs <已存在的 PHP 镜像>` 做真实 Docker 测试。它创建一个带专有标记的临时容器，验证冷启动和重复打开，最后仅清理该测试容器；不拉取镜像、不构建，也不操作已有业务容器。

若浏览器未自动弹出，点击“继续打开启动器”；60 秒后重新点击主按钮获取新凭据。若本机显示容器不匹配，不要绕过检查，应先核对容器是否被重建。就绪检查失败时，已启动的服务保留运行，错误页会说明；本机 SQLite 的 `operations` 表记录失败原因。网页上没有通用命令输入框，临时状态页也只提供只读进度。
