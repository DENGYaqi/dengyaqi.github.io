---
title: 如何快速构建Github个人博客 - Github Pages
date: 2024-08-06 10:00:00 +0800
categories: [Github]
tags: [github, github pages, markdown, chirpy, chirpy starter, jekyll] # TAG names should always be lowercase
description: 入门级快速搭建个人博客
pin: true
---

## 快速搭建
本文博客基于 [Chirpy Jekyll Theme](https://github.com/cotes2020/jekyll-theme-chirpy) 搭建。

### [Chirpy Starter](https://chirpy.cotes.page/posts/getting-started/)
官方推荐，可专注于写作，升级简单。
1. 进入项目地址：https://github.com/cotes2020/chirpy-starter
2. 点击右上角Use this template -> Create a new repository
3. 在Repository Name中填写username.github.io，username为github的用户名, 其他选项默认即可
4. 创建成功

### [Github Page](https://docs.github.com/zh/pages/quickstart)
一项静态站点托管服务, 它直接从GitHub上的仓库获取HTML、CSS和JavaScript文件, (可选)通过构建过程运行文件, 然后发布网站。
1. 回到仓库页
2. 点击上方Settings 
3. 左侧Code and automation -> Pages -> Build and deployment 的Source 选择 Github Actions, 意味着任何提交推送到分支都会触发Actions自动构建与部署。
4. 浏览页面: 同样在Pages内可点击Visit site浏览。

### [CodeSpace](https://docs.github.com/en/codespaces/getting-started/quickstart)
GitHub Codespaces 是一个基于云的即时开发环境，它使用容器为你提供用于开发的通用语言、工具和实用程序。
1. 回到仓库页
2. 绿色的Code -> Codespaces -> Create a codespaces on main
3. Codesace是Vscode的IDE，构建好后即可开始写作。
4. 写作完成后点击源代码管理 - 鼠标移至"更改"栏点击"+", 意味着将此次更改暂存至工作树
5. 在"消息"内填写此次更改的备注后点击提交 - 点击同步更改
6. 等待Actions自动构建与部署后，可在个人网站查看到更新内容

### 项目树结构
1. _config.yml：配置文件, 主要修改url, avatar, timezone和lang。其他内容可点击链接查看修改。
</br></br>
中文样例: 
</br> url为博客网址, 在仓库页的Pagers里可找到。例如: https://dengyaqi.github.io/
</br>avatar需要把图片上传到路径./asserts/img内后在配置文件的avatar标签中设置url路径，例如: https://dengyaqi.github.io/assets/img/avatar.jpg
</br>timezone: Asia/Shanghai, 配置内有链接可查找。
</br> lang: zh-CH, 首页中的关键词会自动翻译。

2. [_post](https://chirpy.cotes.page/posts/write-a-new-post/): 文章存放位置, 在该文件夹内新增格式为`YYYY-MM-DD-TITLE.md`的文档即可, 至于markdown语法建议边写边学, 不用专门学习, 例如可以对照[**代码版本**](https://github.com/cotes2020/jekyll-theme-chirpy/blob/master/_posts/2019-08-08-text-and-typography.md?plain=1)与[**网页版本**](https://chirpy.cotes.page/posts/text-and-typography/#paragraph)了解哪些语法对应哪些格式。

3. _data: 元数据, 例如用户信息，联系信息等。可创建一个[authors.yml](https://chirpy.cotes.page/posts/write-a-new-post/#author-information)用于配置用户信息, 这样可自动覆盖其他需要用户信息的配置，无须再手动配置。

### [GitHub Discussions](https://giscus.app/zh-CN)
利用 GitHub Discussions 实现的评论系统
1. 点击标题链接 - "仓库"栏内容完成 - 填写仓库名称
2. 填写完成后在"启动giscus"有相关信息
3. 在_config.yml找到giscus标签, 填入对应信息。

### 常见问题
1. 文章内链接只支持https确保安全，如需支持http浏览[该回答](https://github.com/orgs/community/discussions/25470)

### 其他
如需了解更多详细内容, 可直接浏览官网: https://chirpy.cotes.page/