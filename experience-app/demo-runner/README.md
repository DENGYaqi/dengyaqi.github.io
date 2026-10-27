# 受限的本地演示启动器

启动器只接受网站分配的项目键和短期任务凭证。Docker 命令、容器 ID、健康检查地址均从本地私有配置读取；访客不能指定命令、镜像、目录或端口。控制器通过 HTTPS 主动轮询，电脑无需开放控制端口。

当前交付为默认关闭的基础功能。外网开放前，需要完成正式域名、Cloudflare Tunnel/Access、独立演示环境和每个应用的验收；现有开发容器不能直接纳入启动器。云端网关与博客使用不同域名，每个项目独立域名。

## 配置与部署

1. 应用 `migrations/0009_project_runtimes.sql`。保持网站 `LAUNCH_ENABLED=false`、网关 `DEMO_ENABLED=false`。
2. 在独立虚拟机或专用 Docker 主机中，人工准备演示容器和合成数据。不得挂载源码目录、个人文件、Docker socket、生产数据或正式 API 密钥。配置演示角色，禁用发信、支付、外部模型计费和生产回调；限制出站网络。安装服务监护，使启动器异常退出后自动重启并恢复清理。Docker 容器使用 `restart=no`，电脑休眠期间无法提供演示。
3. 每个容器需要以下标签：`io.yaqi.demo=1`、`io.yaqi.runtime=<项目键>`、`io.yaqi.agent=<启动器ID>`。设置正数内存、CPU、PID 上限，禁止特权、额外能力、设备、主机网络/进程命名空间、bind mount 和共享容器。只允许回环地址发布端口。命名卷必须以 `yaqi-demo-` 开头，且具有相同的三项标签。容器 ID 用完整 64 位值登记，不接受名称。
4. 私有配置存放在仓库外的 `D:\project-demos\runtime-config\`（或演示主机的受限目录），限制为运行服务的账号可读。不要提交这些文件或运行日志。
5. 配置网关 `demo-gateway/wrangler.jsonc`：每个项目一份 Worker 配置、独立 `GATEWAY_ORIGIN` 和 `PROJECT_ID`，共用当前 D1。`PORTAL_ORIGIN` 为项目网站；`UPSTREAM_ORIGIN` 为正式 Tunnel 的固定入口。通过 Wrangler secret 设置 `ACCESS_CLIENT_ID`、`ACCESS_CLIENT_SECRET`、`PROXY_SECRET`，不写入配置文件。
6. Tunnel 指向本机只监听回环地址的 `proxy.mjs`。在 Cloudflare Access 中设置 Service Auth，只有网关服务令牌能访问；同时在 cloudflared 配置 Access JWT 校验的 teamName/audTag/required，验证原始 Tunnel 地址拒绝匿名请求。不要使用临时 Quick Tunnel 作为正式入口，不向 Tunnel 发布 Docker API。
7. 用 `node scripts/import-private-runtimes.mjs <私有清单>` 校验，随后加 `--local` 或 `--remote` 导入。先导入 disabled 项目，逐个验证后再启用。该脚本只更新列出的项目，不删除其他记录；有活动会话时不能切换项目目标。实际启用还要求网站开关、项目开关、启动器开关全部打开。
8. 管理员在 `/{lang}/admin/runtime-grants/` 按访客和项目授权（1–30 天）。登录本身不授予启动权，管理员试用也必须显式授权。

### 私有配置格式

导入清单的 `agents` 每项包含 `id`、32 字节随机值的 base64url `token`（43 字符）及布尔 `enabled`。`projects` 每项包含 `project_id`、`runtime_key`、`agent_id`、`gateway_origin`、`enabled`、`duration_seconds`（60–1800）。未准备好的项目使用空域名及 `enabled:false`。D1 只保存 token 的 SHA-256 摘要。

启动器文件包含 `portal_origin`、`agent_id`、同一 `token`、`profiles`。`profiles` 以 `runtime_key` 为键，每项包含有序 `containers` 数组（先依赖后应用）和回环 HTTP `health_url`。整个项目必须事先停止，已被手动启动的容器会被拒绝接管。停止按相反顺序执行。

代理文件包含 `port`（1024–65535）、与网关相同的 `secret`、`routes`。每项路由以项目键索引，包含回环 HTTP `target` 和该项目的 `public_origin`。默认仅允许 GET/HEAD/OPTIONS；登录等必要写请求必须逐条填写 `write_routes: [{"method":"POST","path":"/确切路径"}]`。禁止直接开放通配写入口。GET 接口仍需应用自身正确授权，代理不能修复应用的业务权限。

```text
node demo-runner/runner.mjs <私有启动器文件> <私有日志文件>
node demo-runner/proxy.mjs <私有代理文件>
```

代理独立运行，不需要 Docker 权限；云端 Worker 持有代理签名密钥，不持有 Docker 权限。建议将两者作为不同系统账号的服务运行。不得在浏览器、URL 或仓库中放启动器 token、代理密钥或 Access 服务密钥。

## 应用适配

- 前端 API/资源路径使用同源相对路径；WebSocket、SSE、登录跳转配置为各自公开演示域名。固定 localhost URL 必须通过单独演示构建/环境覆盖，不能直接转发给访客。
- 第一期只开放经验证的演示权限和数据。持久卷会保留数据，因此必须使用只读业务角色或独立的、经过验证的会话数据重置方案。没有完成数据隔离验收的项目保持关闭。
- DAnIEL 现有配置挂载源码目录，禾彩包含多个后端依赖，均需要独立演示部署；不能为了通过检查去给原开发容器补标签后直接开放。
- Android、桌面、硬件、历史报告及没有测试环境的项目仍展示 GIF/介绍；本功能不把它们自动转换为网页应用。Yseop、MeSH 内容和媒体不在本次改动范围。

## 运行与故障处理

全局最多两个项目运行，每个项目同时一个会话，单账号每小时最多六次新启动。重复点击复用同一会话。运行时限不超过 30 分钟；排队两分钟未领取即失败。启动器每两秒轮询，运行租约最多 30 秒；网站断线后本地清理到期任务。Docker 停止和正在进行的命令可能额外占用数秒。

网关每个请求校验原网站会话、账号、项目授权、运行状态与租约。退出/撤权后的新请求立即拒绝，正在传输的流和 WebSocket 最迟在下一次十秒检查关闭。启动器下一轮轮询收到停止信号；已停止但上报失败的任务保留在私有日志中重试。恢复进程时先停止日志中拥有的容器，不自动恢复浏览会话。

若启动器进程被强制杀死，必须依靠服务监护重启后清理；若整个主机冻结，无法保证容器按时停止，因此网关仍独立到期拒绝访问。不要宣称仅靠进程内计时器可以应对所有主机故障。

紧急关闭时同时设置网关 `DEMO_ENABLED=false`、网站 `LAUNCH_ENABLED=false`，保留启动器运行至完成停止；确认停止后再禁用启动器账号。不要提前删除 D1 运行记录或私有日志，否则会丢失清理依据。不会执行 `down`、删除卷、`prune`、拉取镜像或构建镜像。

## 验证

`npm run check` 覆盖网站、调度、鉴权、网关、代理和启动器单元/集成测试，并构建门户 Worker。`npm run check:gateway` 独立检查网关构建。真实 Docker 检查显式运行 `node scripts/check-runtime-docker.mjs <本地已有PHP镜像>`，只创建并清理有随机专用标签的新测试容器；不安装依赖、不拉取镜像、不操作现有项目。

正式验收还需实际域名上的登录跳转、应用内部登录、API/静态文件、WebSocket/SSE、原始 Tunnel 拒绝访问、移动端、撤权/退出、断网、服务重启以及演示数据隔离检查。全部通过后才能把对应项目标为开放。
