---
title: 【学习篇】CocosCreator学习第二部分 - Cocos Creator
date: 2024-08-11 10:14:51 +0800
categories: [CocosCreator]
tags: [CocosCreator]
description: Cocos Creator基础
pin: true
---

## 介绍
飞羽教程使用的是Cocos 2dx和VS Code编辑器。这一篇主要是讲解Cocos的基本内容，从视频P25-P42，本文的cocos编辑器用的是3dx版本，有些函数过时了，可在[3.8的API文档](https://docs.cocos.com/creator/3.8/api/zh/)内查询到对应函数。

## 环境准备
Cocos Creator
1. 下载Cocos编辑器
2. 配置 : vs code IDE : 开发者 -> VS Code工作流 -> 更新VS Code智能提示数据

VS Code编辑器
1. 下载VS Code
2. 配置 : Code -> 首选项 -> 配置 -> 文本编译器 -> 文件 -> Exclude -> 添加模式 -> **/*.meta，因为每个文件都会生成这个文件。不排除就会有很多。

## 编辑器
官网编辑器界面功能介绍 : [编辑器界面](https://docs.cocos.com/creator/3.8/manual/zh/editor/)

A. 层级管理器([节点](#节点)) : 节点的层级关系。
- 2D对象节点/渲染节点 : 就是可以显示出来的节点，如精灵、粒子。
- UI节点 : 属于设计游戏界面的节点。如布局、进度条。

B. 属性检查器(组件) : 组件、有几个组件、组件的功能有哪些。
- position 位置 0,0点 = 锚点
- rotation 旋转 正数右旋转 负数左旋转。鼠标移动到rotation框左边左键单击拖动可以直接旋转调整。
- scale 缩放 按比例调整大小，默认1比1 例如x0.5则x轴缩一半。
- [anchor](#锚点与坐标系) 锚点 默认在组件中心点 0.5, 0.5
- size 按像素调整大小
- color 颜色 白色就是不用颜色 其他颜色是选择的颜色和图片的颜色混合。
- opacity 透明度 不透明则是255
- skew 倾斜度 负数左边倾斜 正数右边倾斜
- group 分组 例如飞机大战可以把飞机放到一组，子弹放到一组，再判断两组之间是否有碰撞。

C. 场景编辑器的按钮 : 
- 十字箭头(W) : 移动工具，拖拽可修改节点位置，对应position
- 循环箭头(E) : 旋转工具，拖拽可修改节点角度，对应rotation
- 大方块包含小方块(R) : 缩放工具，拖拽可修改节点缩放，对应scale
- 矩形(T) : 矩形变换工具，拖拽四边或四点可修改节点大小和位置，对应position、size和anchor
- 锚点位置 : 中心/起点
- 地球锚点 : 箭头朝向以世界坐标系/节点方向为准。

D. 资源管理器([资源](#资源)) : 资源、预设体，脚本。资源可以拖拽到层级内，会自动生成节点。
- [脚本](#脚本) : 每个组件就是一个脚本。

## Cocos编程思想([基本概念](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/))
面向组件的设计。
1. [Director导演](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/director.html) : 一个常见的Director的任务是控制场景替换和转换。 Director使用单例模式实现。例如播放声音、暂停、继续等等，对整个游戏进行统一管理的类。
2. [Scene场景](https://docs.cocos.com/cocos2d-x/manual/zh/basic_concepts/scene.html) : 导演的子类，一个游戏可分为不同的场景。
    - 可包含layer层。
    - 场景是被渲染器(renderer)画出来的。渲染器负责渲染精灵和其它的对象进入屏幕。
    - 场景图(Scene Graph)是一种安排场景内对象的数据结构，它把场景内所有的节点(Node)都包含在一个树(tree)上。
3. [Sprite精灵](#精灵的使用) : 场景的子类，每个场景可包含多个精灵Sprite。场景里所有一切的物体都是精灵，演员、背景、箱子、房子等等都是精灵。
    - 精灵和节点的区别？如果你能控制它，它才是一个精灵，如果无法控制，那就只是一个节点。
4. 节点Node : 可以挂载多个组件，挂什么组件就有什么功能。
5. 组件Component : 每个组件有不同的功能。

### 面向对象和面向组件的区别
- 面向对象 : 实现一个精灵的例子(继承) : 父类npc，子类商店老板和敌人，敌人的子类又有拿刀敌人、弓箭敌人、大Boss等等。

- 面向组件 : 在npc节点挂上卖东西的组件就等于商店老板，或者在npc组件挂上敌人的组件和刀的组件就是拿刀敌人。

## 锚点与坐标系

### 锚点
![组件与锚点位置](/assets/img/cocos/learn_part_2/anchor.png){: .normal }
_组件与锚点位置_

功能一 : 组件自带坐标，锚点默认在组件上的0.5, 0.5的位置上，假设节点是一张图片，若想将锚点放置于图片左下角，则锚点坐标为0, 0，右上角为1, 1，左上角0, 1，右下角1, 0。

功能二 : 旋转，以锚点旋转。

### 坐标系
- 世界坐标系 : 整个场景有一个默认的坐标系。
- 父节点坐标系 : 父节点的坐标。当父节点的坐标移动后，子节点也会跟着移动。
- 本地坐标系 : 若有父子节点，则子节点的坐标系(相对位置)。子节点的位置的计算，会以父节点的锚点来计算，可以把父节点的xy轴延长会更好理解。若无则是本身的节点的坐标。

## 精灵的使用
- Sprite Frame : UI渲染基础图形的容器，可指定一个图片，或拖动一个图片到该容器内。
- Type : 渲染模式，图片显示类型。3dx的图片编辑器在资源管理器点击对应图片 -> 属性检查器下滑 -> Edit。2dx在Sprite Frame右边有个编辑。
    - 普通(Simple)：修改尺寸会整体拉伸图像，适用于序列帧动画和普通图像。
    - 九宫格(Sliced) : 修改尺寸时四个角的区域不会拉伸，适用于UI按钮和面板背景，如对话气泡可做无损拉伸。
    - 平铺(Tiled) : 修改尺寸时会不断平铺原始大小的图片。如地面横向拉，可以无限延伸。
    - 填充(Filled) : 设置一定的填充起始位置和方向，能够以一定比率剪裁显示图片。如可以做血条。
        - Fill Type 填充方向，可以选择横向 Horizontal，纵向 Vertical 和扇形 Radial 三种方向
        - Fill Center 扇形填充时，指定扇形的中心点，取值范围 0～1
        - Fill Start 填充起始位置，输入一个 0～1 之间的小数表示起始位置的百分比
        - Fill Range 填充总量，取值范围 0～1 指定显示图像范围的百分比。可以做血条。
- Size Mode 指定 Sprite 所在节点的尺寸
    - CUSTOM 表示自定义尺寸, 如果有透明边框的图片可以在这里调整。
    - TRIMMED 表示取原始图片剪裁透明像素后的尺寸
    - RAW 表示取原始图片未剪裁的尺寸
- Trim 节点约束框内是否包括透明像素区域，勾选此项会去除节点约束框内的透明区域
- Sprite Atlas 图片资源所属的 Atlas 图集资源，例如加载一张图集大图，要使用里面哪个小图就挑哪个。

### 精灵的图集
1. 如何制作图集(把大量小图放到一个大图里)？
- 下载[TexturePacker](https://www.codeandweb.com/texturepacker/download)
- 把所有图片拖入左侧Sprintes 
- 右侧Framwork选cocos2d-x 
- 上方点Publish sprite sheet
- 选择路径保存
- 生成的plist是小图信息，xml形式保存

2. 如何导入图集
- 图片 + .plist 拖入assets内
- plist内可以选小图放到Sprite Frame内，Altas会自动选中plist

## 向量与标量
- 标量 : 只有大小的量，只跟数字有关系。如问几块钱，多少米？

- 向量 : 既有大小，也有方向。如问路，在我前方100米的地方。如何表示向量? 要表达向量(2,1)，表示从原点(0, 0)到(2,1)，带有方向的箭头。

- 向量的模 : 向量的大小。如问路，我的前方100米的地方，向量的模就是这个100米。

- 单位向量 : 大小为1的向量。

- 单位化，归一化 : 把向量转为单位向量的过程。因为向量的大小并不影响向量的方向。

### 向量的运算及意义
![向量的加法](/assets/img/cocos/learn_part_2/vector_add.png){: .normal }
_向量的加法，结果为AB向量的平行四边形的对角线_

- 加法 : A(x1, y1) + B(x2, y2) = x1 + x2, y1 + y2，例如向量A(1, 2) + 向量B(2, 1) = 向量C(3, 3)，向量C其实就是向量AB平行四边形的对角线。

![向量的加法](/assets/img/cocos/learn_part_2/vector_sub.png){: .normal }
_向量的减法，结果为AB向量的平行四边形的对边_

- 减法 : A(x1, y1) - B(x2, y2) = x1 - x2, y1 - y2，例如向量A(1, 2) + 向量B(2, 1) = 向量C(-1, 1)，也是平行四边形的对边。

- 乘法 : 
    - 向量*标量 : A(×1, y1) * 2 = x1 * 2, y1 * 2，就是大小延长了。
    - 点乘/点积 : A(x1, y1) . B(x2, y2) = x1 * x2 + y1 * y2 = 一个标量n。
    a) 为什么需要计算出这个标量n，因为这个标量n可以等于一个公式|A||B|cos&，这个&表示向量AB的夹角，点乘的意义就在于得到两个向量的夹角。
    b) 其次，两个向量的大小并不会影响夹角的大小，所以其实|A||B| = 1。所以最后的夹角公式只要反余弦一下就可以了，标量n = cos&，夹角& = n/cos。
    - 两个向量的夹角& = x1 * x2 + y1 * y2 -> n / cosin
    - 叉乘在2d游戏没什么意义所以先不说了。

## 脚本
每个组件都是一个脚本。资源管理器新增脚本文件后可以直接拖到属性检查器内变成精灵的组件。脚本必须挂载到一个节点/精灵上才会被执行，挂载到多个节点则会被多次执行。

2dx很多方法调用前需要使用命名空间cc.，但是3dx可以直接使用。例如通过路径查找节点，在2dx是cc.find()，在3dx则是find()。

```typescript
import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator; // 导入两个装饰器，ccclass和property

@ccclass('NewComponent') // 属性检查器内被识别为一个组件
export default class NewComponent extends Component {

    @property(Label) // 属性检查器面板显示 非基本类型加()
    label: Label = null;

    @property // 基本类型
    text: string = "hello";

    // LIFE - CYCLE CALLBACKS

    // 初始化调用 - 先
    protected onLoad(): void {}

    // 是否启用组件
    protected onEnable(): void {}

    // 初始化调用 - 后
    start() {}

    // 每帧调用
    update(deltaTime: number) {}

    // 每帧执行完后的收尾工作
    protected lateUpdate(dt: number): void {}

    // 是否启用组件
    protected onDisable(): void {}

    // 销毁时调用
    protected onDestroy(): void {}
}
```

### 脚本的组成
解释 : 
1. cc是cocos的命名空间。
2. Component属于cc内的类，必须要继承。
3. 必须添加@ccclass装饰符，才能在属性检查器内被识别为一个组件。
4. export default/export : 若有其他脚本想调用本脚本，必须要添加这两个关键字。
5. @property : 在属性检查器面板显示，并且可修改。优先使用面板的值，代码内的值为默认值。若不是基本类型则必须加括号@property()，括号内为面板显示的类型, 如label。
6. 若在层级管理器新建newLabel节点，可拖拽到组件面板属性内的label内。代码内的label内容则变成了newLabel节点的属性了。

动作 : 
1. 修改类的名称，与文件名称一致。

### 脚本生命周期
若有10个脚本，会每个脚本先执行onLoad()，再从第一个脚本继续执行start()。并不是一个脚本的生命周期都执行完才执行下一个脚本的。
1. LIFE - CYCLE CALLBACKS下面的函数是已存在的，编辑器会在适当的时候调用，即使默认生成不会显示，也会调用。
2. onLoad() : 初始化调用，脚本被创建即调用。
3. start() : 初始化调用，与onLoad的区别在于，例如枪和子弹的初始化，子弹必须要在枪之前初始化。
4. update(deltaTime: number) : 每帧调用。deltaTime表示每一帧的执行时间，也就是上一帧到下一帧的时间。
5. lateUpdate(dt: number) : 每帧执行完后的收尾工作。
6. onDestroy() : 销毁时调用
7. onEnable()与onDestroy()是一对, 可多次执行，是否启用某组件。在属性检查器-组件左边的勾勾。

## 节点
```typescript
import { _decorator, Component, find, Label, Node, quat, Sprite, UITransform, v2, v3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export default class NewComponent extends Component {

    @property(Label)
    label: Label = null;

    @property // 基本类型
    text: string = "hello";

    // LIFE - CYCLE CALLBACKS

    // 初始化调用 - 后
    start() {
        // 1. 节点的使用
        // 当前节点
        this.node; // 当前节点为Sprite
        this.node.removeFromParent; // 从父节点移除当前节点

        // 子节点
        this.node.children; // 数组 所有的子节点
        this.node.children[0]; // 获取第一个子节点
        this.node.getChildByName("abc"); // 通过名字获取子节点
        this.node.removeAllChildren(); // 移除所有子节点
        //this.node.removeChild(ddd); // 移除ddd子节点

        // 父节点
        this.node.getParent(); // 获取父节点
        this.node.setParent(null); // 设置父节点, null表示最外层
        //this.node.setParent(ddd); // 设置ddd为父节点, null表示最外层

        // 其他节点
        find("Cavas/Sprite") // 通过路径获取节点，例如获取同级节点的子节点
        
        // 2. 节点的属性
        // 访问位置
        this.node.position.x; // 2dx : this.node.x
        this.node.position.y; // 2dx : this.node.y
        this.node.setPosition(3, 4);
        this.node.setPosition(v3(3, 4)); // 2dx : this.node.setPosition(cc.v2(3, 4));
        this.node.setRotation(quat(1)); // 2dx : this.node.setRotation(cc.quat(1));
        this.node.setScale(v3(1, 2));
        // 2dx : this.node.color = cc.Color.RED; // 例如游戏角色死亡闪红一下再设置回来可用
        // ...
        
        // 节点开关
        this.node.active = false; // 关掉当前节点
        this.node.active = true; // 开启当前节点
        // 组件开关
        this.enabled = false; // 当前组件为NewComponent
        // 获取组件 获取失败皆为null
        let sprite = this.getComponent(Sprite); // 获取当前节点内的组件, 括号内填写的是组件类型
        sprite.enabled = false; // 关闭精灵组件
        let spriteS = this.getComponents(Sprite); // 获取当前节点内所有的精灵组件
        this.getComponentInChildren(Sprite); // 获取子节点内的精灵组件
        
        // 通过代码的方式创建节点和组件
        let node = new Node("new"); // 创建一个名为new的节点
        node.addComponent(Sprite); // 给节点node添加一个精灵组件
    }

    // 每帧调用
    update(deltaTime: number) {}
}
```

## 预设体
预设体的出现：例如当我们需要创建地面1、地面2、地面3，需要新建结点后将资源拖拽进结点的组件内，删除也要操作三次，修改组件属性也要三次等等，同种操作三次非常冗余。

预设体的生成 : 在创建节点设置好属性之类的，再拖拽回资源管理器。

预设体的使用 : 
1. 再拖拽回层级管理器，作为节点使用。
2. 在脚本内新建带有@property(Prefab)注解的变量，再把资源管理器内的prefab拖进组件的面板内进行关联。关联完后再在代码内实例化预设体之类的操作。

```typescript
import { _decorator, Component, instantiate, Node, Prefab, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {

    @property(Prefab)
    pre : Prefab = null;

    start() {
        // 关联完后
        // 实例化预设体
        let node = instantiate(this.pre);
        // 新的结点一定要设置一个父节点
        node.setParent(this.node); // 将新增节点作为当前节点的子节点。
    }

    update(deltaTime: number) {}
}
```

预设体的属性 : 在预设体的属性检查器内
- 更新资源 : 同步更新到所有相同预设体，有些属性不同步，例如位置缩放
- 取消关联当前的预制件资源 : 不再是预设体节点
- 保存预设体 : 修改默认的预设体。

与一般节点的区别 : 
- 预设体节点的颜色与一般节点的颜色不同。

## 资源

### [资源的动态加载](https://docs.cocos.com/creator/3.8/manual/zh/asset/dynamic-load-resources.html)
1. 在资源管理器内的asseerts文件下新增文件resources，命名不能更改。创建成功在属性检查器会生成各式属性与介绍。
2. 将图片放至resources文件内，图片放置到层级管理器内，点击图片节点，再将脚本拖拽至属性检查器内，将脚本变成图片的组件之一。
3. 编写脚本动态加载资源结构。
```typescript
import { _decorator, Component, instantiate, loader, Node, Prefab, resources, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Test')
export class Test extends Component {

    start() {
        // 从 v2.4 开始，loader等接口不再建议使用，建议用以下的方式。
        // 由于有可能动态加载的图片是网上的资源，例如 https://www.xxx.com/1.png
        // 所以 a) 因为网上资源可能耗时很久，所以并不是通过变量获取，而是通过回调函数异步获取。b) 代码1和代码2的执行顺序不定
        // function内的err为加载时的错误, 若无错误，sp为加载好的资源，可不指定类型，若需指定，可在function前指定类型，指定后所有加载完成的图片都为该类型。
        resources.load("test/land", String, function(err, sp){
            // ...代码1
        });
        // ...代码2
    }

    update(deltaTime: number) {}
}
```

4. 加载好的资源的使用
```typescript
        let self = this; // 若异步内获取不到则将获取不到的内容赋值到当前函数的作用域内
        // 加载 SpriteFrame，image是ImageAsset，spriteFrame是image/spriteFrame，texture是image/texture
        resources.load("test_assets/image/spriteFrame", SpriteFrame, (err, spriteFrame) => {
            self.node.getComponent(Sprite).spriteFrame = spriteFrame;
        });
        // 加载SpriteAtlas(图集)，并且获取其中的一个SpriteFrame
        // 注意 atlas资源文件(plist)通常会和一个同名的图片文件(png)放在一个目录下, 所以需要在第二个参数指定资源类型
        resources.load("test_assets/sheep", SpriteAtlas, (err, atlas) => {
            const frame = atlas.getSpriteFrame('sheep_down_0');
            sprite.spriteFrame = frame;
        });
```

## 场景管理
场景的切换，例如新手村到襄阳城的场景、打怪场景等等。

1. 新建场景 : 文件 -> 新建场景
2. 保存场景/重载场景 : 层级管理器更新为新的场景，新老场景都会在资源管理器显示，可双击打开
3. 切换场景 : 
```typescript
        // 1. 小资源加载方式
        // 2dx : 加个cc.在director前面即可
        // 3dx
        director.loadScene("scene_name", function(){
            //  当前已经加载到新的场景里了
        });

        // 2. 大资源加载方式
        director.preloadScene("scene_name", function(){
            // 这个场景加载到内存，还未使用
            
            // 使用场景
            director.loadScene("scene_name");
        });
```
4. 永久性节点 : 例如场景1的墙面跟场景2的墙面是一样的，那切换场景则希望不再重新加载相同资源，可以直接使用。
```typescript
        // 2dx
        cc.game.addPersistRootNode(this.node)
        cc.game.removePersistRootNode(this.node)
        // 3dx
        director.addPersistRootNode(this.node);
        director.removePersistRootNode(this.node)
```

## 键盘、鼠标、触摸与自定义事件
- [3.8.0事件系统](https://docs.cocos.com/creator/3.8/manual/zh/engine/event/)
- [Button API](https://docs.cocos.com/creator/3.8/api/zh/class/Button)介绍
- 自定义事件3 : 若中大型项目需要消息机制的情况，一般自己写一套，cocos的两套不是很好用。
```typescript
        // 鼠标监听
        // 开始监听 (监听事件名称Node.EventType, 监听函数内容)
        this.node.on(Node.EventType.MOUSE_DOWN, function(event: any){
            console.debug("鼠标按下啦" + event.getLocation());
            // 左右键判断
            if(event.getButton() == EventMouse.BUTTON_RIGHT){
                console.debug("右键");
            }
            if(event.getButton() == EventMouse.BUTTON_LEFT){
                console.debug("左键");
            }
        });
        // 可在onDestroy关闭监听
        this.node.off(Node.EventType.MOUSE_DOWN);

        // 键盘监听 2dx : systemEvent 3dx : input
        input.on(Input.EventType.KEY_DOWN, function(event){
            console.debug("ASCII码" + event.keyCode);
            // 判断按下的键 2dx : cc.macro.KEY.a 3dx : KeyCode.KEY_A
            if(event.keyCode == KeyCode.KEY_A){
                console.debug("按下了a");
            }
        })

        // 自定义事件1
        // 发送
        let self = this;
        this.node.on(Node.EventType.TOUCH_START, function(event: any){
            self.node.emit("自定义事件");
        });
        // 接收
        this.node.on("自定义事件", function(){
            console.debug("自定义事件触发");
        });

        // 自定义事件2
        // 发送
        this.node.on(Node.EventType.TOUCH_START, function(event: any){
            // 2dx : self.node.dispatchEvent(new cc.Event.EventCustom("自定义事件", true));
            // EventCustom中的true/false冒泡事件，是否冒泡给父节点 : 并不是第一接收类首先处理，而是消息先冒泡到最顶级父类再一层层往下开始处理消息。
        });
        // 接收
        this.node.on("自定义事件", function(){
            console.debug("自定义事件触发");
        });

        // 自定义事件3 : 若中大型项目需要消息机制的情况，一般自己写一套，上面两套不是很好用。
```

## 碰撞检测
只有在节点添加了碰撞组件才能使用碰撞系统。具体查看 : [物理系统API](https://docs.cocos.com/creator/3.8/api/zh/physics-system-readme)、[物理系统介绍](https://docs.cocos.com/creator/3.8/manual/zh/physics/)、[碰撞组件介绍](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d-collider.html)。
1. 添加组件 : 属性检查器 -> 添加组件 -> 搜索"Colliders"
2. 盒碰撞组件(BoxCollider2D) : 添加后周围有绿色线框，size绿线框宽高 offset绿线框偏移、edit是否允许手动调整绿线框、tag发生碰撞后可用标签判断哪个组件被哪个组件碰撞了。
3. 圆形碰撞组件(CircleCollider2D) : 同上
4. 多边形碰撞组件(PolygonCollider2D) : 同上
5. [3.8.0碰撞回调](https://docs.cocos.com/creator/3.8/manual/zh/physics-2d/physics-2d-contact-callback.html)
```typescript
@ccclass('TestContactCallBack')
export class TestContactCallBack extends Component {
    start () {
        // 注册单个碰撞体的回调函数
        let collider = this.getComponent(Collider2D);
        if (collider) {
            collider.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            collider.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            collider.on(Contact2DType.PRE_SOLVE, this.onPreSolve, this);
            collider.on(Contact2DType.POST_SOLVE, this.onPostSolve, this);
        }

        // 注册全局碰撞回调函数
        if (PhysicsSystem2D.instance) {
            PhysicsSystem2D.instance.on(Contact2DType.BEGIN_CONTACT, this.onBeginContact, this);
            PhysicsSystem2D.instance.on(Contact2DType.END_CONTACT, this.onEndContact, this);
            PhysicsSystem2D.instance.on(Contact2DType.PRE_SOLVE, this.onPreSolve, this);
            PhysicsSystem2D.instance.on(Contact2DType.POST_SOLVE, this.onPostSolve, this);
        }
    }
    onBeginContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体开始接触时被调用一次
        console.log('onBeginContact');
    }
    onEndContact (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 只在两个碰撞体结束接触时被调用一次
        console.log('onEndContact');
    }
    onPreSolve (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 每次将要处理碰撞体接触逻辑时被调用
        console.log('onPreSolve');
    }
    onPostSolve (selfCollider: Collider2D, otherCollider: Collider2D, contact: IPhysics2DContact | null) {
        // 每次处理完碰撞体接触逻辑时被调用
        console.log('onPostSolve');
    }
}
```

## Cocos Creator的一些缺点
1. 在代码内新增的结点无法在层级管理器同步，因为Cocos Creator是cocos的封装，所以有些功能无法完美。

## 2dx和3dx语法上的一些区别
1. 有些2dx方法在3dx过时了，或者想在2dx使用3dx的函数，基本都是2dx函数或变量前有cc.的前缀，只不过在3dx隐藏了，或者有些方法挪动函数位置了，例如addPersistRootNode()函数从game模块挪动到director模块内了。
2. 一般在对应版本的API里面也可以查到哪些函数过时，对应替换的是哪个函数。