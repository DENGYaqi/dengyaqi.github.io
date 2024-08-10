---
title: 跟着大佬thmsgbrt构建Github主页 - Github Pages
date: 2024-08-02 10:07:51 +0800
categories: [Github, Tutorial]
tags: [github, github pages, markdown, chirpy, chirpy starter, jekyll]
description: thmsgbrt教程
pin: true
---
![thmsgbrt主页](/assets/img/github/thmsgbrt_homepage.webp){: .normal }
_thmsgbrt主页_

## 介绍
本文主要是通过实现thmsgbrt构建Github主页的教程时的理解。

教程主页 : [How to Create a Self-Updating README.md for Your GitHub Profile](https://medium.com/swlh/how-to-create-a-self-updating-readme-md-for-your-github-profile-f8b05744ca91)

项目仓库 : [thmsgbrt/thmsgbrt](https://github.com/thmsgbrt/thmsgbrt)

## 正文介绍
作者的教程主要是配置GitHub的主页和学习是如何使用GitHub Actions使主页动态化，例如自动获取天气信息之类的。
</br>
前面的一些内容主要是作者对项目的一些介绍，例如通过[Puppeteer](https://pptr.dev/)接口获取Instagram账户的信息，还有通过[OpenWeatherMap](https://openweathermap.org/api)获取天气信息、温度和日照时间等。

## 教程

### 创建存储库
创建一个与用户名相同的存储库。

### 项目准备
作者主要是使用[Mustache](https://www.npmjs.com/package/mustache)去创建模板，和更换标签。Mustache是一种没有逻辑的模板语法，称它为没有逻辑的模板，是因为它没有if语句、else子句和for循环，它只有标签。它通过使用散列或对象中提供的值在模板中展开标记来工作。

1. IDE我是使用GitHub的codespace，也就是VSCode
2. 如果本地没有js : [安装node.js](https://nodejs.org/zh-cn/download/package-manager)，我安装的版本是node v20.16.0 (npm v10.8.1)。
```bash
$ nvm install 20
```

### 创建npm项目

1. 在终端使用命令创建一个新的npm项目。
```bash
$ npm init
```
2. 填写项目信息，参考[npm文档](https://docs.npmjs.com/cli/v8/configuring-npm/package-json#license)。完成后若想修改信息可在package.json修改。

|关键词|中文描述|样例|
|:---|:---|:---|
|package name|项目名称|home_page|
|version|版本号|1.0.0|
|description|项目描述|GitHub HomePage|
|entry point|项目的入口文件|index.js|
|test command|项目启动时脚本命令|node index.js|
|git repository|git的仓库地址|https://github.com/DENGYaqi/DENGYaqi.git|
|keywords|项目关键词|github,readme|
|author|作者名字|DENGYaqi|
|license|发行项目证书|BSD-3-Clause|

### 使用Mustache

1. 使用Mustache，运行命令行后生成node-modules文件和package-lock.json文件。
- node_modules是安装node后用来存放用包管理工具下载安装的包的文件夹。比如webpack、gulp、grunt这些工具。
- package-lock.json文件的作用: a)记录模块与模块之间的依赖关系 b)锁定包的版本 c)记录项目所依赖第三方包的树状结构和包的下载地址，加快重新安装的下载速度。

```bash
$ npm i mustache
```

2. 创建mustache模板，打开main.mustache文件，填入最简单的: My name is {{name}} and today is {{date}}.

```bash
$ touch main.mustache
```

3. 通过Mustache生成ReadMe.md文件。

```bash
$ touch index.js
```

4. 在index.js文件内填入以下内容。修改name为你自己的名称，其他可看情况修改。

```javascript
// index.js
const Mustache = require('mustache');
const fs = require('fs');
const MUSTACHE_MAIN_DIR = './main.mustache';

/**
  * DATA is the object that contains all
  * the data to be provided to Mustache
  * Notice the "name" and "date" property.
*/
let DATA = {
  name: 'Thomas',
  date: new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'short',
    timeZone: 'Europe/Stockholm',
  }),
};

/**
  * A - We open 'main.mustache'
  * B - We ask Mustache to render our file with the data
  * C - We create a README.md file with the generated output
  */
function generateReadMe() {
  fs.readFile(MUSTACHE_MAIN_DIR, (err, data) =>  {
    if (err) throw err;
    const output = Mustache.render(data.toString(), DATA);
    fs.writeFileSync('README.md', output);
  });
}generateReadMe();
```

5. 在终端运行命令以生成ReadMe.md文件
```bash
$ node index.js
```