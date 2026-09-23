---
title: CC Switch 入门：Windows、macOS 和 Linux 安装手册
date: 2026-08-03 12:00:00 +0800
categories: [AI, Guide]
tags: [ai-guide, cc-switch, codex, cli, install, windows, macos, linux]
description: 面向第一次使用 CC Switch 的开发者，记录 Windows、macOS 和 Linux 的下载安装方式、第一次启动检查和安全提醒。
pin: true
published: false
---

## 0. 这篇文章解决什么

这篇文章只解决一件事：**把 CC Switch 装起来，并确认可以正常打开。**

适合以下读者：

- 已经装好了 Codex、Claude Code、Gemini CLI 这类 AI 编程工具。
- 想用一个桌面工具统一管理 provider、MCP、Skills 和配置。
- 不想手动改很多配置文件。
- 只想先完成下载、安装和第一次启动。

不展开的内容：

- 怎么添加 API provider。
- 怎么填写 API key。
- 怎么切换官方登录和第三方 provider。
- 怎么配置本地路由、MCP、Skills。

这些后面单独写。

## 1. CC Switch 是什么

CC Switch 是一个第三方开源桌面工具。

它不是 OpenAI 官方工具。

它主要用来统一管理多个 AI 编程工具的配置。

目前它支持的工具包括：

- Claude Code
- Claude Desktop
- Codex
- Gemini CLI
- Grok Build
- OpenCode
- OpenClaw
- Hermes Agent

简单理解：

| 你原来要做的事 | 有 CC Switch 后 |
| --- | --- |
| 手动改不同工具的配置文件 | 在一个桌面界面里管理 |
| 不同 provider 来回切换 | 在界面或托盘里切换 |
| MCP 到处配一遍 | 在统一面板里管理 |
| Skills 分散安装 | 在统一面板里管理 |
| 不知道当前用了哪个 key | 在 provider 列表里看 |

新手先记住一句话：

**CC Switch 是 AI 编程工具的配置管理面板。**

## 2. 先确认你要装的是哪一个

网上可能会搜到好几个名字相似的项目。

这篇文章写的是这个项目：

[https://ccswitch.io/](https://ccswitch.io/)

官方 GitHub 仓库是：

[https://github.com/farion1231/cc-switch](https://github.com/farion1231/cc-switch)

不要混淆：

| 名字 | 说明 |
| --- | --- |
| CC Switch | 这篇文章要安装的桌面应用 |
| cc-switch-cli | 另一个命令行项目，不是本文重点 |
| 各种下载站镜像 | 不建议新手使用 |

建议只从三个地方下载：

1. 官网。
2. GitHub Releases。
3. macOS 的官方 Homebrew cask。

## 3. 安装前准备

安装 CC Switch 前，先确认你的系统符合要求。

| 系统 | 要求 |
| --- | --- |
| Windows | Windows 10 或以上 |
| macOS | macOS 12 Monterey 或以上 |
| Linux | Ubuntu 22.04+、Debian 11+、Fedora 34+ 或主流发行版 |

如果你只是第一次试用，建议先用自己电脑安装。

不要一开始就在公司生产机、服务器或重要环境里尝试。

## 4. Windows 安装

### 4.1 下载

打开 GitHub Releases：

[https://github.com/farion1231/cc-switch/releases/latest](https://github.com/farion1231/cc-switch/releases/latest)

找到 Windows 安装包。

常见文件名类似：

```text
CC-Switch-v版本号-Windows.msi
```

也可能有便携版：

```text
CC-Switch-v版本号-Windows-Portable.zip
```

新手优先选择 `.msi`。

### 4.2 安装

双击 `.msi` 文件。

按安装向导继续。

安装完成后，在开始菜单里搜索：

```text
CC Switch
```

点击打开。

### 4.3 验证

打开后看三件事：

1. 能看到 CC Switch 主窗口。
2. 左侧或顶部能看到被管理的工具入口。
3. 系统托盘里能看到 CC Switch 图标。

如果这三项都正常，Windows 安装完成。

### 4.4 Windows 常见问题

**问题：Windows 提示未知发布者或安全提醒。**

处理方式：

1. 先确认安装包来自 GitHub Releases。
2. 不要从陌生下载站重新下载。
3. 如果是公司电脑，先问管理员是否允许安装。

**问题：打开后没有识别到 Codex。**

处理方式：

1. 先确认 Codex 已经安装。
2. 关闭 CC Switch。
3. 重新打开终端，确认 `codex --version` 可用。
4. 再重新打开 CC Switch。

## 5. macOS 安装

macOS 有两种方式。

新手可以用 `.dmg`。

熟悉 Homebrew 的用户可以用 `brew`。

### 5.1 Homebrew 安装

打开 Terminal。

执行：

```shell
brew install --cask cc-switch
```

安装完成后，打开 Launchpad 或应用程序目录。

找到：

```text
CC Switch
```

点击打开。

### 5.2 手动下载安装

打开 GitHub Releases：

[https://github.com/farion1231/cc-switch/releases/latest](https://github.com/farion1231/cc-switch/releases/latest)

下载 macOS 安装包。

常见文件名类似：

```text
CC-Switch-v版本号-macOS.dmg
```

打开 `.dmg`。

把 CC Switch 拖到 Applications。

然后从 Applications 打开。

### 5.3 验证

打开后看三件事：

1. 能看到 CC Switch 主窗口。
2. macOS 菜单栏能看到 CC Switch 图标。
3. App 里能看到 Codex、Claude Code、Gemini CLI 等入口。

如果这三项都正常，macOS 安装完成。

### 5.4 macOS 更新

如果你用 Homebrew 安装，更新命令是：

```shell
brew upgrade --cask cc-switch
```

如果你用 `.dmg` 安装，可以在 GitHub Releases 下载新版重新安装。

## 6. Linux 安装

Linux 一般从 GitHub Releases 下载。

打开：

[https://github.com/farion1231/cc-switch/releases/latest](https://github.com/farion1231/cc-switch/releases/latest)

根据发行版选择：

| 发行版 | 推荐文件 |
| --- | --- |
| Ubuntu / Debian | `.deb` |
| Fedora / RHEL / openSUSE | `.rpm` |
| 不确定 | `.AppImage` |

### 6.1 Ubuntu / Debian

下载 `.deb` 后，进入下载目录。

执行：

```shell
sudo apt install ./CC-Switch-*.deb
```

安装完成后，在应用菜单里搜索：

```text
CC Switch
```

### 6.2 Fedora / RHEL / openSUSE

下载 `.rpm` 后，进入下载目录。

Fedora 可以执行：

```shell
sudo dnf install ./CC-Switch-*.rpm
```

openSUSE 可以执行：

```shell
sudo zypper install ./CC-Switch-*.rpm
```

安装完成后，从应用菜单打开。

### 6.3 AppImage

如果你下载的是 `.AppImage`，先加执行权限：

```shell
chmod +x CC-Switch-*.AppImage
```

再运行：

```shell
./CC-Switch-*.AppImage
```

### 6.4 Linux 验证

打开后看三件事：

1. 能看到 CC Switch 主窗口。
2. 能看到被管理的 AI 编程工具入口。
3. 系统托盘里能看到 CC Switch 图标。

如果托盘图标不显示，可能是你的桌面环境没有启用托盘扩展。

GNOME 用户可以检查 AppIndicator 支持。

## 7. 第一次打开后先不要急着填 key

第一次打开 CC Switch，建议先只看界面。

不要急着添加 API key。

先确认：

1. 你知道当前电脑装了哪些 AI 编程工具。
2. 你知道自己要管理的是 Codex、Claude Code，还是 Gemini CLI。
3. 你知道 API key 来自哪里。
4. 你知道这个 key 是否允许给第三方工具使用。

如果不确定，先停在这里。

下一篇再写“如何在 CC Switch 里添加 provider”。

## 8. 安装成功检查表

逐项检查：

| 检查项 | 动作 | 成功表现 |
| --- | --- | --- |
| 来源正确 | 从官网或 GitHub Releases 下载 | 不是陌生下载站 |
| 应用能打开 | 双击 CC Switch | 出现主窗口 |
| 托盘可见 | 看系统托盘或菜单栏 | 有 CC Switch 图标 |
| 工具入口可见 | 查看应用列表 | 能看到 Codex 等工具入口 |
| 不急着填 key | 先只看界面 | 没有随便粘贴 API key |
| 后续可更新 | 记录安装方式 | 知道用 brew 或 Releases 更新 |

如果这 6 项都通过，安装阶段就结束了。

## 9. 不建议做的事

不要这样做：

- 不要从陌生下载站下载。
- 不要使用别人发来的网盘安装包。
- 不要把 API key 发给别人。
- 不要把 API key 填进自己不信任的工具。
- 不要在不知道作用的情况下开启本地路由接管。
- 不要一开始就改很多工具的配置。

建议这样做：

- 只从官网、GitHub Releases 或 Homebrew 安装。
- 先安装，再确认能打开。
- 再学习 provider、API key、官方登录、本地路由和 Skills。

## 10. 参考资料

- [CC Switch 官网](https://ccswitch.io/)
- [CC Switch GitHub 仓库](https://github.com/farion1231/cc-switch)
- [CC Switch 最新 Releases](https://github.com/farion1231/cc-switch/releases/latest)
- [CC Switch 安装文档](https://ccswitch.io/en/docs?item=installation&section=getting-started)
- [CC Switch Homebrew cask 说明](https://github.com/farion1231/homebrew-ccswitch)

## English Summary

This guide explains how to install CC Switch on Windows, macOS, and Linux. It focuses only on safe installation and first launch: download from the official website or GitHub Releases, use Homebrew on macOS if preferred, open the app, verify the tray icon and managed tool list, and avoid entering API keys until you understand providers and security boundaries.
