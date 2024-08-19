---
title: 【学习篇】CocosCreator学习第四部分 - Cocos Creator
date: 2024-08-19 10:00:00 +0800
categories: [CocosCreator]
tags: [CocosCreator]
description: Cocos Creator的UI系统
pin: true
---

## 介绍
这部分内容主要介绍Cocos Creator的UI系统。从视频52到视频66。

## 屏幕Canvas
3dx的[Canvas组件](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/canvas.html)介绍。Canvas代表屏幕、屏幕内的所有物体都会被Camera渲染出来。主要就是改动画布大小的时候需要在项目设置内修改。还有就是

[Label](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/label.html) : 文本，font字体

## [富文本RichText](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/richtext.html)

- 支持标签系统。如果需要一段话内的某个字变成红色，则直接使用标签即可，例如

```html
<color=green>I'm green</color>
```

- 新建richtext节点 - 新建脚本挂载上节点 - 节点新增Richtext组件 - 组件内的Sring内添加以下标签内容 - 点击click me!文字则会调用handler函数

```html
<on click="handler"> click me! </on>
```

- 嵌套标签

- 图文混排 : 文字内添加表情包 - 在Richtext组件内有Image Atlas属性 - 将图集拖拽至该属性内 - 编写String属性

```html
这是一个地面<img src="land" clik="handler"/>吗？
```

## 屏幕适配与遮罩

### [遮罩](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/mask.html)
例如原本的图片是长方形，但是QQ头像的框是圆形，只显示原圆形内部的图像。
创建遮罩 : 新增父子节点(只对父子节点有效) - 在父节点添加渲染组件Mask - 例如子节点小鸟是圆形的，父节点是正方形的，遮罩后只显示正方形的。

### 屏幕适配
所有的UI都放在Canvas下面。使用[Widge组件](https://docs.cocos.com/creator/3.5/manual/zh/ui-system/components/editor/widget.html)。

## 按钮与布局
[控件库](https://docs.cocos.com/creator/2.4/manual/zh/getting-started/basics/editor-panels/node-library.html) : 面板 - 节点预制库

### 按钮
[Button组件](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/button.html)
1. Interactable 是否交互，不勾选按钮置灰。
2. Sprite Transition 在不同点击状态可以存放不同的图片
3. 按钮触发事件 : button节点挂载脚本 - button属性Click Events修改为1 - 并将button节点拖回这个Click Events属性内的[0]下的cc.Node内，第二个框选择脚本。第三个框选择函数。

### 布局
[Layout组件](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/layout.html)
1. Resize Mode缩放模式 : CONTAINER 父节点适应子节点的宽、CHILD子节点适应父节点的宽
2. Padding 边距
3. Spacing X 每个子节点的边距

## 滑动进度控件
[ScrollView组件](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/scrollview.html)

