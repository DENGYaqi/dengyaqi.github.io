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
物理引擎，之后游戏基本是用这个，之前的物理碰撞用的比较少，看情况。开启刚体Rigidbody，开启后节点会受到物理的影响、重力的影响。具体查看 : [2D刚体组件](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d-rigid-body.html)、[RigidBody2D API](https://docs.cocos.com/creator/3.8/api/zh/class/RigidBody2D)。

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
    start() {
        // 获取刚体
        let rbody = this.getComponent(RigidBody2D);
        // 赋予力 参数一force : x和y方向的力 单位牛，参数二point : 力给在物体的哪里 例如箱子上方还是下方 参数三 : 是否立刻运用
        rbody.applyForce(new Vec2(1000, 0), new Vec2(50, 100), true);
        // 赋予力2 中心一个力 更常用
        rbody.applyForceToCenter(new Vec2(1000, 0), true);

        // 速度 每秒多少像素 不用设置多大 匀速运动尽量用速度而不是力
        rbody.linearVelocity = new Vec2(500, 0);
    }

    // 碰撞的回调
    onBeginContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体开始接触时被调用一次
        console.log('发生碰撞');
        
        // 碰撞点 例如枪碰到墙会产生火花
        let points = contact.getWorldManifold().points;
        // 可能会多个点碰撞，但是基本都是只有一个点
        let point = points[0];

        // 法线 垂直于某个面的线 例如电线杆是地面的法线，这里的法线是从碰撞点出来的法线
        let normal = contact.getWorldManifold().normal;
    }

    onEndContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体结束接触时被调用一次
        console.log('结束碰撞');
    }

    onPreSolve (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 每次将要处理碰撞体接触逻辑时被调用
        console.log('onPreSolve');
    }

    onPostSolve (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 每次处理完碰撞体接触逻辑时被调用
        console.log('onPostSolve');
    }
```

3. 碰撞
若需要物理组件带有碰撞效果，则需要使用物理组件内的碰撞。
- Physics2D
    - RigidBody2D
    - Colliders
        - BoxCollider2D
        - CircleCollider2D
        - PolygonCollider2D
    - Joints

- 碰撞体属性说明

|刚体类型|说明|理解|
|:---|:---|:---|
|Editing|是否对碰撞组件进行编辑。勾选后可以在场景内编辑碰撞组件的位置、样式和大小。详情请参考下方 编辑碰撞组件|
|Tag|标签。当发生碰撞后，可根据 Tag 区分不同碰撞组件|
|Group|碰撞组件分组。通过 碰撞矩阵 可设置不同分组间碰撞的可能性|
|Sensor|指明碰撞组件是否为传感器类型，传感器类型的碰撞组件会产生碰撞回调，但是不会发生物理碰撞效果。(一般和rigidbody2d一起使用时，开启Enabled Contact Listener可以监听碰撞的回调事件。如：onBeginContact，onEndContact, 通过搜索文档可以了解如何监听这两个回调事件)|若勾选则从碰撞体变为传感器|
|Density|碰撞组件的密度，用于刚体的质量计算|
|Friction|碰撞组件摩擦力系数，碰撞组件接触时的运动会受到摩擦力影响|
|Restitution|碰撞组件的弹性系数，指明碰撞组件碰撞时是否会受到弹力影响|会弹起来|
|Offset|碰撞组件相对于节点中心的偏移|

### 传感器
在刚体里开启Sensor属性。若勾选该选项则从碰撞体变为传感器，变为传感器后，小鸟可穿过地面。onBeginContact，onEndContact回调方法会被调用，但是碰撞点和法线就没有了。这点很重要，若将图片透明化，则可以做类似踩雷敌人、隐藏宝箱之类的的触发机制。

### 射线

![射线](/assets/img/cocos/learn_part_3/radial.png){: width="300" height="300" }
_射线穿过一个刚体_

射线可以从两点之间打出一条线，可以得到这个线穿过的刚体，若穿过了，可以得到线穿过刚体和穿出刚体的点信息之类的。

![迷宫](/assets/img/cocos/learn_part_3/labyrinth.png){: width="300" height="300" }
_迷宫中左为玩家右为敌人_

- 射线的用处 : 例如上图需要给敌人做一个巡逻的逻辑，例如前方100米有刚体则180度转身，没有则继续前进巡逻。则只需给敌人上射线进行刚体检测即可。

```typescript
    protected onLoad(): void {
        PhysicsSystem2D.instance.enable = true;

        // 射线检测 注意 在3dx内是用世界坐标

        // 打出一条射线 
        // 前两个参数 : 从当前节点到新建的节点，例如当前节点为小鸟 新建节点为天空 
        // 第三个参数 射线的类型
        // ERaycast2DType.Any : 射线射到第一个刚体第一个碰到的点。检测射线路径上任意的碰撞体，一旦检测到任何碰撞体，将立刻结束检测其他的碰撞体，最快。
        // ERaycast2DType.Closest : 射线射到每个刚体第一个碰到的点。检测射线路径上最近的碰撞体，这是射线检测的默认值，稍慢。
        // ERaycast2DType.All : 射线射到所有刚体的点。检测射线路径上的所有碰撞体，检测到的结果顺序不是固定的。在这种检测类型下，一个碰撞体可能会返回多个结果，这是因为 Box2D 是通过检测夹具（fixture）来进行物体检测的，而一个碰撞体中可能由多个夹具（fixture）组成的，慢。
        // ERaycast2DType.AllClosest : 跟Closest差不多。检测射线路径上所有碰撞体，但是会对返回值进行删选，只返回每一个碰撞体距离射线起始点最近的那个点的相关信息，最慢。
        const results = PhysicsSystem2D.instance.raycast(this.node.getWorldPosition(), new Vec2(this.node.getWorldPosition().x, this.node.getWorldPosition().y + 100), ERaycast2DType.All, mask);
        
        for (const i = 0; i < results.length; i++) {
            const result = results[i];
            // 射线碰到的碰撞器 可以通过tag值判断射线碰到哪个碰撞器
            const collider = result.collider;
            // 射线碰到的点
            const point = result.point;
            // 射线碰到的法线
            const normal = result.normal;
            // 指定相交点在射线上的分数。
            const fraction = result.fraction;
        }
    }
```

### 射线练习
1. 使用单色节点新建两堵墙和单个玩家 
2. 在3dx需要给两堵墙添加rigidBody和boxBody两个组件
3. 新建脚本挂载到玩家上
4. 编写脚本

```typescript
    // 方向 向上正1 向下负1
    dir : Vec2 = v2(0, 1);

    protected onLoad(): void {
        // 开启物理引擎
        PhysicsSystem2D.instance.enable = true;
    }

    start() {

    }

    update(deltaTime: number) {
        // 移动
        this.node.setPosition(
            this.node.getPosition().x += this.dir.x * 100 * deltaTime, 
            this.node.getPosition().y += this.dir.y * 100 * deltaTime
        );

        // 射线检测 注意 在3dx内是用世界坐标
        const results = PhysicsSystem2D.instance.raycast(
            this.node.getWorldPosition(), 
            new Vec2(this.node.getWorldPosition().x, this.node.getWorldPosition().y + this.dir.y * 100), // x轴的第一个点跟玩家的x是一致的，所以是垂直的。y轴则是玩家纵轴的中心点 + 一个方向(向上/向下) + 检测的距离(也就是检测多远)。
            ERaycast2DType.Closest // 检测单点即可
        );

        console.debug("射线是否碰触" + results.length);

        // 若检测到刚体
        if(results.length > 0){
            this.dir.y *= -1; // 180度转向
        }
    }
```

## 动作系统
在3dx中action已过时了，使用tween，也就是[缓动系统](https://docs.cocos.com/creator/3.0/manual/zh/tween/)。淡入淡出，跳跃等动作用的是[Easing](https://docs.cocos.com/creator/3.0/api/zh/modules/tween.html#tweeneasing)执行。包括即时动作等概念也在里面。

如需查看2dx的动作系统作为对比，可点击[动作系统](https://docs.cocos.com/creator/2.4/manual/zh/scripting/actions.html)。

```typescript
        // 3dx的动作系统 : 缓动系统
        // 绝对位置移动 TO : 两秒从(300, 300)移动到(200, 200)
        const tw2 = new Tween(this.node) // 当前位置300, 300
            .to(2, { position: new Vec3(200, 200, 0) })
            .start();

        // 停止动作
        tw2.stop;
        // 遇到标签2就停止动作
        tw2.tag(2).stop;

        // 相对位置移动 BY : 两秒从(300, 300)移动到(300 + 200, 300 + 200)
        const tw3 = new Tween(this.node) // 当前位置300, 300
            .by(2, { position: new Vec3(200, 200, 0) })
            .start();

        // 常用动作 : 缩放、旋转、移动
        let scale = new Tween(this.node)
        .to(1, { scale: new Vec3(2, 2, 2) })

        let rotate = new Tween(this.node)
            .to(1, { rotation: new Quat(Math.sin(90), Math.sin(90), Math.sin(90), Math.cos(90)) })

        let move = new Tween(this.node)
            .to(1, { position: new Vec3(100, 100, 100) })

        // Easing使用方式 : 例如跳跃 .to(3, new Vec3(10, 10, 10), { easing: 'bounceInOut' })
```

### 容器动作
定义 : 也就是动作队列，一系列的动作，例如一秒消失再一秒出现。

3dx : 在3dx中使用缓动系统中的队列 : 也就是 then 插入一个 Tween 到缓动队列中。

动作执行序列 : 串行动作用then，并行动作使用union()，也就是将多个动作合并一起执行。

动作的回调 : 先执行动作后再执行回调函数内的代码，例如一个灯闪烁三次就爆炸。在3dx中新增了onStart、onUpdate、onComplete等属性，这些属性是回调函数，调用时会传入缓动的目标。

## 动画系统
3dx的[动画系统](https://docs.cocos.com/creator/3.8/manual/zh/animation/)。

1. 动画编辑 : 在对应节点添加Animation组件 - 一般选中play on load(加载场景就播放动画) - Default Clip右侧Creat添加动画 - 点击节点 - 在Default Clip点击选中新增/已有的动画 - 在动画编辑器中点击 - 进入动画编辑模式

2. 动画解析 : 
- 右侧时间轴 : 动画是一帧一帧组成的，滑动滚轮可以缩放时间轴，默认一秒60帧，在下方有采样帧率60和播放速度1。
- 左侧属性 : 给节点添加动画属性，例如移动、跳跃、变化等。
- 左下角WrapMode播放模式 : 有正向播放循环播放反向播放等等。

3. 左右移动样例 : 添加属性position - 插入关键帧 : 2dx右键点击属性插入关键帧/3dx点击空心菱形变为实心菱形 - 移动时间轴至1秒，也就是1-00  - 可以点击菱形，也可以直接在场景编辑器移动对应节点，会自动添加关键帧 - 点击动画编辑器的上方播放按钮则可看到动画效果

4. 滚动样例 : 添加属性rotation - 在时间轴0秒处添加关键帧 - 再在1秒处点击节点 - 改变rotation属性例如290 - 点击播放则可看到滚动动画。

5. 编辑多个动画 : 在动画编辑器新增动画，可以在clip切换动画进行编辑。

### 动画曲线与动画事件
1. 曲线 : 点击position属性 - 点击曲线 - 在右侧可以看到曲线预设库 - 曲线表示淡入淡出效果的选择。

2. 事件 : 创建脚本 - 挂载到带有动画组件的节点上 - 在动画编辑器内右键时间轴某个区域 - 新建帧事件 - 会生成一个闪电符号 - 双击闪电符号 - 可新增帧事件函数，表示在该帧执行什么函数逻辑 - 例如新增custom函数，如果函数有属性也可以添加属性等等 - 接下来即可到脚本文件内新增custom函数 - 进行脚本编写了.

### 人物跑步练习
1. 加载资源 : 人物跑步资源
2. 调整资源 : 拖拽run(1)至层级管理器 - 调整scale为3倍
3. 添加动画 : run(1)的属性检查器添加Animation属性 - 新建动画run.anim - 进入动画编辑模式
4. 跑图集 : 在属性编辑器添加Sprite.SpriteFrame属性 - 选中run(1)至run(8)图片 - 拖拽进属性列表右侧的时间轴内，会自动形成图集动画效果
5. 调整图集属性 : 当前1秒60帧有点跑太快 - 可以修改帧数为16帧(一般12帧或者8帧即可) - 并将播放模式设置为循环播放
6. 保存动画 : 场景编辑器内点击保存动画 - 关闭动画 - 即可在上方点击播放使用浏览器观看动画
7. 脚本 : 取消勾选play on load - 新增脚本 - 挂载脚本至run(1) - 编写脚本

```typescript
    start() {
        // 获取当前节点的动画组件
        let anim = this.getComponent(Animation);
        // 播放暂停重新播放动画
        anim.play("run");
        anim.pause();
        anim.stop();
        anim.resume();
    }
```

## 扑扇的小鸟Flappy Bird练习

- 循环滚动效果 : 两个背景循环播放 - 背景拼接 - 背景移动:设定移动速度与移动方向 - 出背景2后背景1宽度*2 - 背景与地面一样，所以同一脚本赋给地面节点和背景节点即可，只需修改速度与方向两个参数内容。

- 点击监听与跨脚本调用 : 在BgControl的start()添加屏幕点击监听 - 新增BirdControl面板变量 - 在面板将bird节点拖至该变量内，因为bird节点带有BirdControl组件，所以BgControl能使用BirdControl内的fly()方法。

- 碰撞添加 : 小鸟与地面、小鸟与管道 - 地面与管道添加RigidBody(static)与BoxCollider，小鸟添加RigidBody(重力0.5或更低)与CircleCollider - 参数调整 - 添加透明碰撞，检测小鸟是否穿过管道，穿过后加分之类的机制

- 管道循环与高度变化 : 与背景和地面的循环差不多，但是高度需要不断变化，所以新建脚本。

