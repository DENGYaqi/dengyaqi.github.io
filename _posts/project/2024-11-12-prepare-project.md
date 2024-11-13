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

SpringCloud是基于SpringBoot之上的用来快速构建微服务系统的工具集，拥有功能完善的轻量级微服务组件，例如服务治理(Eureka),声明式REST调用(Feign),客户端负载均衡(Ribbon),服务容错(Hystrix),服务网关(Zuul)以及服务配置(Spring Cloud Config),服务跟踪(Sleuth)等等。其特性包括 : 

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

Spring Cloud Config：配置管理开发工具包，可以让你把配置放到远程服务器，目前支持本地存储、Git以及Subversion。

Spring Cloud Bus：事件、消息总线，用于在集群（例如，配置变化事件）中传播状态变化，可与Spring Cloud Config联合实现热部署。

Spring Cloud Netflix：针对多种Netflix组件提供的开发工具包，其中包括Eureka、Hystrix、Zuul、Archaius等。

Netflix Eureka：云端负载均衡，一个基于 REST 的服务，用于定位服务，以实现云端的负载均衡和中间层服务器的故障转移。

Netflix Hystrix：容错管理工具，旨在通过控制服务和第三方库的节点,从而对延迟和故障提供更强大的容错能力。

Netflix Zuul：边缘服务工具，是提供动态路由，监控，弹性，安全等的边缘服务。

Netflix Archaius：配置管理API，包含一系列配置管理API，提供动态类型化属性、线程安全配置操作、轮询框架、回调机制等功能。

Spring Cloud for Cloud Foundry：通过Oauth2协议绑定服务到CloudFoundry，CloudFoundry是VMware推出的开源PaaS云平台。

Spring Cloud Sleuth：日志收集工具包，封装了Dapper,Zipkin和HTrace操作。

Spring Cloud Data Flow：大数据操作工具，通过命令行方式操作数据流。

Spring Cloud Security：安全工具包，为你的应用程序添加安全控制，主要是指OAuth2。

Spring Cloud Consul：封装了Consul操作，consul是一个服务发现与配置工具，与Docker容器可以无缝集成。

Spring Cloud Zookeeper：操作Zookeeper的工具包，用于使用zookeeper方式的服务注册和发现。

Spring Cloud Stream：数据流操作开发包，封装了与Redis,Rabbit、Kafka等发送接收消息。

Spring Cloud CLI：基于 Spring Boot CLI，可以让你以命令行方式快速建立云组件。 
