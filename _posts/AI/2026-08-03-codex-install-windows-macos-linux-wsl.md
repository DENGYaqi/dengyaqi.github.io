---
title: Codex 入门：如何在 Windows、macOS、Linux 和 WSL2 安装 Codex
date: 2026-08-03 10:00:00 +0800
categories: [AI, Guide]
tags: [ai-guide, codex, cli, install, windows, macos, linux, wsl]
description: 记录 Codex CLI、ChatGPT 桌面端和 IDE 插件在不同系统里的安装方式、验证命令和常见问题。
pin: true
---

## Codex 是什么，应该装哪一个

Codex 是 OpenAI 面向软件开发的编码智能体。它不是一个单独的“聊天窗口”，而是一组可以进入不同工作场景的入口：有适合本地终端的 CLI，有适合编辑器的 IDE 插件，也有适合长任务、文件和可视化协作的 ChatGPT 桌面端。

我建议刚开始不要纠结“哪个最强”，先按自己的工作位置选择：

| 入口 | 适合谁 | 我会怎么选 |
| --- | --- | --- |
| ChatGPT 桌面端 | 想在一个应用里处理项目、文件、截图、长任务 | Windows/macOS 用户优先装 |
| Codex CLI | 经常在终端里改代码、跑命令、看 git diff | 后端、运维、全栈开发者必装 |
| IDE 插件 | 主要在 VS Code、Cursor、Windsurf 里写代码 | 日常编码时补上 |
| Codex Web/Cloud | 想把任务交给云端异步跑 | 入门后再看 |

这篇只解决一件事：先把 Codex 在你的电脑里装起来，并能正常启动。API key、CC-Switch、Skills 和更复杂的自动化配置，后面单独写。

## 先选入口：桌面端、CLI、IDE 插件、Cloud

如果你是 Windows 或 macOS 用户，最省心的路线是：

1. 先安装 ChatGPT 桌面端，用它做文件、项目、长上下文任务。
2. 再安装 Codex CLI，用终端进入具体代码仓库。
3. 最后按需要安装 IDE 插件，让 Codex 贴近编辑器工作流。

如果你平时在 Linux 或 WSL2 里开发，优先装 CLI。因为你的代码、依赖、测试命令和 git 环境都在 Linux 里，让 Codex 也在同一个环境里工作，摩擦会更小。

## Windows 安装

Windows 上有两条路线：桌面端和 CLI。新手建议两个都装。

### 安装 ChatGPT 桌面端

如果你习惯用图形界面，可以从 Microsoft Store 安装 ChatGPT 桌面端。也可以用 `winget`：

```powershell
winget install --id 9nt1r1c2hh7j
```

安装后打开 ChatGPT，登录你的账号。如果你在 Windows 上用 Codex 处理本地项目，建议同时准备好 Git、Node.js、Python 这些基础工具，因为很多真实项目会需要它们。

### 安装 Codex CLI

打开 PowerShell，执行官方安装命令：

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
```

安装完成后验证：

```powershell
codex --version
where.exe codex
codex
```

如果 `codex` 命令找不到，先重开一个 PowerShell；如果还是不行，再检查安装目录是否已经加入 `PATH`。

## macOS 安装

macOS 也建议桌面端 + CLI 一起装。

桌面端可以从 ChatGPT 官网或应用商店入口安装。CLI 推荐使用官方 standalone installer：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

安装完成后验证：

```shell
codex --version
which codex
codex
```

如果你已经习惯 Homebrew，也可以用 Homebrew 安装：

```shell
brew install --cask codex
```

我更建议新手优先看官方 CLI 文档里的 standalone installer，因为它是 OpenAI 文档中最直接的路径。

## Linux 安装

Linux 下主要使用 Codex CLI：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

验证方式：

```shell
codex --version
which codex
codex
```

如果你的机器没有 `curl`，先用系统包管理器安装：

```shell
sudo apt update
sudo apt install -y curl
```

不同发行版的包管理命令不一样，但思路一致：先保证 `curl` 和基础开发工具可用，再安装 Codex。

## Windows + WSL2 安装

WSL2 容易让人混乱，因为它看起来在 Windows 里，实际运行的是 Linux 环境。

我的判断是：

- 如果你的项目、git、Node、Python、Docker 都在 Windows 里，就安装 Windows 版 Codex CLI。
- 如果你的项目和命令主要在 WSL2 里，就进入 WSL2 后安装 Linux 版 Codex CLI。
- 不建议一开始两边都装，然后混着用同一个项目，路径和权限会让新手很难判断问题在哪里。

在 WSL2 里安装时，打开 Ubuntu 或其他 Linux 发行版终端：

```shell
curl -fsSL https://chatgpt.com/codex/install.sh | sh
```

验证：

```shell
codex --version
which codex
codex
```

如果你的代码在 Windows 的 `C:\Users\...` 下，但你从 WSL2 里访问 `/mnt/c/...`，要注意文件权限、换行符和依赖安装位置。更稳的做法是：Windows 项目用 Windows Codex，Linux 项目用 WSL2 Codex。

## npm 和手动下载

除了 standalone installer，Codex CLI 也可以通过 npm 安装：

```shell
npm install -g @openai/codex
```

如果你使用 npm 方案，需要先保证 Node.js 和 npm 已经安装好。

也可以去 OpenAI Codex GitHub Releases 下载对应平台的二进制文件。这个方式更适合已经熟悉命令行、PATH 和可执行文件权限的人，不建议作为第一选择。

## 安装后怎么验证

装完以后，不要急着让它改项目。先做三步验证：

1. 看版本：

   ```shell
   codex --version
   ```

2. 找命令路径：

   ```powershell
   where.exe codex
   ```

   ```shell
   which codex
   ```

3. 启动：

   ```shell
   codex
   ```

能正常进入 Codex 界面，说明安装这一步基本完成。接下来再进入一个真实项目目录，让它读取代码、解释结构、查看 git diff，会更接近实际使用。

## 第一次登录：ChatGPT 账号 vs API key

第一次运行 `codex` 时，可以优先选择用 ChatGPT 账号登录。对大多数刚入门的人来说，这条路最简单，也最不容易把 key 配错。

API key 也可以使用，但它更适合你已经理解模型调用、计费、环境变量和本机密钥管理之后再配置。不要把 API key 写进代码，不要提交到 GitHub，也不要截图发给别人。

如果后面需要配置环境变量，可以单独开一篇文章讲。这里先记住一个原则：密钥是账号权限，不是普通配置项。

## 常见问题

### PowerShell 提示无法运行脚本

优先确认你复制的是 OpenAI 官方安装命令。官方命令里已经带了本次执行需要的 `ExecutionPolicy ByPass`。如果公司电脑有额外安全策略，不要强行绕过，先确认权限要求。

### 安装后找不到 codex

先关闭终端再重新打开。仍然找不到时，检查：

- 安装是否真的完成。
- `PATH` 是否包含 Codex 安装目录。
- Windows 和 WSL2 是否装在了不同环境里。

### Windows 和 WSL2 应该装哪边

看项目在哪里。代码、依赖、测试命令在哪个环境里，就把 Codex 装在哪个环境里。不要为了“看起来更全”同时混用两个环境。

### 可以复制网上别人的安装脚本吗

不建议。安装脚本会在你的电脑上执行命令，应该优先使用官方文档和官方 GitHub 仓库给出的命令。第三方文章可以看思路，但不要直接复制不明来源的一键脚本。

## 参考资料

- [Codex CLI](https://developers.openai.com/codex/cli)
- [Codex Quickstart](https://developers.openai.com/codex/quickstart)
- [ChatGPT desktop app](https://developers.openai.com/codex/app)
- [Codex IDE extension](https://developers.openai.com/codex/ide)
- [ChatGPT desktop app for Windows](https://developers.openai.com/codex/windows/windows-app)
- [Codex permissions](https://developers.openai.com/codex/permissions)
- [Codex environment variables](https://learn.chatgpt.com/docs/config-file/environment-variables)
- [OpenAI Codex GitHub repo](https://github.com/openai/codex)

## English Summary

This note explains how to install Codex on Windows, macOS, Linux, and WSL2. The recommended path is to choose the surface that matches your daily workflow: ChatGPT desktop app for project-level work, Codex CLI for terminal-based development, and IDE extensions for editor-centered coding. For beginners, signing in with a ChatGPT account is simpler than starting with API key configuration. Keep API keys out of code and GitHub.
