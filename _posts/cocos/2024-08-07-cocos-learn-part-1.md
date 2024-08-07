---
title: 【学习篇】CocosCreator学习第一部分 - TypeScript
date: 2024-08-07 10:14:51 +0800
categories: [CocosCreator, Blogging]
tags: [CocosCreator, TypeScript]
description: TypeScript
pin: true
---

## 学习路径
跟着飞羽大神的课程学习 : [Cocos Creator零基础小白超神教程](https://www.bilibili.com/video/BV14i4y1o7YF/?spm_id_from=333.999.0.0&vd_source=7a96b0e57dd9994246f754e2a2d3ef5a)。这一篇主要是讲解TypeScript语法，从视频P1-P24，会编程的朋友可以扫一眼从下一篇开始。

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


