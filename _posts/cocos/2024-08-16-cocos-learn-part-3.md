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
物理引擎，需要开启刚体Rigidbody，开启后节点会受到物理的影响、重力的影响。具体查看 : [2D刚体组件](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d-rigid-body.html)、[RigidBody2D API](https://docs.cocos.com/creator/3.8/api/zh/class/RigidBody2D)。

1. 开启物理系统 : 节点挂载刚体组件 - 节点挂载对应脚本 - 编写脚本

```typescript
    // 需要在onLoad()内编写
    protected onLoad(): void {
        PhysicsSystem2D.instance.enable = true;
    }
``` 

- 刚体属性说明

|属性|说明|理解|
|:---|:---|:---|
|Group|刚体的分组。通过 碰撞矩阵 可设置不同分组间碰撞的可能性|
|EnabledContactListener|开启监听碰撞回调|
|Bullet|这个刚体是否是一个快速移动的刚体，并且需要禁止穿过其他快速移动的刚体|有可能子弹快速穿过墙并没有触发墙的碰撞系统，因为每一帧的移动速度跟墙的检测不一样。上一帧还在墙前面 下一帧已穿过墙。所以需要勾选该选项|
|Type|刚体类型，默认Dynamic|
|AllowSleep|是否允许刚体休眠 物理配置中可调整休眠的临界值|可节省性能，减少计算量|
|GravityScale|重力缩放比例 仅对 Dynamic 类型的刚体生效|例如设置0.5可下坠慢一半|
|LinearDamping|移动速度衰减系数|设置0则无摩擦力，例如车与地面的摩擦力是正常的，0.5则比正常的摩擦力大一倍|
|AngularDamping|旋转速度衰减系数|类似转盘|
|LinearVelocity|移动速度 仅对 Dynamic 和 Kinematic 类型的刚体生效|例如往前飞，就设置x=10|
|AngularVelocity|旋转速度 仅对 Dynamic 和 Kinematic 类型的刚体生效|例如原地打转|
|FixedRotation|是否固定旋转|例如下坡 如果不设置就是滚下坡 设置就是固定方向下坡|
|AwakeOnLoad|加载完成后立刻唤醒刚体|永远参与物理计算|

- 刚体类型

|刚体类型|说明|理解|
|:---|:---|:---|
|Static|静态刚体，零质量，零速度，即不会受到重力或速度影响，但是可以设置他的位置来进行移动。该类型通常用于制作场景|
|Dynamic|动态刚体，有质量，可以设置速度，会受到重力影响。唯一可以通过 applyForce 和 applyTorque 等方法改变受力的刚体类型|会下坠，有重力影响|
|Kinematic|运动刚体，零质量，可以设置速度，不会受到重力的影响，但是可以设置速度来进行移动|不会下坠，可受到速度的影响，例如往右上飞出去|
|Animated|动画刚体，在上面已经提到过，从 Kinematic 衍生的类型，主要用于刚体与动画编辑结合使用|

2. 具体使用

```typescript

```