---
title: 【学习篇】CocosCreator学习第三部分 - Cocos Creator
date: 2024-08-16 10:00:00 +0800
categories: [CocosCreator]
tags: [CocosCreator]
description: Cocos Creator进阶
pin: true
---

## 介绍
这部分笔记包含从视频p43至p85的内容。

## 音频播放
播放方式 : 基于组件与原生模式。
1. 创建节点 - 添加组件 - 其他组件 - AudioSource
2. 创建脚本 - 挂载脚本至节点 - 编写脚本

- AudioSource属性说明

|属性|说明|
|:---|:---|
|Clip|添加的用于播放的[音频资源](https://docs.cocos.com/creator/3.8/manual/zh/asset/audio.html)，默认为空，点击后面的箭头按钮即可选择|
|Loop|是否循环播放|
|PlayOnAwake|是否在游戏运行（组件激活）时自动播放音频|
|Volume|音量大小，范围在 0~1 之间|

- 脚本

```typescript
        // 1. 组件的方式
        // 从本身的节点获取音频
        let player: AudioSource = this.getComponent(AudioSource);
        // 加载音频
        resources.load("./audio", AudioClip, (res, clip) => {
            // 相当于将资源中的音频赋值到AudioSource组件的clip属性内
            player.clip = clip; 
            // 播放
            player.play();
            // 是否正在播放
            player.playing;
            // 暂停
            player.pause();
            // 恢复 : 如果音频处于暂停状态，则会继续播放音频。
            player.play();
            // 停止
            player.stop();
            // 循环播放
            player.loop = true;
            // 音量
            player.volume = 1;
        });

        // 2. 原生方式 : 2dx有AudioEngine，3dx没有
        cc.loader.loadRes("audio", AudioClip, (res, clip) => {
            // 播放
            let audioId : number = cc.audioEngine.playMusic(clip, true);
            // 是否正在播放
            cc.audioEngine.isMusicPlaying();
            // 暂停
            cc.audioEngine.pause(audioId); // 还有暂停所有音乐 暂停特效音乐 暂停背景音乐等
            // 恢复
            cc.audioEngine.resume(audioId); // 同上
            // 停止
            cc.audioEngine.stop(audioId); // 同上
            // 循环播放
            cc.audioEngine.setLoop(audioId, true);
            // 音量
            cc.audioEngine.setVolum(audioId, 1);
        });
```

## 物理系统
物理引擎，需要开启刚体Rigidbody，开启后节点会受到物理的影响、重力的影响。具体查看 : [物理系统API](https://docs.cocos.com/creator/3.8/api/zh/physics-system-readme)、[物理系统介绍](https://docs.cocos.com/creator/3.8/manual/zh/physics/)。

1. 节点挂载刚体组件 - 节点挂载对应脚本 - 编写脚本

```typescript

``` 
