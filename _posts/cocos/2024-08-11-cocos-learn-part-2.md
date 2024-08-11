---
title: 【学习篇】CocosCreator学习第二部分 - Cocos Creator
date: 2024-08-11 10:14:51 +0800
categories: [CocosCreator]
tags: [CocosCreator]
description: Cocos Creator
pin: true
---

## 介绍
飞羽教程使用的是Cocos 2dx和VS Code编辑器。

## 环境准备
Cocos Creator
1. 下载Cocos编辑器
2. 配置 : vs code IDE : 开发者 -> VS Code工作流 -> 更新VS Code智能提示数据

VS Code编辑器
1. 下载VS Code
2. 配置 : Code -> 首选项 -> 配置 -> 文本编译器 -> 文件 -> Exclude -> 添加模式 -> **/*.meta，因为每个文件都会生成这个文件。不排除就会有很多。

## 编辑器
官网编辑器界面功能介绍 : [编辑器界面](https://docs.cocos.com/creator/3.8/manual/zh/editor/)

层级管理器(节点) : 节点的层级关系。
- 2D对象节点/渲染节点 : 就是可以显示出来的节点，如精灵、粒子。
- UI节点 : 属于设计游戏界面的节点。如布局、进度条。

属性检查器(组件) : 组件、有几个组件、组件的功能有哪些。
- position 位置 0,0点 = 锚点
- rotation 旋转 正数右旋转 负数左旋转。鼠标移动到rotation框左边左键单击拖动可以直接旋转调整。
- scale 缩放 按比例调整大小，默认1比1 例如x0.5则x轴缩一半。
- [anchor](#锚点与坐标系) 锚点 默认在组件中心点 
- size 按像素调整大小
- color 颜色 白色就是不用颜色 其他颜色是选择的颜色和图片的颜色混合。
- opacity 透明度 不透明则是255
- skew 倾斜度 负数左边倾斜 正数右边倾斜
- group 分组 例如飞机大战可以把飞机放到一组，子弹放到一组，再判断两组之间是否有碰撞。

场景编辑器的按钮 : 
- 十字箭头(W) : 移动工具，拖拽可修改节点位置，对应position
- 循环箭头(E) : 旋转工具，拖拽可修改节点角度，对应rotation
- 大方块包含小方块(R) : 缩放工具，拖拽可修改节点缩放，对应scale
- 矩形(T) : 矩形变换工具，拖拽四边或四点可修改节点大小和位置，对应position、size和anchor

资源管理器(资源) : 所有的资源、资源可以拖拽到层级内，会自动生成节点。

## Cocos编程思想([基本概念](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/))
面向组件的设计。
1. [Director导演](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/director.html) : 一个常见的Director的任务是控制场景替换和转换。 Director使用单例模式实现。例如播放声音、暂停、继续等等，对整个游戏进行统一管理的类。
2. [Scene场景](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/scene.html) : 导演的子类，一个游戏可分为不同的场景。
    - 可包含layer层。
    - 场景是被渲染器(renderer)画出来的。渲染器负责渲染精灵和其它的对象进入屏幕。
    - 场景图(Scene Graph)是一种安排场景内对象的数据结构，它把场景内所有的节点(Node)都包含在一个树(tree)上。
3. [Sprite精灵](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/sprites.html) : 场景的子类，每个场景可包含多个精灵Sprite。场景里所有一切的物体都是精灵，演员、背景、箱子、房子等等都是精灵。
    - 精灵和节点的区别？如果你能控制它，它才是一个精灵，如果无法控制，那就只是一个节点。
4. 节点Node : 可以挂载多个组件，挂什么组件就有什么功能。
5. 组件Component : 每个组件有不同的功能。

### 面向对象和面向组件的区别
- 面向对象 : 实现一个精灵的例子 : 父类npc，子类商店老板和敌人，敌人的子类又有拿刀敌人、弓箭敌人、大Boss等等。

- 面向组件 : 在npc节点挂上卖东西的组件就等于商店老板，或者在npc组件挂上敌人的组件和刀的组件就是拿刀敌人。

## 锚点与坐标系
![组件与锚点位置](/assets/img/cocos/learn_part_2/anchor.png){: .normal }
_组件与锚点位置_

组件自带坐标，锚点默认在组件上的0.5, 0.5的位置上，假设节点是一张图片，若想将锚点放置于图片左下角，则锚点坐标为0, 0，右上角为1, 1，左上角0, 1，右下角1, 0。