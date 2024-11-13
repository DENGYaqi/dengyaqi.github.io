---
title: SpringCloud搭建【1】- 项目选型
date: 2024-11-12 10:00:00 +0800
categories: [SpringCloud]
tags: [SpringCloud]
description: 业务方向、技术选型、Java后端、SpringCloud
pin: true
---

## 介绍
有时候想自己搭建一个项目，不管是为了学业，练技术还是找工作等等，但是又不知道该从何开始，可以看看这篇文章。

## 业务方向
首先选择项目的业务方向，例如本地生活、跨境电商、预订系统、音视频，具体可以从各大招聘平台去多刷想找的职位主要聚集在什么业务上，这样做出来的项目既可以为下份工作铺垫，又可以提前熟悉技术框架。

## 技术选型

### Spring Cloud原生
作为2024最火的云应用开发工具，毋庸置疑选择它。但是Spring Cloud包含了非常多的子项目和伞下项目，一起跟着[Spring官网的SpringCloud](https://spring.io/projects/spring-cloud)了解一下，

SpringCloud是基于SpringBoot之上的用来快速构建微服务系统的工具集，拥有功能完善的轻量级微服务组件，例如服务治理(Eureka)，声明式REST调用(Feign)，客户端负载均衡(Ribbon)，服务容错(Hystrix)，服务网关(Zuul)以及服务配置(Spring Cloud Config)，服务跟踪(Sleuth)等等。其特性包括 : 

- 分布式/版本化配置
- 服务注册和发现
- 路由
- 服务到服务的调用
- 负载均衡
- 短路器
- 全局锁
- 领导选举和集群状态
- 分布式消息传递

子项目包括 : 

- Spring Cloud Config : 配置管理开发工具包，可以让你把配置放到远程服务器，目前支持本地存储、Git以及Subversion。
- Spring Cloud Gateway : 基于Spring框架的API网关，Zuul的下一代。主要负责将客户端请求转发到后端微服务，同时实现一些高级功能，如负载均衡、安全认证和流量控制等。
- Spring Cloud Netflix : 是对Netflix开发的一套分布式服务框架的封装，包括Eureka(服务注册和发现)、Ribbon(提供客户端负责均衡功能)、Hystrix(熔断器)、Zuul(服务网关)、Gateway(Zuul的下一代，也是网关)
- Spring Cloud Consul : 基于Hashicorp Consul的服务治理组件。帮助在微服务架构中实现服务注册与发现、分布式配置管理和健康检查等功能。
- Spring Cloud Data Flow : 强大的数据流和批处理平台，集成了 Spring Cloud Stream 和 Spring Batch。





选型 : Config + GateWay
