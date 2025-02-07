---
title: MySQL安装流程(Mac)
date: 2024-12-30 10:00:00 +0800
categories: [MySQL]
tags: [MySQL]
description: MySQL安装Mac
pin: true
---

## 下载与安装流程

- [官网下载页面](https://www.mysql.com/downloads/)，点击`MySQL Community (GPL) Downloads`，社区版本免费
- Mac点击`MySQL Community Server`，windows点击`MySQL Installer for Windows`
- 选择`General Availability (GA) Releases`稳定发行的版本，arm(M1M2芯片)、x86(inter芯片)，DMG Archive
  - 未更新版本的可在`Archives`内查找相应版本

## 终端连接
```shell
PATH="$PATH":/usr/local/mysql/bin
mysql -u root -p
show databases;
```
