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

1. 屏幕Canvas
3dx的[Canvas组件](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/canvas.html)介绍。Canvas代表屏幕、屏幕内的所有物体都会被Camera渲染出来。主要就是改动画布大小的时候需要在项目设置内修改。

2. Label : 文本，font字体

3. [富文本RichText](https://docs.cocos.com/creator/3.8/manual/zh/ui-system/components/editor/richtext.html) : 支持标签系统，

- 如果需要一段话内的某个字变成红色，则直接使用标签即可，例如

```html
<color=green>I'm green</color>
```

- 新建richtext节点 - 新建脚本挂载上节点 - 节点新增Richtext组件 - 组件内的Sring内添加以下标签内容 - 点击click me!文字则会调用handler函数

```html
<on click="handler"> click me! </on>
```

- 嵌套标签

- 图文混排 : 



