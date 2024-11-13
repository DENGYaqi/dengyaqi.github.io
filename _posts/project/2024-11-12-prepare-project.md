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
  - Netflix Eureka：云端负载均衡，一个基于 REST 的服务，用于定位服务，以实现云端的负载均衡和中间层服务器的故障转移。
  - Netflix Hystrix：容错管理工具，旨在通过控制服务和第三方库的节点,从而对延迟和故障提供更强大的容错能力。
  - Netflix Zuul：边缘服务工具，是提供动态路由，监控，弹性，安全等的边缘服务。
  - Netflix Archaius：配置管理API，包含一系列配置管理API，提供动态类型化属性、线程安全配置操作、轮询框架、回调机制等功能。
- Spring Cloud Consul : 基于Hashicorp Consul的服务治理组件。帮助在微服务架构中实现服务注册与发现、分布式配置管理和健康检查等功能。
- Spring Cloud Data Flow : 强大的数据流和批处理平台，集成了 Spring Cloud Stream 和 Spring Batch。
- Spring Cloud Function : 旨在简化业务逻辑的开发，使其能够作为无服务器函数(Serverless Functions)执行，并与多种云环境和事件驱动架构集成。
- Spring Cloud Stream : 轻量级事件驱动微服务框架，用于快速构建可连接外部系统的应用程序。 使用 Kafka 或 RabbitMQ 在 Spring Boot 应用程序之间发送和接收消息的简单声明式模型。
- Spring Cloud Stream Applications : 基于 Spring Cloud Stream，通过与消息中间件的集成来处理事件数据，支持使用 Kafka 和 RabbitMQ 等消息代理进行消息传递。
- Spring Cloud Task : 短运行期微服务框架，用于快速构建执行有限数据处理的应用程序。
- Spring Cloud Task App Starters : 提供的一系列预构建的任务应用程序，每个 Task App Starter 都是一个独立的 Spring Boot 应用程序，用户可以直接使用这些 Starter，或者根据自己的需求自定义和扩展它们。
- Spring Cloud Zookeeper : 操作Zookeeper的工具包，用于使用zookeeper方式的服务注册和发现。
- Spring Cloud Contract : 提供的一个用于实现消费者驱动契约测试的框架，它使开发者可以在微服务之间建立并验证服务契约。
- Spring Cloud OpenFeign : 一个声明式 HTTP 客户端，它让开发者可以通过编写接口和注解，轻松地调用远程 HTTP 服务，隐藏了底层的 HTTP 请求构建过程。
- Spring Cloud Bus：事件、消息总线，用于在集群（例如，配置变化事件）中传播状态变化，可与Spring Cloud Config联合实现热部署。

- Spring Cloud for Cloud Foundry：通过Oauth2协议绑定服务到CloudFoundry，CloudFoundry是VMware推出的开源PaaS云平台。
- Spring Cloud Sleuth：日志收集工具包，封装了Dapper,Zipkin和HTrace操作。
- Spring Cloud Security：安全工具包，为你的应用程序添加安全控制，主要是指OAuth2。
- Spring Cloud CLI：基于 Spring Boot CLI，可以让你以命令行方式快速建立云组件。 

选型 : Config + GateWay + Bus
