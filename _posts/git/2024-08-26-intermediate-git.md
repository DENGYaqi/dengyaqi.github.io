---
title: 与面试官聊20分钟Git
date: 2024-08-26 10:00:00 +0800
categories: [Git]
tags: [Git]
description: Git进阶
pin: true
---

## 介绍
在了解[Git基础](https://dengyaqi.github.io/posts/primary-git/)后，本文为Git的进阶扩展，并且在[面试鸭](https://www.mianshiya.com/bank/1815649098609254402)中Git相关的主题从中等到困难中选出一些代表性的问题，以便于更好的理解Git。主要介绍一些概念，具体的命令或者连续操作可以到[DevOps Guidebook](https://tsejx.github.io/devops-guidebook/code/git)或者[git官网](https://git-scm.com/book/zh/v2)查看。

## 扩展概念

### 团队合作
1. Pull Request(PR) : PR是一种代码评审机制，用于在分布式版本控制系统（如GitHub、GitLab、Bitbucket）中协作开发项目。Pull Request允许开发人员在分支上完成功能开发或修复后，向项目的主分支提出代码合并请求。其他团队成员或项目维护者可以在合并之前对代码进行评审、讨论、测试和修改，从而保证代码的质量和项目的整体稳定性。

2. Merge Request(MR) : 其实官网的大概意思就是这两个是同一个东西，只是名称不同。一般我们一般我们执行分支合并，需要执行`git pull`和`git merge`这两个命令，Github选择了第一个，GitLab选择了第二个。
```text
    Merge or pull requests are created in a git management application and ask an assigned person to merge two branches. Tools such as GitHub and Bitbucket choose the name pull request since the first manual action would be to pull the feature branch. Tools such as GitLab and Gitorious choose the name merge request since that is the final action that is requested of the assignee.
```

### Git的工作流程(Workflow)
是指团队在使用Git进行版本控制时，如何组织和管理代码开发、协作和发布的实践。根据团队的需求和项目的复杂性，
常见的Git工作流程有几种模式，每种模式都有其适用的场景和特点。
1. 集中式工作流Centralized Workflow : 所有开发人员在同一个主分支（main 或 master）上工作。适用于小型团队或简单项目，开发过程简单、冲突较少。
2. 功能分支工作流Feature Branch Workflow : 每个新功能或修复在一个独立的功能分支feature branch中进行开发，完成后再合并回主分支。适用于中型团队或复杂项目，可以并行开发多个功能，确保主分支的稳定性。
3. Git Flow工作流 : 是一种结构化的工作流，定义了多个分支类型来管理不同的开发阶段。适用于大型团队或复杂项目，结构清晰，适合频繁发布的项目。
分支类型：
  - master：用于发布的分支，包含稳定的、可以发布的代码。
  - develop：主开发分支，所有的新功能分支都会从该分支派生，并最终合并回该分支。
  - feature：功能分支，从 develop 派生，用于开发特定的新功能，完成后合并回 develop。
  - release：发布分支，从 develop 派生，用于发布前的准备工作，如修复bug或进行优化，完成后合并回 master 和 develop。
  - hotfix：热修复分支，从 master 派生，用于紧急修复生产环境中的问题，完成后合并回 master 和 develop。
4. Forking工作流 : 每个开发人员都有自己的Git仓库副本fork，在自己的仓库中进行开发，完成后向主仓库提交拉取请求Pull Request。适用于开源项目或大型团队，能够有效管理外部贡献者和多个开发人员之间的代码贡献。
5. GitHub Flow工作流 : 是一种简单的工作流，专注于快速开发和部署，通常只使用 master 和功能分支。适用于需要快速迭代和频繁部署的项目，特别是小型团队或敏捷开发流程。

## 命令解析

### 分支命令
- `git rebase`: 与`git merge`一样，是用于整合来自不同分支的更改的命令，一般情况不推荐使用，特别是在主分支上不能使用，会影响其他人的时间线。可在自己的分支上使用，使仓库历史更加美观和易于理解。使用完后用git reset只能回到某个提交记录，不能使时间线的状态恢复。原理是复制，它的具体操作是将当前分支的提交一一应用在目标分支的最顶端。
- `git cherry—pick` : 命令通常是用来将某一提交(或一系列提交)应用到当前分支的。但是如果你只想对特定文件的更改进行cherry—pick操作，可以借助暂存区来实现。

### 临时区命令
- `git stash` : 会把当前工作目录和暂存区的改动临时存储起来，并恢复工作目录的干净状态。这在你需要切换分支，又不希望提交未完成的工作的情况下非常有用。当你不再需要某个保存的stash记录时，`git stash drop`命令可以将其删除。

### 历史记录
- `git blame` : 用于逐行追踪文件的修改历史，显示每一行代码的最后一次修改是谁做的、在哪个提交（commit）中做的、以及修改的时间。
- `git reflog` : 恢复已删除的分支，但是尽快，因为如果执行了`git gc`，不再引用的对象可能会被永久删除。可以使用`git fsck`或者`git fsck --lost-found`命令检查对象库的状态，并列出可恢复的对象。它会在 .git/lost—found 目录下创建一系列对象文件，这些对象文件包含了无法引用的提交、树和对象。具体操作 : a) 运行git reflog命令来寻找该分支删除前的最近一次提交记录。b）找到目标分支删除前的那次提交的哈希值。c）使用该哈希值创建一个新的分支，效果等同于恢复之前的分支。例如：`git checkout -b branch_name <commit_hash>`

### 子模块/子树
- `git subtree` : 是一种将一个Git仓库的某个子目录与另一个Git仓库进行整合的方法。这使得你可以把一个仓库的子部分“嵌入”到另一个仓库中，同时仍然保持它们在各自仓库中的独立性。subtree提供了一种比子模块(submodule)更简单的链接多个代码库的方法，因为子树的文件是完全合并到主项目中的，并不依赖外部额外的配置或理解。使用场景 : 当你需要将一个开源库或另一个项目的一部分嵌入到你的项目中，并希望统一进行版本控制时。或者如果你是一个在多个项目间共享库的开发团队。subtree操作通常需要`-squash`参数将历史记录压缩成一个单独的提交，这样可以保持项目历史的简洁。正确使用prefix路径是必要的，确保合并的子树内容不会覆盖到主项目中的其他文件。
- `git submodule` : Submodule 是 Git 的一个功能，允许你把一个 Git 仓库作为另一个 Git 仓库的子目录进行管理。它们特别适用于需要包含外部依赖库或各种独立模块的项目。通常，当你添加 submodule 时，主仓库只会记录 submodule 当前指向的 commit 哈希值。
- 浅克隆（Shallow Clone）是在克隆 Git 仓库时，不将整个仓库的历史记录和所有提交一起克隆下来，而仅克隆最新的几次提交。这样可以减少获取数据的时间和空间使用，是处理大规模或远程仓库时的常用技巧。

### 垃圾收集器
- `git gc` : Git作为一个分布式版本控制系统，会在使用过程中生成大量的数据对象，包括commits、blobs、trees、和 tags。这些对象是文件系统中实际存储的数据，从而可以进行版本管理。在开发周期中，很多临时分支、未被合并的commit、过时的对象都会积累，如果不加以清理，会导致存储空间浪费以及降低操作性能。适用场景垃圾收集器在一些特定场景下尤为重要，如长期运行的仓库、大规模分支操作后、大量重写历史(如rebase或filter—branch)的操作之后。
通过`git gc`命令来触发 a) 自动移除未引用的对象 b) 压缩对象库 : 将多个小对象打包成一个大的 pack 文件，同时删除旧的、不再需要的 loose objects。c) 优化引用树 : 清理和重新组织引用（如分支、标签）的结构，使其更加高效。

## 进阶操作
1. 配置和使用多个远程仓库 : 为何需要?例如origin是自己的github上的远程仓库，upstream是fork原始作者的仓库，主要用于同步最新代码。具体操作 : 添加新的远程仓库upstream : `git remote add upstream <第二个远程仓库的 URL>`、查看所有远程仓库 : `git remote -v`、将upstream的某个分支合并到本地分支 : `git merge upstream/分支名`、推送代码到执行的远程仓库 : `git push origin 分支名`。

## 分支系统
分支系统主要有Git、SVN以及Mercurial。它们各自有着不同的特点和优缺点。
1. Git：Git是目前最流行的分布式版本控制系统。它的主要优点是分散式管理，能够让每个开发者拥有自己的本地仓库，并且分支操作非常轻量级、快速。Git 还有强大的协作功能，比如 pull request、代码审查等。但是，Git 的学习曲线相对较陡，对新手不太友好。
2. SVN(Subversion)：SVN 是集中式版本控制系统。它的优点是操作简便，适合团队合作，权限管理相对容易。劣势在于分支操作因为是集中式的，可能会比较耗时。SVN 也不如 Git 在本地开发时那么灵活。
3. Mercurial： Mercurial也是一种分布式版本控制系统。它的优点是与 Git 相似，分支操作快速、轻量，并且界面友好，命令相对简单明了，比较适合新手使用。缺点在于社区不如 Git活跃，扩展性和生态系统相对较弱。

## 面试题
1. 常见的远程Git仓库托管平台
常见的远程Git仓库托管平台包括 GitHub、GitLab 和 Bitbucket。这些平台都提供丰富的功能，支持代码托管、版本控制和协作开发。
- GitHub：全球最流行的Git 仓库托管服务，它不仅提供私有和公开仓库，还具备强大的社区和项目管理功能。
- GitLab：提供类似 GitHub 的功能，并且有自托管的选项，企业可以在自己的服务器上安装GitLab。它还支持CI(持续集成)/CD(持续部署)功能。
- Bitbucket：支持Git 和Mercurial 两种版本控制系统，集成了CI/CD 并且与lAtlassian 产品如 Jira 等紧密集成。

2. Git 的 fork 复刻、branch 分支和 clone 克隆有哪些区别？
- fork 通常用于想要贡献到另一个人的项目但没有直接写权限的情况下。你可以通过 fork 来创建自己的副本，然后对这个副本进行改动，改动完成后再通过pull request提交给原项目。
- branch常用于团队协作开发中。为了确保每个开发者可以并行开发而不相互干扰，通常会为每个新功能或修复创建单独的分支。例子包括feature分支（功能开发） 、hotfix 分支（紧急修复）、release 分支（发布准备）
- clone 是每个开发者的起点操作。在你开始参与一个项目时，你需要克隆该项目的仓库，这样你就有了项目的全部代码历史以及所有分支的本地副本。

3. 在 Git 中，如何确保提交历史的清晰和可追踪性？
- 使用结构化的提交消息格式：一个好的提交消息包括标题、主体和脚注。标题应简洁明了，主体提供更多详细信息，脚注可以包含问题跟踪编号(如Jira编号)。可以在提交前使用`commitlint`来验证提交消息是否符合规范。
- 频繁且小范围的提交：确保每个提交都有明确的目的，并且每个提交只包含一个功能或修复。这样可以更容易追踪变化的来源。
- 使用分支和合并策略：在开发新的功能或修复bug时，新建分支进行开发，避免在主干(如main分支)直接开发。合并分支时保持一个干净的日志，比如使用`——no—ff`参数，或者使用“变基”（rebase）来维持线性历史。
- 进行代码审查：在合并代码之前，进行代码审查，确保代码合规且高质量，可以扫描出一些潜在的错误。
- 签署提交：使用 git commit —s 命令签署提交，这样其他人可以验证提交是否来自预期的作者。
- .gitignore 文件：确保不必要的文件（如临时文件、编译输出等）不会被提交到代码库中，从而保持提交历史的简洁和有意义。
- 标签（Tags） ：使用标签为重要的版本创建标记，方便追踪和回溯历史版本。例如，发布一个新版本时，可以使用 git tag v1.0.0 来创建一个版本标签。

### 进阶命令大全

```bash
git branch --merged                                       # 查看已经合并的分支。如果存在，说明已经被合并；如果不存在，则表示没有被合并。
git remote add upstream <第二个远程仓库的URL>                # 添加远程仓库
git revert <commit-hash>                                  # 撤销一个提交(已提交的情况)
git reset --hard <commit-hash>                            # 丢弃工作目录的更改(未提交的情况)
git reset --soft <commit-hash>                            # 保留工作目录的更改(未提交的情况)
git commit -S -m "提交信息"                                # 签署签名提交
git log --show-signature                                  # 验证/查看提交的签名
git show --show-signature                                 # 验证/查看提交的签名

```
