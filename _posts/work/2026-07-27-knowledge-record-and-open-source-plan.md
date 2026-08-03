---
title: 博客重构路线：从会用 AI 到可靠系统
date: 2026-07-27 09:40:00 +0800
categories: [AI, Guide]
tags: [ai-guide, ai-roadmap, ai, rag, knowledge-graph, engineering, portfolio]
description: 说明这个博客后续如何围绕 AI 使用入门、AI 核心能力、AI 工程化和后端系统持续更新，避免只变成零散笔记。
pin: true
---

## 为什么要重新整理

这个博客最早是我的技术学习笔记，里面有 Git、Java、Kafka、Zookeeper、Cocos、AI 训练师考试等内容。它们不需要被推翻，因为这些内容记录了我真实走过的技术路径。

接下来我希望把博客继续当成长期知识库来维护：先讲清楚 AI 怎么用，再讲 RAG、文档解析、知识图谱这些核心能力，最后沉淀 AI 工程化和后端系统里的真实判断。

开源贡献不是博客的全部，它只是其中一条实践线。更重要的是把我做过、理解过、踩过坑的知识整理成别人也能读懂、能复现、能继续追问的内容。

## 内容主线

后续内容会逐步收敛到四条线：

| 主线 | 记录内容 |
| --- | --- |
| AI 使用入门 | AI 是什么、NLP/CV/硬件、模型 token、Codex、API key、本机工具配置和安全边界 |
| AI 核心能力 | RAG、文档解析、OCR、知识图谱、检索、chunk 和回答质量验证 |
| AI 工程化 | Agent 工作流、模型服务、评测体系、可观测性、上下文工程、成本、延迟和稳定性 |
| Backend Systems | Java、并发、JVM、数据库、消息队列、风控中台和工程稳定性 |

旧文章会继续保留，新文章会优先补齐第一条线和第三条线：一条帮助读者真正开始使用 AI，一条解释 AI 应用如何进入可靠系统。

## 6 周执行节奏

1. 第 1 周：整理博客与 GitHub 的公开入口，让首页、AI 路线页和 GitHub 主页讲同一套内容结构。
2. 第 2 周：先写一篇 Codex 安装指南，让读者能在 Windows、macOS、Linux 和 WSL2 里把工具跑起来。
3. 第 3 周：补一篇 AI 使用入门文章，讲清楚 AI 的“大脑、身体和工具”，再连接 token、API key 和本机配置。
4. 第 4 周：写一篇 RAG 或文档解析相关的技术文章，尽量从实际工程问题出发。
5. 第 5 周：筛选 Docling、Langfuse、LlamaIndex、LangGraph、RAG-Anything 或 LightRAG 中适合入手的 issue，优先选择测试补充、文档示例、兼容性修复或文档解析边界问题。
6. 第 6 周：写一篇 AI 工程化复盘，记录评测、trace、上下文工程、模型服务或开源 PR 的问题背景、复现方式、测试命令和结果。

## 写作原则

我希望文章尽量满足几个条件：

- 来自真实学习或工程实践，不为了更新而更新。
- 尽量解释背景、问题和取舍，而不是只贴命令。
- 不使用公司代码、客户数据、密钥、内部截图或不可公开资料。
- 如果是开源贡献复盘，要写清楚复现、测试和结果。

## 下一步

第一篇实操文章先从 Codex 安装开始。因为对普通开发者来说，先把工具装起来、跑起来，后面的概念才不会悬空。

这条线会继续连接到 AI 基础概念、token、API key、CC-Switch、Skills 和本机工具配置。等读者能真正用起来以后，再进入 RAG 文档解析、知识图谱和 AI 工程化。

## English Summary

This blog will gradually become a public portfolio that starts with practical AI usage, then moves into RAG, document parsing, knowledge graphs, AI engineering, and backend systems. The goal is not to post for activity alone, but to turn real engineering work into clear, reusable, and verifiable writing.
