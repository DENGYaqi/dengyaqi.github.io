---
title: 【学习篇】CocosCreator学习第二部分 - Cocos Creator
date: 2024-08-11 10:14:51 +0800
categories: [CocosCreator]
tags: [CocosCreator, TypeScript]
description: Cocos Creator
pin: true
---

## 设置准备
Cocos Creator
1. 下载Cocos编辑器
2. 配置 : vs code IDE : 开发者 -> VS Code工作流 -> 更新VS Code智能提示数据

VS Code编辑器
1. 下载VS Code
2. 配置 : Code -> 首选项 -> 配置 -> 文本编译器 -> 文件 -> Exclude -> 添加模式 -> **/*.meta，因为每个文件都会生成这个文件。不排除就会有很多。

## 编辑器
官网编辑器界面功能介绍 : [编辑器界面](https://docs.cocos.com/creator/3.8/manual/zh/editor/)

## Cocos编程思想([基本概念](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/))
1. [Director导演](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/director.html) : 一个常见的 Director 任务是控制场景替换和转换。 Director使用单例模式实现。例如播放声音、暂停、继续等等，对整个游戏进行统一管理的类。
2. [Scene场景](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/scene.html) : 导演的子类，一个游戏可分为不同的场景。
    - 可包含layer层。
    - 场景是被渲染器(renderer)画出来的。渲染器负责渲染精灵和其它的对象进入屏幕。
    - 场景图(Scene Graph)是一种安排场景内对象的数据结构，它把场景内所有的节点(Node)都包含在一个树(tree)上。
3. [Sprite精灵](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/sprites.html) : 场景的子类，每个场景可包含多个精灵Sprite。场景里所有一切的物体都是精灵，演员、背景、箱子、房子等等都是精灵。
    - 精灵和节点的区别？如果你能控制它，它才是一个精灵，如果无法控制，那就只是一个节点。
4.
