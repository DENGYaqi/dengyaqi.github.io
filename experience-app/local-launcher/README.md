# 本机项目启动

管理员在项目 GIF 下点击“启动本机项目”，网站签发 60 秒有效的单次凭证，然后显示醒目的“打开本机启动器”链接。必须由用户直接点击该链接，通过 `yaqi-local` 协议唤起当前电脑的启动器；不在异步请求后模拟点击或声称已经打开程序。启动器检查签名和本机登记信息，必要时打开 Docker Desktop，按依赖顺序启动已有容器；服务就绪后打开本机项目。浏览器首次可能要求确认打开应用，不能自动跳过此确认。

这会启动**点击按钮的电脑**上的项目。访客不能借此控制站长电脑，站外在线体验仍由独立的 `LAUNCH_ENABLED` 开关控制。本模式不需要自有域名、路由器端口转发或公网 Docker API。

## 安装与配置

需要 Windows、Node.js 24+；Docker 项目还需要 Docker Desktop 及已创建的项目容器。桌面、样例和 Android 项目分别使用本机已有的程序、运行环境和模拟器。源码目录中的 `install.ps1` 使用当前用户的 HKCU 协议登记，不需要管理员权限，不更改 PowerShell 执行策略。源码和配置移动后需要重新登记；只更新登记内容无需重复安装。卸载使用同目录 `uninstall.ps1`；只移除本工具拥有的协议项，不删除项目、数据或容器。

安装完成前会发送 Windows 协议关联刷新通知，通过系统关联 API 核对启动命令，并由 Windows 注册表服务独立核对同一用户的实际注册记录；校验失败不会报告安装成功。某些隔离执行环境内的注册表读写仅对该环境可见，进程内自查通过也不代表桌面 Chrome 能看到注册。若安装提示 `registration is not visible`，请从 Windows 桌面打开 PowerShell，在运行 Chrome 的同一账户下执行安装命令，无需管理员权限，也不要更改执行策略或浏览器安全设置。

若 Chrome 控制台提示 `scheme does not have a registered handler`，说明浏览器尚未找到协议处理程序，并非 Docker 启动失败。完成安装后重新生成链接验证；系统查询成功仍不能代替浏览器实际点击验收。

Windows 交接链接时可能将 `yaqi-local://launch?ticket=…` 规范化为 `yaqi-local://launch/?ticket=…`。PowerShell 入口与 Node 解析器均接受这两种形式，其他路径、额外参数和片段仍被拒绝；凭证内容及其签名不变。

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

新增项目类型沿用同一签名、单次凭证和本机白名单：

| 类型 | 登记内容与行为 |
| --- | --- |
| `native` | `programs` 包含 1–3 个固定程序，依次执行；可登记已有 Docker 依赖。有 `open_url` 时等待 `health_urls`，否则打开桌面程序。 |
| `sample` | 一个固定程序，在时限内执行离线样例，状态页用纯文本显示最多 16000 字符的结果。 |
| `android` | 固定 `adb`、`apk` 及其 SHA-256、模拟器 `serial`/`avd`、包名、完整 activity、`version_code` 和 `emulator` 程序；核验安装包指纹后打开应用。 |

每个程序登记绝对路径 `executable`、`sha256`、`cwd`、固定字符串数组 `args`、`files: [{path,sha256}]`；可选的 `env_file` 是仓库外的环境变量 JSON，必须同时列入 `files`。运行前核验所有程序和文件，执行时不使用 shell、不接收网页命令。程序、脚本、JAR、环境配置等变更后需要重新审核指纹。使用 Java/Python 的项目也应登记实际加载的成品与依赖文件。

本机 SQLite 用进程 ID、创建时间、程序路径及配置指纹识别已启动的程序，防止重复点击启动副本及进程 ID 复用误判。Windows 查询显式采用 UTF-8，保留中文路径。原生进程日志保存在私有状态目录的 `process-logs` 中，可能包含项目内部信息，不提交到 Git，不在网站展示。桌面进程存在不等于完整业务可用，仍需检查实际界面。

网页型原生项目在 HTTP 健康检查通过后，还会逐个复核本次启动或复用进程的 PID、创建时间和程序路径；进程退出、身份变化或查询失败时，不报告就绪，也不向进度页返回跳转地址。该复核只确认启动结束时的状态，不是持续运行监控或完整业务验收。

原生进程创建后，即使 PID 保存失败，也会把已经启动的事实上报给进度页。若后续失败记录也无法写入数据库，仍使用内存中的启动信息显示失败及部分启动提示，不返回就绪或跳转地址；此时数据库记录可能不完整，应核验实际进程后处理，原有待确认记录不会因此清除。

原生程序在创建前先登记待确认记录，取得 PID 后立即保存；身份查询最多尝试 3 次（首次查询及两次重试）。查询错误或信息不完整不代表进程已退出。确认失败后保留待确认记录，后续点击不会重复启动仍存活但身份未确认的 PID；确认该 PID 已不存在后才允许重新启动。若启动器在保存 PID 前中断，记录中的 PID 为 `0`，会持续阻止重试，需要维护者核对原程序及启动记录后，仅清理该程序对应的 `native_instances` 记录；不要删除整个状态数据库，否则会丢失凭证防重放记录。以上复用现有表结构，无需迁移或重新安装协议。

Android 仅启动登记的现有 AVD（固定端口及 `-no-snapshot-save`），并核验设备上的包名、版本及 APK SHA-256。多个 Android 项目共用模拟器锁；不会安装/升级 APK、清除数据、自动授予权限或接受协议。设备、登录、相机/蓝牙等条件不足时应在四语说明中注明。模拟器内部安装包发生变更也必须重新登记。

模拟器锁每次获取或过期接管都生成独立持有者标识，释放时同时匹配模拟器和持有者，旧任务不能删除新任务的锁。有效期仍为 240 秒。本机旧版 `runtime_locks` 表会在事务内自动补充 `owner` 字段，未过期的旧锁和其他记录保留；升级前先让旧版启动任务结束，避免旧版进程仍按旧规则释放锁。无需重新安装协议或迁移云端数据库。

先对真实运行环境做只读检查，按项目登记必要服务，排除数据库迁移、初始化任务、爬虫和活动采集器。运行 `node local-launcher/validate.mjs <私有配置绝对路径>` 检查后，用 PowerShell 运行 `local-launcher/install.ps1 -ConfigPath <私有配置绝对路径>`。私有配置、签名私钥和 SQLite 文件应设置为仅当前用户及系统可读写。

## 网站与密钥

网站配置独立变量 `LOCAL_LAUNCH_ENABLED=true` 和 `LOCAL_LAUNCH_ISSUER=<网站 origin>`。使用 WebCrypto 生成 ECDSA P-256 密钥对，将**私钥 JWK JSON**作为 Wrangler secret `LOCAL_LAUNCH_PRIVATE_KEY` 上传；本机仅放对应公钥。不要把私钥、私有配置或本地地址提交到 Git。

将已核验的项目 UUID 数组作为 `LOCAL_LAUNCH_PROJECT_IDS` 配置上传（可用 Wrangler secret），不上传路径、端口或容器 ID。可在私有项目登记中增加 `display: {kind,note}`，其中 `kind` 为 `web`、`desktop`、`android`、`sample`、`document` 或 `unavailable`，`note` 必须包含 `zh/en/ja/fr`。文档型另需已存在的 `file_id`，继续使用原有鉴权下载接口，不签发启动凭证。被排除的项目不添加 `display`。

运行 `node local-launcher/catalog.mjs <私有配置路径> <云端设置输出路径>`，生成只包含项目 ID、类型、四语说明和文档 ID 的 `LOCAL_LAUNCH_PROJECT_IDS` 与 `LOCAL_LAUNCH_CATALOG`。先核验本机候选配置，再替换本机配置和发布云端设置。未登记项目不显示按钮，签发接口也拒绝请求；启用 catalog 后，缺项或格式错误也拒绝签发。本机配置仍是最终执行白名单，云端列表不能自行增加本机执行权限。调整登记项目时同步维护两侧。

导出工具会按 UTF-8 字节长度将较大的目录拆成 `LOCAL_LAUNCH_CATALOG_1` 等配置项，主项只保存分片数量。每项不超过 4500 字节，适配 Cloudflare 单变量 5 KB 的限制；上传整个输出文件，不能遗漏分片。缺片、重复项目或格式错误时拒绝签发，不使用不完整目录。

- `POST /api/projects/{id}/local-launch`：管理员登录、同源 CSRF、已发布项目、每账号每分钟最多 10 次；返回单次 URI 和到期时间，禁止缓存。
- `GET /{lang}/local-launch/setup/`：管理员配置说明。
- `GET /local-launch.js`：无配置和凭据的前端交互脚本。

不新增云端表，不修改项目正文、媒体或关联。签发限速复用 `login_attempts`。本机 SQLite 独立记录票据、项目、状态、时间和本次启动的容器 ID、原生进程标识（`native:<PID>`），不保存票据原文。原生进程创建后即上报，身份确认失败仍保留记录；复用已有进程不算本次新启动。部分失败时提示程序或服务可能仍在运行，不把启动记录当成实时存活状态，也不自动结束它们。最多并发启动两个项目，同一项目不能并发启动；崩溃记录在十分钟后允许重试，凭据重放仍被拒绝。

撤销本机功能可关闭 `LOCAL_LAUNCH_ENABLED`；已签发票据最多再有效 60 秒。密钥轮换时先关闭功能，更新网站私钥和本机公钥，再开启。此模式不会停止已启动的业务服务，退出网站、关闭网页或卸载启动器也不会自动停止；需要时在 Docker Desktop 管理。

## 验证与故障

`node --test tests/local-launch.test.js tests/local-native.test.js` 覆盖鉴权、CSRF、篡改、超时、重放、并发、容器校验、启动顺序、进程复用、中文路径、文件指纹、Android 身份和锁、离线输出、公开目录导出、失败不回滚、状态页访问限制及浏览器回退。`npm run check` 包括全部回归和两个 Worker 的部署预检查。自动化测试不代替真实浏览器的打开应用确认，也不代替各项目业务验收。

可显式运行 `node scripts/check-local-launch-docker.mjs <已存在的 PHP 镜像>` 做真实 Docker 测试。它创建一个带专有标记的临时容器，验证冷启动和重复打开，最后仅清理该测试容器；不拉取镜像、不构建，也不操作已有业务容器。

准备成功后点击“打开本机启动器”；60 秒后重新点击主按钮获取新凭据。Windows 协议入口在私有配置目录的 `last-protocol-activation.json` 记录最近一次到达和 Node 启动阶段，不记录 URI、票据或凭据；若没有新记录，不能宣称启动器收到了请求。若本机显示容器不匹配，不要绕过检查，应先核对容器是否被重建。就绪检查失败时，已启动的服务保留运行，错误页会说明；本机 SQLite 的 `operations` 表记录失败原因。网页上没有通用命令输入框，临时状态页也只提供只读进度。
