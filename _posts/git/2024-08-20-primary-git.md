---
title: Git学习记录
date: 2024-08-20 10:14:51 +0800
categories: [Git]
tags: [Git]
description: Git基础
pin: true
---

## 介绍
Git是分布式版本控制系统。
- 入门 : [廖雪峰的Git教程](https://liaoxuefeng.com/books/git/what-is-git/index.html)。
- 面试 : 入门教程大致看一遍后到[面试鸭](https://www.mianshiya.com/category/%E5%90%8E%E7%AB%AF)进行刷题 : Git基础面试题、Git进阶面试题、Git操作面试题、Git概念面试题、Git协作应用面试题。
刷题时尽量先用自己的语言回答一遍，理解题目 - 自己的话回答(不懂的地方可以先自行查询) - 查看答案。
- 工作 : 最常用的命令是在工作中[常用的一些版本控制命令](#最常用的命令)。[官方的git命令](https://tsejx.github.io/devops-guidebook/code/git/commit/)快速查看。
- 日常 : 到GitHub上实践。

## 主要概念
1. 工作区、版本库和暂存区 : 工作区是电脑中的一个文件夹、版本库是带有.git文件的文件夹、暂存区是临时存文件变更的位置，叫stage或index，git add的区域。

2. [分支](https://liaoxuefeng.com/books/git/branch/create/index.html)与HEAD指针 : 
    - 时间线 : 每次提交，Git都把它们串成一条时间线，这条时间线就是一个分支。
    - 主分支 : 在Git里，这个分支叫主分支，即master分支。
    - HEAD指针 : 指向master的一个指针叫HEAD。
    - 分支合并流程 : 假设有一个dev分支push了内容，则dev先于master，dev合并到master后，matser与dev指针并列。

3. [本地仓库与远程仓库](https://liaoxuefeng.com/books/git/branch/collaboration/index.html)的区别 : 远程仓库的默认名称是origin。

### 配置Git
```git
# 配置git
git config --global user.name "Your Name"
git config --global user.email "email@example.com"

# 查看当前用户(global)配置
git config --global --list
```

## 添加内容
```git
添加文件(本地文件添加到暂存区) : git add <file>
(本次提交的说明)将暂存区内容提交到当前分支 : git commit -m 'message'
把本地master的内容推送到远程origin : git push origin master
```

## 最常用的命令
在工作中，每天第一件事就是看情况拉取项目中matser的内容，避免太久没有拉取产生过多的冲突，例如冲突过多的情况，在找相关同事解决冲突的时候会产生一些不必要的错误。

### 创建分支
接收到新的需求，通常使用该需求名称创建一个自己的分支，例如新需求是搜索引擎新增搜索条件，则可命名为ES新增搜索条件。一般在大厂都是可以界面操作。

```git
查看状态 : git status
切换分支 : git checkout
基于当前分支新建并切换分支 : git checkout -b <branchname>
拉取远端代码 : git fetch
提交暂存区内容 : git push
合并分支 : git merge --no-ff origin/master
解决冲突 : Git用<<<<<<<，=======，>>>>>>>标记出不同分支的内容，我们修改如下后保存再提交，使用git add和git commit
放弃本次合并 : git merge --abort
回滚提交 : git reset <commit-id>
```
*[快进模式Fast forward](https://liaoxuefeng.com/books/git/branch/policy/index.html) : 在这种模式下，删除分支后，会丢掉分支信息。不使用该模式时，Git就会在merge时生成一个新的commit，这样，从分支历史上就可以看出分支信息。