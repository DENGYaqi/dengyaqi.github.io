---
title: 20分钟了解Git
date: 2024-08-20 10:00:00 +0800
categories: [Git]
tags: [Git]
description: Git基础
pin: true
---

## 介绍
该部分为了解Git基础，通过[Runoob.com](https://www.runoob.com/git/git-workspace-index-repo.html)、[廖雪峰的Git教程](https://liaoxuefeng.com/books/git/what-is-git/index.html)、[面试鸭](https://www.mianshiya.com/category/%E5%90%8E%E7%AB%AF)的Git基础面试题等内容进行汇总整理。旨在快速了解Git的主要概念，并且能在初级后端面试中用自己的话回答Git的基础概念，还有一些工作中常用的命令总结。

## 定义
Git是分布式版本控制系统，例如在线word文档每保存一次就有一个存档，也就是文件的版本控制。Git命令是为管理存档所产生的一系列操作，例如存储代码、跟踪修订历史记录、合并代码更改、恢复较早版本代码等。为完成这些操作Git诞生了<font color=red>3个工作区域、5种文件状态与分支</font>的主要概念。GitHub是管理这些存档的一个网站。Git和Github的关系，再来一个例子的话，就像车(Git)和车库(Github)的关系。

## 3个工作区域 
主要有工作区、暂存区、版本库这3个工作区域。还有2个常提到的概念，本地仓库与远程仓库。

1. 工作区(workspace) : 就是你在电脑里能看到的目录。

2. 暂存区(stage/index) : 一般存放在.git目录下的index文件(.git/index)中，所以我们把暂存区有时也叫作索引。

3. 版本库(Repository) : 工作区有一个隐藏目录.git，这个不算工作区，而是Git的版本库。创建Git版本库时，Git自动为我们创建了唯一一个master分支，时间线与Head指针，包含项目的所有版本历史记录。

*<font color=red>本地仓库</font>也就是你电脑带有.git文件的工作区，<font color=red>远程仓库</font>就是另一台电脑带有.git文件的工作区，一般来说就是Github网站的某个电脑。

### 操作流程

本地仓库 : 
创建工作区，在你电脑找一个存放项目的位置，完成后使用`git init`命令将工作区变成版本库，之后就可以在该工作区内做各种项目的修改，修改完成后通过`git add`命令将修改存入暂存区，类似于一个小保存，最后再通过`git commit`将一系列的小保存提交到本地Matser分支或者用`git checkout -b`创建分支，类似于一个大保存。

远程仓库 : 
远程仓库创建方式跟本地仓库差不多，一般在Github上界面操作一下即可。创建好之后回到本地仓库可以使用`git push`将本地分支推送到远程仓库的分支，`git merge`将两个分支合并，本地分支合并到远程分支后一般就没什么用了，可以用`git branch -d`删除该分支。

## 5种文件状态
Git的文件状态主要有以下几种，并且这几种状态是可以通过Git命令交换的。

1. 未追踪(Untracked) : 在工作区修改的，但是还没进行小保存的内容。也就是还没到暂存区内。可以通过`git add`存到暂存区，将状态变为Staged。为啥叫未追踪，其实就是Git不会对其进行管理和跟踪，相当于我们写了一堆论文断电就没了的内容。

2. 暂存(Staged) : 相当于小保存了，大保存时会带上这些内容。可以用`git commit` 进行大保存，也就是存入版本库。将状态修改为Unmodified状态。

3. 未修改(Unmodified)：这里的文件是会被Git管理和追踪的。这个状态也表示在上一次提交后没有被修改过。它们的内容与最后一次的提交版本一致。<font color=red>也就是说这些内容是最新的</font>。如果这里的文件进行修改，状态则会变为Modified。

4. 修改(Modified) : 这里的文件也是会被Git管理和追踪的，并且在上一次提交后被修改了。Git会对这些文件的修改进行检测和跟踪。

5. 忽略(Ignored): 这些文件被Git配置文件(.gitignore)明确指定为需要被忽略的文件，不会被添加到版本库中。

可以使用`git status`命令查看当前文件的状态。可以根据文件的状态，决定下一步的操作，如执行git add命令将文件从修改状态变为暂存状态，执行git commit命令将文件从暂存状态变为已提交状态等。

## 分支
分支主要涉及提交时间线、matser分支与Head指针这三个概念。为了方便理解，我将Master分支分为了Master的提交时间线与Master指针。其他分支也一样。

1. 时间线 : 每次提交，Git都把它们串成一条时间线，所以也可以叫做提交的时间线，最初的提交时间线也叫做Master分支。在创建版本库时Git会创建一个提交时间线、Master(分支和指针)和Head(指针)。
2. Master指针 : 指向Master分支最新的提交。
3. Head指针 : Head就是当前活跃分支的游标，也就是你现在在哪儿，HEAD就指向哪儿，所以Git才知道你在哪里。

### 一次提交的流程展示
一开始的时候，Git用master指针指向master分支的最新的提交，再用HEAD指针指向master指针，就能确定当前分支，以及当前分支的提交点：

![流程1](/assets/img/git/branch_1.png){: width="300" height="300" }
_流程1_

每次提交，master指针都会向前移动一步，这样不断提交，master分支的线也越来越长。

当我们创建新的分支dev时，Git新建了一个指针叫dev，指向master分支相同的提交，再把HEAD指向dev，就表示当前分支在dev上：

![流程2](/assets/img/git/branch_2.png){: width="300" height="300" }
_流程2_

你看，Git创建一个分支很快，因为除了增加一个dev指针，改改HEAD的指向，工作区的文件都没有任何变化！

不过，从现在开始，对工作区的修改和提交就是针对dev分支了，比如新提交一次后，dev指针往前移动一步，而master指针不变：

![流程3](/assets/img/git/branch_3.png){: width="300" height="300" }
_流程3_

假如我们在dev上的工作完成了，就可以把dev合并到master上。Git怎么合并呢？最简单的方法，就是直接把master指向dev的当前提交，就完成了合并：

![流程4](/assets/img/git/branch_4.png){: width="300" height="300" }
_流程4_

所以Git合并分支也很快！就改改指针，工作区内容也不变！

合并完分支后，甚至可以删除dev分支。删除dev分支就是把dev指针给删掉，删掉后，我们就剩下了一条master分支：

![流程5](/assets/img/git/branch_5.png){: width="300" height="300" }
_流程5_

总结一下就是，我们其实一直都在master分支上操作，只不过多了几个指针的加入，让Git性能更好。
1. 新建分支也就是新建一个指针指向某次提交。所谓基于某分支创建的分支，其实就是将新建的指针指向哪次提交。例如上述内容，是基于最新的提交创建的dev分支。
2. 通过修改Head指针的执行来确定当前活跃的分支，也就是继续建造master时间线的分支。
3. 建造完之后通过合并来移动master指针。也就是将master指针移至最新的提交。
4. 最后Head也会指向master指针。
其实就是通过Head来回指向的一种操作。

分支中还有两个概念是解决冲突和回滚。
- 解决冲突 : 就是两个人修改了相同位置的代码，但是修改内容不同，Git不知道要用谁的，需要你手动解决一下。例如有三个分支ABC，A是master分支，B是同事分支，C是你的分支，B先提交分支到A并合并了，之后是你C分支提交，Git发现你修改的内容跟同事是同一位置的代码，这时你就拉个会问一下同事讨论一下要哪个部分就行。Git用<<<<<<<，=======，>>>>>>>标记出不同分支的内容，我们修改后需要使用git add和git commit进行保存再提交。
- 回滚 : 就是回到某次提交。例如不小心删了某段重要代码或者误操作之类的。

## 其他
1. 标签 : 主要是给某一次提交打个标签，一般是比较重要时刻，例如发布节点(v1.0、v2.0)。

## 工作中常用的命令
- 在工作中，每天第一件事就是看情况拉取项目中matser的内容，避免太久没有拉取产生过多的冲突，过多冲突解决起来也是很耗时的。
- 新需求新分支，分支功能开发完成后，并在开发环境(dev)自测好了之后再让测试测一下，再推到测试环境(sit)合并到master分支。关于环境与迭代会在另外一篇文章内展开。

### 常用命令

```bash
git fetch : 拉取远端代码
git checkout -b <branchname> : 基于当前分支新建并切换分支
git merge --no-ff origin/master : 非快进模式合并分支
git merge --abort : 放弃本次合并
git reset <commit-id> : 回滚提交
```
*[快进模式Fast forward](https://liaoxuefeng.com/books/git/branch/policy/index.html) : 在这种模式下，删除分支后，会丢掉分支信息。不使用该模式时，Git就会在merge时生成一个新的commit，这样，从分支历史上就可以看出分支信息。

## 基础命令大全
```bash
git init                                                  # 初始化本地git仓库（创建新仓库）
git config --global user.name "xxx"                       # 配置用户名
git config --global user.email "xxx@xxx.com"              # 配置邮件
git clone git+ssh://git@192.168.53.168/VT.git             # clone远程仓库
git status                                                # 查看当前版本状态（是否修改）
git add xyz                                               # 添加xyz文件至index
git add .                                                 # 增加当前子目录下所有更改过的文件至index
git commit -m 'xxx'                                       # 提交
git commit --amend -m 'xxx'                               # 合并上一次提交（用于反复修改）
git commit -am 'xxx'                                      # 将add和commit合为一步
git rm xxx                                                # 删除index中的文件
git rm -r *                                               # 递归删除
git log                                                   # 显示提交日志
git log -1                                                # 显示1行日志 -n为n行
git log --stat                                            # 显示提交日志及相关变动文件
git show dfb02e6e4f2f7b573337763e5c0013802e392818         # 显示某个提交的详细内容
git show dfb02                                            # 可只用commitid的前几位
git tag                                                   # 显示已存在的tag
git tag -a v2.0 -m 'xxx'                                  # 增加v2.0的tag
git show v2.0                                             # 显示v2.0的日志及详细内容
git log v2.0                                              # 显示v2.0的日志
git diff                                                  # 显示所有未添加至index的变更
git diff --cached                                         # 显示所有已添加index但还未commit的变更
git diff HEAD^                                            # 比较与上一个版本的差异
git diff HEAD -- ./lib                                    # 比较与HEAD版本lib目录的差异
git diff origin/master..master                            # 比较远程分支master上有本地分支master上没有的
git diff origin/master..master --stat                     # 只显示差异的文件，不显示具体内容
git remote add origin git+ssh://git@192.168.53.168/VT.git # 增加远程定义（用于push/pull/fetch）
git branch                                                # 显示本地分支
git branch --contains 50089                               # 显示包含提交50089的分支
git branch -a                                             # 显示所有分支
git branch -r                                             # 显示所有原创分支
git branch --merged                                       # 显示所有已合并到当前分支的分支
git branch --no-merged                                    # 显示所有未合并到当前分支的分支
git checkout -b master_copy                               # 从当前分支创建新分支master_copy并检出
git checkout -b master master_copy                        # 上面的完整版
git checkout features/performance                         # 检出已存在的features/performance分支
git checkout --track hotfixes/BJVEP933                    # 检出远程分支hotfixes/BJVEP933并创建本地跟踪分支
git checkout v2.0                                         # 检出版本v2.0
git checkout -b devel origin/develop                      # 从远程分支develop创建新本地分支devel并检出
git checkout -- README                                    # 检出head版本的README文件（可用于修改错误回退）
git merge origin/master                                   # 合并远程master分支至当前分支
git cherry-pick ff44785404a8e                             # 合并提交ff44785404a8e的修改
git push origin master                                    # 将当前分支push到远程master分支
git push origin :hotfixes/BJVEP933                        # 删除远程仓库的hotfixes/BJVEP933分支
git push --tags                                           # 把所有tag推送到远程仓库
git fetch                                                 # 获取所有远程分支（不更新本地分支，另需merge）
git fetch --prune                                         # 获取所有原创分支并清除服务器上已删掉的分支
git pull origin master                                    # 获取远程分支master并merge到当前分支
git mv README README2                                     # 重命名文件README为README2
git reset --hard HEAD                                     # 将当前版本重置为HEAD（通常用于merge失败回退）
git branch -d hotfixes/BJVEP933                           # 删除分支hotfixes/BJVEP933（本分支修改已合并到其他分支）
git branch -D hotfixes/BJVEP933                           # 强制删除分支hotfixes/BJVEP933
git ls-files                                              # 列出git index包含的文件
git show-branch                                           # 图示当前分支历史
git show-branch --all                                     # 图示所有分支历史
git whatchanged                                           # 显示提交历史对应的文件修改
git revert dfb02e6e4f2f7b573337763e5c0013802e392818       # 撤销提交dfb02e6e4f2f7b573337763e5c0013802e392818
git ls-tree HEAD                                          # 内部命令：显示某个git对象
git rev-parse v2.0                                        # 内部命令：显示某个ref对于的SHA1 HASH
git reflog                                                # 显示所有提交，包括孤立节点
git show HEAD@{5}
git show master@{yesterday}                               # 显示master分支昨天的状态
git log --pretty=format:'%h %s' --graph                   # 图示提交日志
git show HEAD~3
git show -s --pretty=raw 2be7fcb476
git stash                                                 # 暂存当前修改，将所有至为HEAD状态
git stash list                                            # 查看所有暂存
git stash show -p stash@{0}                               # 参考第一次暂存
git stash apply stash@{0}                                 # 应用第一次暂存
git grep "delete from"                                    # 文件中搜索文本“delete from”
git grep -e '#define' --and -e SORT_DIRENT                
git gc                                                    # 触发垃圾回收器
git fsck
```
