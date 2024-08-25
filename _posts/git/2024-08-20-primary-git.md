---
title: 【初级篇】与面试官聊20分钟Git
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
添加文件 : git add <file>
本次提交的说明 : git commit -m <message>
```

## 最常用的命令
在工作中，每天第一件事就是看情况拉取项目中matser的内容，避免太久没有拉取产生过多的冲突，例如冲突过多的情况，在找相关同事解决冲突的时候会产生一些不必要的错误。

### 创建分支
接收到新的需求，通常使用该需求名称创建一个自己的分支，例如新需求是搜索引擎新增搜索条件，则可命名为ES新增搜索条件。一般在大厂都是可以界面操作。

```git
拉取远端代码 : git fetch
提交暂存区内容 : git push
合并分支 : git merge --no-ff origin/master
回滚提交 : git reset <commit-id>
```

