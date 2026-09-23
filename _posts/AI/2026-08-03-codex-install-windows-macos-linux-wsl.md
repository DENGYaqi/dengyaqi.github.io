---
title: Codex 入门：Windows、macOS、Linux 和 WSL2 安装手册
date: 2026-08-03 10:00:00 +0800
categories: [AI, Guide]
tags: [ai-guide, codex, cli, install, windows, macos, linux, wsl]
description: 面向第一次使用 Codex 的开发者，按系统记录安装入口、复制命令、验证方式和常见问题。
pin: true
published: false
---

## 0. 这篇文章适合谁

这篇文章只解决一件事：**把 Codex 装起来，并确认可以启动。**

适合以下读者：

- 第一次听说 Codex。
- 不知道该装桌面端、CLI 还是 IDE 插件。
- 想在 Windows、macOS、Linux 或 WSL2 里照着步骤安装。
- 不想先研究一堆概念，只想先把工具跑起来。

不展开的内容：

- API key 如何申请和配置。
- CC-Switch 怎么用。
- Skills、插件和自动化工作流。
- Codex 具体怎么改代码。

这些后面单独写。

## 1. 先看你应该装哪一个

如果你不确定，先按下面这张表选。

| 你的情况 | 建议安装 | 说明 |
| --- | --- | --- |
| 你是 Windows 用户 | ChatGPT 桌面端 + Codex CLI | 最容易开始 |
| 你是 macOS 用户 | ChatGPT 桌面端 + Codex CLI | 日常体验比较完整 |
| 你在 Linux 服务器或本机开发 | Codex CLI | 终端里直接用 |
| 你主要用 WSL2 开发 | WSL2 里安装 Codex CLI | 项目在哪，Codex 就装在哪 |
| 你主要用 VS Code、Cursor、Windsurf | IDE 插件 | 编辑器里直接用 |

新手建议顺序：

1. 先装 ChatGPT 桌面端。
2. 再装 Codex CLI。
3. 最后再看 IDE 插件。

## 2. Windows 安装

### 2.1 安装 ChatGPT 桌面端

方式一：打开 Microsoft Store，搜索 `ChatGPT`，点击安装。

方式二：打开 PowerShell，执行：

```powershell
winget install --id 9nt1r1c2hh7j
```

安装完成后：

1. 打开 ChatGPT。
2. 登录你的 ChatGPT 账号。
3. 能正常进入 ChatGPT 页面，就说明桌面端安装完成。

说明：

- 桌面端适合处理文件、截图、项目说明和较长任务。
- 如果你只是想在命令行里操作代码，还需要继续安装 Codex CLI。

### 2.2 安装 Codex CLI

打开 PowerShell。

复制下面这条命令并回车：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

等待安装完成。

### 2.3 验证是否安装成功

继续在 PowerShell 执行：

```powershell
codex --version
```

如果能看到版本号，说明命令已经安装成功。

再执行：

```powershell
where.exe codex
```

如果能看到 `codex` 的安装路径，说明系统可以找到这个命令。

最后执行：

```powershell
codex
```

如果进入 Codex 登录或启动界面，就可以继续登录使用。

### 2.4 Windows 常见问题

**问题：执行完安装命令后，输入 `codex` 找不到。**

处理方式：

1. 关闭 PowerShell。
2. 重新打开 PowerShell。
3. 再执行 `codex --version`。

如果还是不行，再检查 `where.exe codex` 是否能找到路径。

**问题：公司电脑不允许执行脚本。**

处理方式：

1. 不要强行绕过公司安全策略。
2. 先找管理员确认是否允许安装开发工具。
3. 只使用 OpenAI 官方安装命令，不复制陌生脚本。

## 3. macOS 安装

### 3.1 安装 ChatGPT 桌面端

打开 ChatGPT 官网或应用商店入口，安装 ChatGPT 桌面端。

安装完成后：

1. 打开 ChatGPT。
2. 登录你的账号。
3. 能正常进入 ChatGPT 页面即可。

### 3.2 安装 Codex CLI

打开终端 Terminal。

复制下面这条命令并回车：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

等待安装完成。

### 3.3 验证是否安装成功

执行：

```shell
codex --version
```

如果能看到版本号，说明安装成功。

再执行：

```shell
which codex
```

如果能看到路径，说明系统可以找到 `codex`。

最后执行：

```shell
codex
```

如果进入 Codex 登录或启动界面，就可以继续使用。

### 3.4 Homebrew 安装方式

如果你平时习惯用 Homebrew，也可以执行：

```shell
brew install --cask codex
```

说明：

- 新手优先使用官方 `install.sh`。
- 已经熟悉 Homebrew 的用户可以用 `brew`。

## 4. Linux 安装

### 4.1 检查 curl

先执行：

```shell
curl --version
```

如果能看到版本号，继续下一步。

如果提示没有 `curl`，Ubuntu/Debian 可以先执行：

```shell
sudo apt update
sudo apt install -y curl
```

### 4.2 安装 Codex CLI

执行：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

等待安装完成。

### 4.3 验证是否安装成功

执行：

```shell
codex --version
```

再执行：

```shell
which codex
```

最后执行：

```shell
codex
```

能看到启动界面，就说明安装完成。

说明：

- Linux 主要使用 Codex CLI。
- 如果你是在服务器里安装，先确认这台机器是否允许联网和安装开发工具。

## 5. Windows + WSL2 安装

WSL2 要单独说，因为它容易让人装错地方。

### 5.1 先判断项目在哪里

按下面规则选：

| 项目位置 | 推荐安装位置 |
| --- | --- |
| 项目在 Windows 目录，例如 `D:\code` | Windows PowerShell 里安装 |
| 项目在 WSL2 Linux 目录，例如 `~/code` | WSL2 终端里安装 |
| 不确定项目在哪 | 先不要两边都装 |

原则：**项目、Git、Node、Python、测试命令在哪个环境里，Codex 就装在哪个环境里。**

### 5.2 在 WSL2 里安装

打开 WSL2，比如 Ubuntu。

执行：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

验证：

```shell
codex --version
which codex
codex
```

### 5.3 WSL2 注意事项

建议：

- Windows 项目用 Windows 版 Codex。
- Linux 项目用 WSL2 版 Codex。
- 不要一开始混用 Windows 路径和 WSL2 路径。

容易出问题的情况：

- 在 WSL2 里操作 `/mnt/c/...` 下的 Windows 项目。
- 依赖装在 Windows，命令却在 WSL2 里执行。
- Windows 和 WSL2 两边都装了 Codex，但自己不知道当前用的是哪一个。

## 6. npm 安装方式

如果你已经安装了 Node.js 和 npm，也可以用 npm：

```shell
npm install -g @openai/codex
```

验证：

```shell
codex --version
codex
```

说明：

- npm 方式适合已经熟悉 Node.js 的开发者。
- 新手优先使用前面的官方安装脚本。

## 7. 第一次启动

进入你的项目目录。

例如 Windows：

```powershell
cd D:\YaqiGitHub\blog
codex
```

例如 macOS/Linux/WSL2：

```shell
cd ~/code/my-project
codex
```

第一次启动时，优先选择：

```text
Sign in with ChatGPT
```

说明：

- 新手优先用 ChatGPT 账号登录。
- API key 方式后面再单独讲。
- 不要把 API key 写进代码。
- 不要把 API key 提交到 GitHub。

## 8. 安装成功检查表

安装后逐项检查：

| 检查项 | 命令或动作 | 成功表现 |
| --- | --- | --- |
| 查看版本 | `codex --version` | 显示版本号 |
| 查看路径 | `where.exe codex` 或 `which codex` | 显示安装路径 |
| 启动 Codex | `codex` | 进入登录或启动界面 |
| 进入项目 | `cd 项目目录` | 能进入你的代码目录 |
| 开始使用 | 在项目目录执行 `codex` | Codex 能读取当前目录 |

如果这 5 项都通过，安装阶段就结束了。

## 9. 不建议做的事

不要这样做：

- 不要复制陌生网站的一键安装脚本。
- 不要把 API key 发给别人。
- 不要把 API key 写进 GitHub。
- 不要 Windows 和 WSL2 混着操作同一个项目。
- 不要一开始就研究所有高级配置。

建议这样做：

- 只复制 OpenAI 官方文档或官方 GitHub 仓库里的命令。
- 先完成安装和启动。
- 后面再学习 API key、Skills、插件和自动化。

## 10. 参考资料

- [Codex CLI](https://developers.openai.com/codex/cli)
- [Codex Quickstart](https://developers.openai.com/codex/quickstart)
- [ChatGPT desktop app](https://developers.openai.com/codex/app)
- [Codex IDE extension](https://developers.openai.com/codex/ide)
- [ChatGPT desktop app for Windows](https://developers.openai.com/codex/windows/windows-app)
- [Codex permissions](https://developers.openai.com/codex/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [OpenAI Codex GitHub repo](https://github.com/openai/codex)

## English Summary

This guide is a step-by-step installation manual for Codex on Windows, macOS, Linux, and WSL2. It focuses on simple actions: choose the right installation location, copy the official command, verify `codex --version`, and start Codex in a project folder. Beginners should sign in with ChatGPT first and leave API key setup for a later step.
