---
title: 【学习篇】CocosCreator学习第一部分 - TypeScript
date: 2024-08-07 20:14:51 +0800
categories: [CocosCreator]
tags: [CocosCreator, TypeScript]
description: TypeScript语法
pin: true
---

## 学习路径
跟着飞羽大神的课程学习 : [Cocos Creator零基础小白超神教程](https://www.bilibili.com/video/BV14i4y1o7YF/?spm_id_from=333.999.0.0&vd_source=7a96b0e57dd9994246f754e2a2d3ef5a)。这一篇主要是讲解TypeScript语法，从视频P1-P24。懂编程的朋友可以扫一眼从下一篇开始，或者实际写的时候回来参照一下语法即可。

## Cocos发展史
CocosCreator的诞生是为了将Cocos2D—x的纯代码编辑，分解成可视化，脚本化等特点，让更多新人轻松上手。CocosCreator是一个IDE，编程思想从面向对象变成了面向组件。支持JavaScript和TypeScript编程语言。

## TypeScript
JS的升级，包含JS的所有特性，区别主要在于TS包含a)强类型b)面相对象。可用[JS和TS在线语法对照](https://www.typescriptlang.org/play/?#code/PTAEiJrQ5+MU3NAYlUAqBPADgUwMoGMBOBLFAF1EBR7QYb9AudUBh-gKBFEE34wejNAAOUCo5QTb9ADeUAXjQbPlAaP6BMxSqAwJUDVcoBiVQGbagAzlEqTLgLFAIW6BFf0CbXoCAGGnTCAKg0D3yoFO5E4CDNQNBygSDlAs56BO00Dw+oH95QBSugYO1AWP-79oUAFpQdkBYOUAseUAWD0B5dUBvuUBVeUAcOUB-SNU5BXRsfCJQVUAGdXtdegCgtkBleUAYrLSlTOJAW+jAVZtANz1AODlAaojALrkJXPzfIvZXQDi5QGlbQFXo4MAYFUqMlVABQEXowHxzQHylQF+A1UBMm0BG710aLAB7ADsAZ2IAQ32AUQAPE4BbFAAbNAA1E-wTgCNH0ABeUAAiAASaHu912oAA6rscPcACZ-HYHQ67R4AOlBAHMABRnK63B7PV54D6PACUenopkAnQ6Ab8VAFBy9lUoEAOASALk9ANHygFwCUCANCNmYAG00A36kcqgmQBhcoBjyMAL2aALE1AM6K-RqgAAo1SAQ-lAPYG2nh9G5gFAAwAESoATNIYgGy5QAXNoApxIagBQ5QAA+oBpzTcVEALqZscgUVSANDlADKugF+EwB6Ov0uLo-EA)，边学习边操作。

### 变量与常量
```typescript
//变量
//声明变量 字母数字下划线 字母下划线 驼峰
let personName:string = "李逍遥110";
personName = "王小虎110";

//声明常量
const tmp:number = 111.1;

//输出语句
document.write(personName);
```

### 变量的类型
主要从第6个开始看。

```typescript
// 特殊值undefined: 声明变量未赋值
// let tmp: number;

// 特殊值null: 主动赋值为空
// let tmp: number = 3;
// tmp = null;

// 1. number
let num: number = 3;
document.write(num + "");

// 2. string
document.write("这个数字是" + num + "。");
// 这个string是模板字符串：‘${}’ 是一种模板字符串或模板字面量语法，用于在字符串中插入表达式或变量的值。
document.write(`这个数字
是。`);
document.write(`这个数字是${num}。`);

// 3. boolean，游戏中可做开关类型
let bool: boolean = false;
document.write(`这个布尔值是${bool}。`);

// 4. any，任何类型，跟JS一样，any重复赋值不同类型也不会报错
let anyType: any = false;
anyType = 3;
anyType = "dd";
document.write(`这个任何类型是${anyType}。`);

// 5. array数组：类型相同，含义相同，index从0开始
let array: number[] = [1,2,3,4,5,6,7,8,9,10];
let arrayEle: number = array[3];
let namesArray: string[] = ["王小虎", "李逍遥"];
document.write(`这个数组是${namesArray}。`);
document.write(`这个数组是${array[2]}。`);

// 6. 联合类型：一个变量支持多个类型，如下，既是number类型也是string类型
let concatType: number | string = 0;
concatType = "θ";

// 7. 枚举：自己定义一个属于自己的类型
enum ColorMine{
    red,
    blue,
    green
}
let color: ColorMine = ColorMine.green; // 颜色

enum State{
    idle,
    run,
    death,
    attack
}
let state: State = State.idle; // 玩家状态: 0站立 1跑步 2死亡 3攻击

// 8. 类型验证/类型判断：typeof
let x = 10;
//....
document.write(typeof x);
// 枚举类依然是用number类实现的
document.write(typeof color);

// 9.类型别名：给类型换个名字
type NewNumber = number;
let newNum : NewNumber = 3;
document.write(typeof newNum); // 输出还是number类型
```

### 运算符
```typescript
// 1. 算术运算符 : + - * / %
let num = 10 % 3;
document.write(num + "");

// 2. 自增/自减 : ++ --
let numInCre = 11;
num++;
// 注意符号前置和后置的区别
// 先使用，再自增 num++
document.write(num++ + ""); // 输出12
// 先自增，在使用 ++num
document.write(++num + ""); // 输出13

// 3. 比较运算符：> < >= <= ==(只判断内容) ===(即判断类型也判断内容) !=(只判断内容) !==(即判断类型也判断内容)，返回值一定是布尔值
num = 3;
let num2 = "3";
let res: boolean = num === num2;
document.write(res + "");

// 4. 逻辑运算符：&&(并且/逻辑与) ||(或者/逻辑或) !true/!false(逻辑非)，把单个比较运算符连接成多个。
res = num > 2 && num < 10; 
res = num > 10 || num < 5; 
res = !(num > 10);

// 5. 赋值运算符 = += -= *= /= %=，也就是自身与后面的值加减乘除。
let num: number = 3;
num += 3;
num = num + 3;
```

### 条件控制语句
```typescript
// 1. 判断语句
// age > 18
let age = 2;
if (age >= 18) {
    document.write("成年人");
} else {
    document.write("未成年人");
}

// 0-59 60-79 80-100
let score = 20;
if (score >= 0 && score < 60) { 
    document.write("不合格");
} else if (score >= 60 && score < 80) { 
    document.write("合格");
} else if (score >=80 && score <= 100) { 
    document.write("优秀");
} else {
    document.write("出错");
}

// 2. 三目运算符 条件？值1 ：值2;
let num = 105;
num = num > 100 ? 100 : num;

// 3. 选择结构语句/分支语句
enum State{
    idle, 
    run,
    attack,
    die
}
let state: State = State.idle;
switch (state) {
    case State.idle:
        document.write("站立"); 
        break;
    case State.run:
        document.write("跑步"); 
        break;
    case State.attack:
        document.write("攻击");
        break;
    default:
        document.write("其他状态");
}
```

### 循环控制语句
```typescript
// 1. whild do循环 0+1+2+...+100
let i: number = 0;
let num: number = 0;
while (i < 101) {
    num += i;
    i++;
}
document.write(num + "");

// 2. do whil循环
do {
    document.write("dowhile循环"); 
} while (i < 0);

// 3. for循环
let names: string[] = ["王小虎","李逍遥","赵灵儿"];
for (let j = 0; j < 3; j++){
    document.write(names[j]);
}
for (let tmpName of names) {
    document.write(tmpName);
}
// 输出索引
for (let index in names) {
    document.write(index);
}

// 4. 退出循环 break
```

### 函数

```typescript
//函数 流水线—>输入：参数 输出：返回值
// 1. 无返回值
function func(char1: string){
    let arr: string[] = ['a', 'b', 'c', 'd', 'e']; 
    for (let i = 0; i< 5; i++){
        if (char1 == arr[i]) {
            document.write("当前是第" + i +"个字符。");
        }
    }
}

func('a');
func('b');
func('c');

// 2. 带有返回值
function add(num1: number, num2: number): number{
    let num = num1 + num2;
    return num;
}

let test = add(3, 4);

// 3. 函数当变量使用
let add2 = function (num1: number, num2: number) : void{
    // ...
}
add2();

// 4.同上 只是function换成=>
let add3 = (num1: number, num2: number) : void => {
    // ...
}
add3();
```

### 类和对象: 面向过程编程向面向对象编程转变的过程
1. 面向过程编程以函数和过程为核心，数据和操作分离，适合简单任务。
2. 面向对象编程通过类和对象将数据与操作封装在一起，强调抽象、继承和多态，适合复杂系统。面向对象编程更具扩展性和维护性，代码复用性更强。

```typescript
// 1. 面向过程编程
// 说话
function say(name:string, age:number) {
    document.write("大家好，我叫" + name + "，今年" + age);
}

// 跑步
function run(name: string) {
    document.write(name + "正在跑步");
}

// 第一个人物
let aName: string = "令狐冲";
let aAge: number = 20;
let aScore: number = 80;
say(aName, aAge);

// 第二个人物
let bName: string = "岳不群"; 
let bAge: number = 40;
let bScore: number = 80; 
run(bName);

// 需要扩展的时候，需要更多的动作与更多的人物参数之类的，代码量多了之后，则容易报错

// 2. 面向对象 类和对象
// 类 : 模具，抽象，例如人
// 对象 : 存在的物体，例如小王

// 类创建
class Person{
    name: string = "默认";
    age: number = 0;

    say() {
    document.write(this.name);
    }
}

// 实例化对象
let a = new Person();
a.name = "令狐冲";
a.age = 20;
a.say();

let b = new Person();
b.name ="岳不群";
b.age = 40;
b.say();
```

### 构造与静态
```typescript
class Person{
    // 静态属性 : 不属于对象的
    static des : string; // 对于当前类的描述
    // 成员属性 : 属于对象的
    name: string = "默认";
    age: number = 0;

    // 构造方法
    constructor(name: string, age: number) { 
        this.name = name;
        this.age =age;
    }

    // 静态方法 : 不属于对象的
    static test(){
        // ...
    }

    // 成员方法 : 属于对象的
    say() {
        document.write(this.name);
    }
}
// 调用
Person.des = "a";
Person.test();
```

### 继承与抽象类
现在大部分语言都是单继承，也就是单父类-多子类。

```typescript
// 1. 普通继承类
// 父类
class Person{
    name: string = "";
    say(){
        document.write("我是人类，叫做" + this.name);
    }
}

// 子类
class Student extends Person{
    num: number = 0;
    score: number = 0;

    // 对父类say覆盖
    /*
    say() {
        document.write("我是学生，叫做" + this.name);
    }
    */

    // 对父类say扩展
    say() {
        super.say();
        document.write("我是学生，叫做" + this.name);
    }
}

// 创建子类对象
let student = new Student(); 
student.name ="aaa"; 
student.say();

// 2. 抽象类 : 抽象方法被继承必须被实现 本身不能被实例化为对象，可以被继承

// 抽象父类
abstract class PersonAB{

    // 一般属性与方法
    name: string = "";
    run(){
        // ...
    }

    // 抽象方法
    abstract say() : any;
}

// 子类
class StudentAB extends PersonAB{
    // 必须实现抽象方法
    say(){
        // ...
    }
}

// 3. 调用注意
// 父类指针可以指向子类对象
let per: PersonAB = new StudentAB();
per.say();
```

### 接口与属性扩展
弥补多继承。主要看第二点。
```typescript
// 1. 接口样例 : 人 狼 狼人：人，狼
class Person{
    name: string = "";
}

interface IWolff{
    attack() : any;
}

interface IDog{
    eat() : any;
}

class WolfMan extends Person implements IWolff, IDog{
    
    // IWolff方法
    attack(){
        //...
    }
    
    // Idog方法
    eat() {
        // ...
    }
}

// 2. 属性寄存器 getter setter 注意 加个_用于区分
class Person{
    _hp: number = 100;

    // 取值
    get hp() : number {
        return this._hp;
    }

    // 賦值
    set hp(value : number) {
        if (value < 0) {
            this._hp = 0; 
        } else {
            this._hp = value;
        }
    }
}

// 不建议的调用形式 : 调用带_，表示直接只用成员属性
let a = new Person();
a._hp -= 180;
document.write(a._hp + "");

// 建议的调用形式 : 调用不带_，表示使用getter setter
let b = new Person();
b.hp -= 180;
document.write(b.hp + "");
```

### 命名空间
为解决冲突存在的。代码有效域在命名空间内。
```typescript
// 原有问题
// A代码
class Person{
    name: string="";
}
// B代码
class Person{
    age: number=0;
}

// 解决方法1 : 命名前添加两个字母
// A代码
class AAPerson{
    name: string="";
}
// B代码
class BBPerson{
    age: number=0;
}

// 解决办法2 : 命名空间 namespace export
namespace aa{
    export class Person{
        name: string="";
    }
}

namespace bb{
    export class Person{
        age: number=0;
    }
}
// 调用
let personA = new aa.Person();
let personB = new bb.Person();
```

### 泛型
同一函数支持多种类型。
```typescript
// 方法一 : any 可能导致入参类型与出参类型不一致，不建议使用
function add(num: any): any{
    // 若类型相同则+1返回，否则返回自身
    if (typeof num == "number") { 
        num++;
        return num;
    }
    return num;
}
// 调用
document.write(add("3") + "");

// 方法二 : 泛型，建议使用
function add<T>(num: T): T{
    if (typeof num == "number") {
        num++;
        return num;
    }
    return num;
}
document.write(add<number>(3) + "");
```

### 集合 : 元祖数组字典
```typescript
// 元组 : 多返回值 多类型 可使用
let hero: [string, number] = ["超人", 100];
hero[0] = "蝙蝠侠";
document.write(hero[0]);

// 数组: 2种初始化方式
let array1: number[] = [1,2,3];
let array2: Array<number> = new Array<number>(); 
// 长度
document.write(array1.length + "");
// 在数组后面追加元素
array1.push(4);
// 在数组前面添加元素
array1.unshift(0);
// 删除最后面的元素
array1.pop();
// 从第几位开始删除几个: (第几个，一共删几个)
array1.splice(0, 1);
// 删除最前面的
array1.shift();
// 合并两个数组
array1 = array1.concat(array2);
//查找元素位置
let index = array1.indexOf(3); 
//排序 正序 倒序
array1.sort();
array1.reverse();

//数组["a","b","c"] 也是key value键值对 0:"a" 1:"b" 2:"c" 只是key是固定为number类型的 想自定义key类型可以使用字典

// 字典
// 初始化
let dic: { [key: string]: string } = { 
    "name":"王小虎",
    "name2": "李逍遥"
};
// 添加元素 不存在则直接添加
dic["name3"] = "令狐冲"
document.write(dic["name3"]);
```

### 回调
函数传参，将一个函数作为参数传递给另一个函数，并在该函数执行时调用传递的函数。回调函数可以是同步的，也可以是异步的。

```typescript
// 方法一 : 完整结构
function func(value: Function) { 
    //...
    value();
}

function test() {
    document.write("test");
}

func(test);

// 方法二 : 匿名函数
func(function () {
    document.write("test2");
});

// 方法三
func(() => {
    document.write("test3");
});
```

### 正则表达式
[正则表达式在线测试](https://tool.chinaz.com/regex)

#### 定义
1. 正则表达式 — 正则表达式使用单个字符串来描述、匹配一系列符合某个句法规则的字符串。在很多文本编辑器里，正则表达式通常被用来检索、替换那些符合某个模式的文本。(大白话 : 查找符合规则的字符)
2. 原义文本字符 — 正常的文本字符。
3. 元字符 — 具有特殊意义的专用字符，是代替正常文本字符的字符。(大白话 : 特殊符号)
4. 限定符 — 限定匹配的数量或特殊条件。(大白话 : 限定字符数量)

#### 常用元字符

|元字符|含义|解释|
|:---|:---|:---|
|.|匹配除换行符以外的任意字符|一个点一个字符|
|\w|匹配字母或数字或下划线或汉字|
|\s|匹配任意的空白符|
|\d|匹配数字|
|\b|匹配单词的开始或结束|
|^|匹配字符串的开始|
|$|匹配字符串的结束|

#### 常用限定符

|限定符|含义|
|:---|:---|
|{n}|重复n次|
|{n,}|重复大于等于n次|
|{n,m}|重复n次到m次|
|*|重复大于等于0次|
|+|重复大于等于1次|
|?|重复0次或1次|

#### 组合使用
```re
^...$ : 可用于账户密码

[a-z] : 小写字母

[A-Z] : 大写字母

[0-9] : 数字

[a-zA-Z0-9_] : 大小写字母数字与下划线

电话号码(前4位区号后7位号码)
a) 一般形式: \d\d\d\d-\d\d\d\d\d\d\d
b) 限定符: \d{4}-\d{7}

全数字：^[0—9]$

电话号：\d{3}—\d{8}|\d{4}—\d{7}

QQ号:[1-9][0-9]{4,}

账号(字母开头，5—16位，允许字母数字下划线): ^[a-zA-Z][a-zA-Z0-9_]{4,15}$
```

#### 代码使用
```typescript
let reg = /\d{4}-\d{7}/g; 
let str = "0345-1234567"; 
let res = reg.exec(str);
// 是否匹配成功
document.write(res.length + ""); // 匹配到则输出num 未匹配到则空
// 检测匹配到的内容
res.forEach(function (value, index){
    document.write(value + " " + index);
});
```

### 访问修饰符
```typescript
// 访问修饰符 public公开的 protected受保护的(当前类与子类) private私有的(当前类)
class Person{
    private _name: string;
    
    set name(value){
        this._name = value;
    }
    
    get name(){
        return this._name;
    }
}

class Student extends Person{ 
    constructor() {
        super(); 
        this.name;
    }
}

let a = new Person();
a.name;
```

### 单例模式
经典设计模式之一，保证一个类仅有一个实例，并提供一个全局访问点。一般管理类会使用。
```typescript
// 1. 饿汉式 : 类加载时就创建实例，线程安全且简单明了，但可能会创建过多而不使用的情况存在
class SoundManager{
    static Instance = new SoundManager();
    private constructor(){}
}
// 调用声音管理类
SoundManager.Instance; // 代表属性

// 2. 懒汉式 : 第一次使用时才创建实例，具有延迟加载/懒加载的特点，但需要考虑线程安全和性能问题
class SoundManager{
    private static instance : SoundManager;
    private constructor(){}

    static Instance(){
        // 当前单例是否产生
        if(!SoundManager.instance){
            SoundManager.instance = new SoundManager();
        }
        return SoundManager.instance;
    }
}
// 调用声音管理类
SoundManager.Instance(); // 代表方法
```

### 代理模式
通过引入一个代理对象来控制对原对象的访问。通过不同的代理人可以做出不同的效果。
```typescript
interface ICalc{
    calc(num1:number, num2:number): number;
}

class Npc1 implements ICalc{
    calc(num1:number, num2:number) {
        return num1 + num2;
    }
}

class Npc2 implements ICalc{
    calc(num1:number, num2:number) {
        return num1 - num2;
    }
}

class Person{
    //代理
    delegate: ICalc;
    //计算数字
    GetNum(num1:number,num2:number) {
        //拿到num1和2计算后的结果
        let num = this.delegate.calc(num1, num2);
        document.write(num + "");
    }
}

// 调用
let person = new Person(); 
// 设定一个代理 可以让不同的代理去做
// person.delegate = new Npc1(); 
person.delegate = new Npc2(); 
person.GetNum(3, 4);
```

### 观察者模式
一种一对多的依赖关系，当一个对象的状态发生改变时，其所有依赖者都会收到通知并自动更新。例如白天黑夜的更换。
```typescript
interface IObserver{
    nameChanged(newName:string):any;
}

class Person{
    private _name: string="";
    // 所有的观察者
    observers: Array<IObserver> = new Array<IObserver>();

    set name(value: string) { 
        this._name = value;
        // 发生变化
        // 遍历观察者数组，给所有的观察者发消息
        for (let observer of this.observers){
            observer.nameChanged(this._name);
        }
    }

    get name(){
        return this._name;
    }
}

class Test implements IObserver{
    nameChanged(newName: string){
        document.write("监听到变化，名字变为" + newName);
    }
}

// 调用
let person = new Person();
let test = new Test();
//设置为监听对象
person.observers.push(test);
person.name = "哈哈哈";
```

### 工厂模式
通过使用工厂模式，可以将对象的创建逻辑封装在一个工厂类中，而不是在客户端代码中直接实例化对象。
```typescript
enum CarType{
    Bmw,
    Audi,
    Benz
}

class Car{
    name: string="";
    // 工厂方法
    static Create(carType: CarType): Car {
        let car: Car;
        switch (carType) {
            case CarType.Audi:
                car = new Audi(); 
                break;
            case CarType.Benz:
                car = new Benz(); 
                break;
            case CarType.Bmw:
                car = new Bmw()
                break;
        }
        return car;
    }
}

// 子类
class Bmw extends Car{}
class Benz extends Car{}
class Audi extends Car{}

// 调用
let bmw = Car.Create(CarType.Bmw);
```

### 链表
```typescript
class Person{
    name: string;
    next: Person;

    constructor(name: string) {
        this.name = name;
    }
}

let person = new Person("李逍遥"); 
person.next = new Person("王小虎"); 
person.next.next = new Person("赵灵儿");

//删除
person.next = person.next.next; 
//添加
let tmpPerson = new Person("赵四儿"); 
tmpPerson.next = person.next;
person.next = tmpPerson;

while (person) {
    document.write(person.name);
    //让节点向后移
    person = person.next;
}
```