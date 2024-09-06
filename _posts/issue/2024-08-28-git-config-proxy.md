---
title: 解决 http.proxy has multiple values问题
date: 2024-08-28 10:00:00 +0800
categories: [Issue]
tags: [Git]
description: Git issue resolve
pin: true
---

### 问题
因为VSCode无法同步内容，报错Git: fatal: unable to access 'xxx': Failed to connect to github.com port 443: Operation timed out，网上搜了解决方法，需要设置代理，或者说是开启了双重登录导致的，设置了代理 : `git config --global http.proxy socks5 127.0.0.1:7890`，发现问题无法解决。想要取消该设置 : `git config --global --unset http.proxy`，结果无法取消并显示 : warning: http.proxy has multiple values。

### 解决
1. 先找到gitconfig的配置文件位置 : `git config -l --show-origin | grep "proxy"`。
我的是这样的 : 
```text
file:/Users/xxx/.gitconfig	http.proxy=socks5
file:/Users/xxx/.gitconfig	http.proxy=socks5
```
2. 进入该路径 : `cd /Users/xxx/`，可以通过`ls -a`看到.gitconfig文件
3. 使用vim打开.gitconfig文件 : `vim .gitconfig`。
4. 删除http.proxy=socks5等不想要的配置，vim快捷键 : dd删除一行、:wq保存退出。

### 总结
其实是因为有多个代理，git不知道要删除哪个，所以显示警示了。以上仅为其中一种解决办法。删除所有代理后，VSCode的同步问题也解决了。



