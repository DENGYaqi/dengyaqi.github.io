---
title: 【学习篇】CocosCreator学习第一部分 - TypeScript语法
date: 2024-08-07 20:14:51 +0800
categories: [CocosCreator, Blogging]
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

### 继承
现在大部分语言都是单继承
```typescript

```