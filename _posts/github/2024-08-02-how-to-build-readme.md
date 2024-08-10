---
title: 跟着大佬thmsgbrt构建Github主页 - Github Pages
date: 2024-08-02 10:07:51 +0800
categories: [Github, Tutorial]
tags: [github, github pages, markdown, chirpy, chirpy starter, jekyll]
description: thmsgbrt教程
pin: true
---

![thmsgbrt主页](/assets/img/github/thmsgbrt_homepage.webp){: lqip="/assets/img/github/thmsgbrt_homepage.webp"}

_thmsgbrt主页_

## 介绍
本文主要是通过实现thmsgbrt构建Github主页的教程时的理解。
</br>
教程主页 : [How to Create a Self-Updating README.md for Your GitHub Profile](https://medium.com/swlh/how-to-create-a-self-updating-readme-md-for-your-github-profile-f8b05744ca91)
</br>
项目仓库 : [thmsgbrt/thmsgbrt](https://github.com/thmsgbrt/thmsgbrt)

## 正文介绍
作者的教程主要是配置GitHub的主页和学习是如何使用GitHub Actions使主页动态化，例如自动获取天气信息之类的。
</br>
前面的一些内容主要是作者对项目的一些介绍，例如通过[Puppeteer](https://pptr.dev/)接口获取Instagram账户的信息，还有通过[OpenWeatherMap](https://openweathermap.org/api)获取天气信息、温度和日照时间等。

## 教程

### 创建存储库
创建一个与用户名相同的存储库。

### 本地启动的项目准备
作者主要是使用[Mustache](https://www.npmjs.com/package/mustache)去创建模板，和更换标签。Mustache是一种没有逻辑的模板语法，称它为没有逻辑的模板，是因为它没有if语句、else子句和for循环，它只有标签。它通过使用散列或对象中提供的值在模板中展开标记来工作。

1. 将版本库克隆到你的电脑，然后打开终端进入其目录，创建一个新的 npm项目。
```bash
npm init
```