---
title: 与面试官聊20分钟Git
date: 2024-08-26 10:00:00 +0800
categories: [Git]
tags: [Git]
description: Git进阶
pin: true
---

## 介绍
在了解[Git基础](https://dengyaqi.github.io/posts/primary-git/)后，本文为Git的扩展，并且在[面试鸭](https://www.mianshiya.com/bank/1815649098609254402)中Git相关的主题从中等到困难中选出一些代表性的问题，以便于更好的理解Git。

## 扩展概念

### Git 的工作流程(Workflow)
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

## 面试题
1. 常见的远程Git仓库托管平台
常见的远程Git仓库托管平台包括 GitHub、GitLab 和 Bitbucket。这些平台都提供丰富的功能，支持代码托管、版本控制和协作开发。
- GitHub：全球最流行的Git 仓库托管服务，它不仅提供私有和公开仓库，还具备强大的社区和项目管理功能。
- GitLab：提供类似 GitHub 的功能，并且有l自托管的选项，企业可以在自己的服务器上安装GitLab。它还支持CI(持续集成)/CD(持续部署)功能。
- Bitbucket：支持Git 和Mercurial 两种版本控制系统，集成了CI/CD 并且与lAtlassian 产品如 Jira 等紧密集成。

2. git pull request 和 git branch 命令有哪些区别？
Git Pull Request（PR）是一种代码评审机制，用于在分布式版本控制系统（如GitHub、GitLab、Bitbucket）中协作开发项目。Pull Request允许开发人员在分支上完成功能开发或修复后，向项目的主分支提出代码合并请求。其他团队成员或项目维护者可以在合并之前对代码进行评审、讨论、测试和修改，从而保证代码的质量和项目的整体稳定性。
Git branch是分支操作命令。

3. Git 的 fork 复刻、branch 分支和 clone 克隆有哪些区别？
- fork 通常用于想要贡献到另一个人的项目但没有直接写权限的情况下。你可以通过 fork 来创建自己的副本，然后对这个副本进行改动，改动完成后再通过pull request 提交给原项目。
- branch常用于团队协作开发中。为了确保每个开发者可以并行开发而不相互干扰，通常会为每个新功能或修复创建单独的分支。例子包括feature分支（功能开发） 、hotfix 分支（紧急修复）、release 分支（发布准备）
- clone 是每个开发者的起点操作。在你开始参与一个项目时，你需要克隆该项目的仓库，这样你就有了项目的全部代码历史以及所有分支的本地副本。
