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

## 常用命令行

### 基础命令

|操作|命令|
|:---|:---|
|连接到 MySQL 数据库|mysql -u 用户名 -p|
|查看所有数据库|SHOW DATABASES;|
|选择一个数据库|USE 数据库名;|
|查看所有表|SHOW TABLES;|
|查看表结构|DESCRIBE 表名; 或 SHOW COLUMNS FROM 表名;|
|创建一个新数据库|CREATE DATABASE 数据库名;|
|删除一个数据库|DROP DATABASE 数据库名;|
|创建一个新表|CREATE TABLE 表名 (列名1 数据类型 [约束], 列名2 数据类型 [约束], ...);|
|删除一个表|DROP TABLE 表名;|
|插入数据|INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);|
|查询数据|SELECT 列1, 列2, ... FROM 表名 WHERE 条件;|
|更新数据|UPDATE 表名 SET 列1 = 值1, 列2 = 值2, ... WHERE 条件;|
|删除数据|DELETE FROM 表名 WHERE 条件;|
|创建用户|CREATE USER '用户名'@'主机' IDENTIFIED BY '密码';|
|授权用户|GRANT 权限 ON 数据库名.* TO '用户名'@'主机';|
|刷新权限|FLUSH PRIVILEGES;|
|查看当前用户|SELECT USER();|
|退出|MySQL EXIT;|

### 数据库相关命令

|操作|命令|
|:---|:---|
|创建数据库|CREATE DATABASE 数据库名;|
|删除数据库|DROP DATABASE 数据库名;|
|修改数据库编码格式和排序规则|ALTER DATABASE 数据库名 DEFAULT CHARACTER SET 编码格式 DEFAULT COLLATE 排序规则;|
|查看所有数据库|SHOW DATABASES;|
|查看数据库详细信息|SHOW CREATE DATABASE 数据库名;|
|选择数据库|USE 数据库名;|
|查看数据库的状态信息|SHOW STATUS;|
|查看数据库的错误信息|SHOW ERRORS;|
|查看数据库的警告信息|SHOW WARNINGS;|
|查看数据库的表|SHOW TABLES;|
|查看表的结构|DESC 表名;|
||DESCRIBE 表名;|
||SHOW COLUMNS FROM 表名;|
||EXPLAIN 表名;|
|创建表|CREATE TABLE 表名 (列名1 数据类型 [约束], 列名2 数据类型 [约束], ...);|
|删除表|DROP TABLE 表名;|
|修改表结构|ALTER TABLE 表名 ADD 列名 数据类型 [约束];|
||ALTER TABLE 表名 DROP 列名;|
||ALTER TABLE 表名 MODIFY 列名 数据类型 [约束];|
|查看表的创建|SQL	SHOW CREATE TABLE 表名;|

### 数据表相关命令

|操作|命令|
|:---|:---|
|创建表|CREATE TABLE 表名 (列名1 数据类型 [约束], 列名2 数据类型 [约束], ...);|
|删除表|DROP TABLE 表名;|
|修改表结构|添加列: ALTER TABLE 表名 ADD 列名 数据类型 [约束];|
||删除列: ALTER TABLE 表名 DROP 列名;|
||修改列: ALTER TABLE 表名 MODIFY 列名 数据类型 [约束];|
||重命名列: ALTER TABLE 表名 CHANGE 旧列名 新列名 数据类型 [约束];|
|查看表结构|DESC 表名;|
||DESCRIBE 表名;|
||SHOW COLUMNS FROM 表名;|
||EXPLAIN 表名;|
|查看表的创建|SQL	SHOW CREATE TABLE 表名;|
|查看表中的所有数据|SELECT * FROM 表名;|
|插入数据|INSERT INTO 表名 (列1, 列2, ...) VALUES (值1, 值2, ...);|
|更新数据|UPDATE 表名 SET 列1 = 值1, 列2 = 值2, ... WHERE 条件;|
|删除数据|DELETE FROM 表名 WHERE 条件;|
|查看表的索引|SHOW INDEX FROM 表名;|
|创建索引|CREATE INDEX 索引名 ON 表名 (列名);|
|删除索引|DROP INDEX 索引名 ON 表名;|
|查看表的约束|SHOW CREATE TABLE 表名; (约束信息会包含在创建表的 SQL 中)|
|查看表的统计信息|SHOW TABLE STATUS LIKE '表名';|

### 事务相关命令

|操作|命令|
|:---|:---|
|开始事务|START TRANSACTION; 或 BEGIN;|
|提交事务|COMMIT;|
|回滚事务|ROLLBACK;|
|查看当前事务的状态|SHOW ENGINE INNODB STATUS; (可查看 InnoDB 存储引擎的事务状态)|
|锁定表以进行事务操作|LOCK TABLES 表名 WRITE; 或 LOCK TABLES 表名 READ;|
|释放锁定的表|UNLOCK TABLES;|
|设置事务的隔离级别|SET TRANSACTION ISOLATION LEVEL READ COMMITTED;|
||SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;|
||SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;|
||SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;|

