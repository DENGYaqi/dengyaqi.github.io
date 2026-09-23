---
title: Skills.sh 入门：如何给 Codex 下载和安装 Skills
date: 2026-08-03 11:00:00 +0800
categories: [AI, Guide]
tags: [ai-guide, codex, skills, skills-sh, cli, install, nodejs]
description: 面向第一次使用 Skills.sh 的开发者，记录如何安装 Node.js、搜索技能、把技能下载到 Codex 项目里，并检查是否安装成功。
pin: true
published: false
---

## 0. 这篇文章解决什么

这篇文章只解决一件事：**把 Skills.sh 上的技能下载到 Codex 可以读取的位置。**

适合以下读者：

- 已经装好了 Codex。
- 想给 Codex 增加一些固定能力。
- 不知道 Skills.sh 是网页、命令行工具，还是插件。
- 想照着命令一步一步操作。

不展开的内容：

- 怎么自己写一个 Skill。
- 怎么发布 Skill。
- 怎么做复杂插件。
- 怎么判断一个 Skill 写得好不好。

这些后面单独写。

## 1. 先分清两个名字

先记住这句话：

**Skills.sh 是第三方技能目录，Skill 是给 AI Agent 用的能力说明书。**

简单理解：

| 名字 | 是什么 | 你要做什么 |
| --- | --- | --- |
| Skill | 一个带 `SKILL.md` 的文件夹 | 让 Codex 学会一套固定流程 |
| Skills.sh | 一个公开技能目录 | 搜索别人已经写好的 Skill |
| `skills` CLI | 下载技能的命令行工具 | 用 `npx skills add ...` 安装 |
| OpenAI Skills | OpenAI 官方技能和文档 | 优先看官方说明 |

新手不要先纠结概念。

先做到这三步：

1. 打开 Skills.sh。
2. 找到一个你想要的 Skill。
3. 复制安装命令。

## 2. 安装前准备

Skills.sh 的命令一般通过 `npx` 执行。

所以电脑里需要先有 Node.js。

### 2.1 检查 Node.js

打开终端。

Windows 用 PowerShell。

macOS、Linux、WSL2 用 Terminal。

执行：

```shell
node --version
```

再执行：

```shell
npm --version
```

如果两个命令都能看到版本号，就可以继续。

### 2.2 如果没有 Node.js

打开 Node.js 官网：

[https://nodejs.org/](https://nodejs.org/)

下载 LTS 版本。

安装完成后，关闭终端，再重新打开。

重新执行：

```shell
node --version
npm --version
```

能看到版本号，再继续下一步。

## 3. 先选择安装位置

新手建议先装到项目里。

也就是：

```text
你的项目/.agents/skills/
```

原因很简单：

- 你能看到它到底装到了哪里。
- 这个 Skill 只影响当前项目。
- 不满意可以直接删除。
- 后续也方便提交给团队一起用。

不建议新手一开始就全局安装。

全局安装会影响所有项目，排查问题更麻烦。

## 4. 打开你的项目目录

以这个博客项目为例。

Windows PowerShell：

```powershell
cd D:\YaqiGitHub\blog
```

macOS、Linux、WSL2：

```shell
cd ~/code/my-project
```

确认当前目录是项目根目录：

```shell
git status
```

如果能看到 Git 状态，说明你在项目里。

如果提示不是 Git 仓库，先不要安装，回到正确项目目录。

## 5. 打开 Skills.sh 搜索技能

打开网站：

[https://www.skills.sh/](https://www.skills.sh/)

你可以先看三个入口：

| 入口 | 适合做什么 |
| --- | --- |
| All skills | 看全部技能 |
| Official | 看官方或技术厂商维护的技能 |
| Codex | 看适合 Codex 的技能 |

如果你是第一次使用，建议先打开 Codex 页面：

[https://www.skills.sh/agent/codex](https://www.skills.sh/agent/codex)

看到想用的 Skill 后，先点进去看说明。

不要只看下载量。

## 6. 安装一个 Skill

Skills.sh 文档里的基本命令是：

```shell
npx skills add <owner>/<repo>
```

例如安装 Vercel Labs 的技能集合：

```shell
npx skills add vercel-labs/agent-skills
```

执行后，命令行可能会问你几个问题。

新手可以按下面思路选：

| 问题 | 建议 |
| --- | --- |
| 安装到哪个 agent | 选 Codex |
| 安装到项目还是全局 | 选 Project |
| 用 symlink 还是 copy | 不确定就选默认 |
| 是否继续 | 确认来源后再继续 |

如果你想明确指定 Codex，可以用：

```shell
npx skills add vercel-labs/agent-skills --agent codex
```

如果你只想安装其中一个技能，可以加 `--skill`：

```shell
npx skills add vercel-labs/agent-skills --agent codex --skill web-design-guidelines
```

说明：

- `vercel-labs/agent-skills` 是示例，不是必须安装。
- `web-design-guidelines` 也是示例。
- 实际安装前，先看这个仓库和这个 Skill 是否适合你的项目。
- 如果安装过程中命令行提示了目标目录，以命令行实际输出为准。

## 7. 查看有哪些技能可以安装

如果你不确定仓库里有哪些 Skill，先不要直接安装。

可以先列出来：

```shell
npx skills add vercel-labs/agent-skills --list
```

看到列表后，再挑一个具体的 Skill 安装。

这样比一次装一堆更清楚。

## 8. 检查是否安装成功

安装完成后，先看项目目录里有没有这个文件夹：

```text
.agents/skills/
```

Windows PowerShell：

```powershell
dir .agents\skills
```

macOS、Linux、WSL2：

```shell
ls .agents/skills
```

再找里面是否有 `SKILL.md`。

Windows PowerShell：

```powershell
dir .agents\skills -Recurse -Filter SKILL.md
```

macOS、Linux、WSL2：

```shell
find .agents/skills -name SKILL.md
```

能看到 `SKILL.md`，说明文件已经下载到项目里了。

## 9. 让 Codex 读取新 Skill

回到项目根目录。

执行：

```shell
codex
```

如果 Codex 已经开着，可以先关闭当前会话，再重新打开。

在 Codex 输入框里可以试着输入 `$`，看是否能选择刚安装的 Skill。

也可以直接在提示词里点名这个 Skill。

如果新 Skill 没出现：

1. 确认你是在项目根目录启动 Codex。
2. 确认 `.agents/skills/` 里有 `SKILL.md`。
3. 关闭 Codex，重新打开。
4. 只保留一个测试 Skill，先不要一次安装太多。

## 10. 全局安装怎么做

如果你已经确定某个 Skill 所有项目都会用，再考虑全局安装。

命令加 `--global`：

```shell
npx skills add vercel-labs/agent-skills --agent codex --global
```

说明：

- 全局安装更方便。
- 但新手更难排查问题。
- 我建议先项目安装，熟悉以后再全局安装。

## 11. 怎么卸载

如果你刚才装错了，可以用命令卸载：

```shell
npx skills remove
```

它会让你选择要删除的 Skill。

如果你知道名字，也可以直接写：

```shell
npx skills remove web-design-guidelines
```

如果你只是项目级安装，也可以手动删除项目里的对应目录。

删除前先确认：

```text
.agents/skills/
```

不要误删项目代码。

## 12. 安全提醒

安装 Skill 前，一定做这几件事：

1. 看来源。
2. 看 README。
3. 看 `SKILL.md`。
4. 看有没有脚本目录。
5. 不要安装来路不明的技能。

尤其注意：

- Skill 可能包含操作步骤。
- Skill 也可能包含脚本。
- 脚本可能读写文件、调用命令或访问网络。

所以不要把 Skills.sh 当成应用商店无脑安装。

它更像是一个公开目录。

你仍然要自己判断来源是否可靠。

## 13. 安装成功检查表

逐项检查：

| 检查项 | 命令或动作 | 成功表现 |
| --- | --- | --- |
| Node.js 可用 | `node --version` | 显示版本号 |
| npm 可用 | `npm --version` | 显示版本号 |
| 在项目根目录 | `git status` | 显示 Git 状态 |
| 能运行 skills CLI | `npx skills add <owner>/<repo> --list` | 显示技能列表 |
| 技能已下载 | 查看 `.agents/skills/` | 能看到技能目录 |
| 有技能文件 | 查找 `SKILL.md` | 能看到一个或多个 `SKILL.md` |
| Codex 读取到 | 重启 Codex 后输入 `$` | 能选择或点名新技能 |

如果这 7 项都通过，安装阶段就结束了。

## 14. 参考资料

- [Skills.sh](https://www.skills.sh/)
- [Skills.sh CLI 文档](https://www.skills.sh/docs/cli)
- [Skills for Codex](https://www.skills.sh/agent/codex)
- [Vercel Labs skills CLI GitHub 仓库](https://github.com/vercel-labs/skills)
- [OpenAI Build skills](https://developers.openai.com/codex/skills)
- [OpenAI Skills GitHub 仓库](https://github.com/openai/skills)

## English Summary

This guide explains how to download and install Skills from Skills.sh for Codex. It uses a beginner-friendly project-level setup: install Node.js, open a project root, browse Skills.sh, run `npx skills add ... --agent codex`, check `.agents/skills/`, and restart Codex so the new `SKILL.md` files can be discovered.
