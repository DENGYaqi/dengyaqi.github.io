---
layout: page
icon: fas fa-brain
order: 1
title: ai
---

这里是后续博客的主入口：从会用 AI，到理解 AI 核心能力，再到把 AI 做成可靠系统。旧的后端文章继续保留，新内容会围绕四条主线沉淀。

## 内容主线

<div class="zero-track-grid">
  <a class="zero-track" href="#ai-guide">
    <span>01</span>
    <h3>AI 使用入门</h3>
    <p>AI 是什么、模型 token、Codex、本机配置、CC-Switch、Skills 和常用工具。</p>
  </a>
  <a class="zero-track" href="#ai-core">
    <span>02</span>
    <h3>AI 核心能力</h3>
    <p>RAG、文档解析、OCR、知识图谱、检索、chunk 和回答质量验证。</p>
  </a>
  <a class="zero-track" href="#ai-engineering">
    <span>03</span>
    <h3>AI 工程化</h3>
    <p>Agent 工作流、模型服务、评测体系、可观测性、上下文工程、成本和稳定性。</p>
  </a>
  <a class="zero-track" href="{{ '/categories/java/' | relative_url }}">
    <span>04</span>
    <h3>Backend Systems</h3>
    <p>Java、并发、JVM、数据库、消息队列和工程稳定性。</p>
  </a>
</div>

## AI 使用入门 {#ai-guide}

**适合谁看**：会写代码，但还没有系统理解 AI 工具链、模型 token、本机配置和安全边界的人。

**先读什么**：先建立“AI 的大脑和身体”这张图，再进入模型账号、API key、Codex、Skills 和本机工具配置。

**后续文章计划**：

1. AI 是什么：大脑、身体和工具
2. 普通开发者如何开始使用 AI
3. 模型 token 是什么，应该去哪里获取
4. 如何在本机配置 OpenAI API Key
5. Codex 入门：桌面端、CLI 和 IDE 怎么选
6. AI 工具箱：CC-Switch、Skills、常用命令与安全边界

**资料来源约定**：OpenAI 相关教程以官方文档为准，包括 [Codex quickstart](https://developers.openai.com/codex/quickstart)、[Codex CLI](https://developers.openai.com/codex/cli)、[Codex IDE](https://developers.openai.com/codex/ide)、[Build skills](https://developers.openai.com/codex/build-skills)、[API quickstart](https://developers.openai.com/api/docs/quickstart) 和 [API authentication](https://developers.openai.com/api/reference/overview/)。CC-Switch、Skills.sh 这类工具会按第三方工具介绍，不写成官方能力。

**安全边界**：不把 token 写进代码，不提交到 GitHub，优先使用环境变量、本机密钥管理或工具自身的安全配置。

## AI 核心能力 {#ai-core}

**适合谁看**：已经会用模型，希望理解 RAG、文档解析、知识图谱和检索质量的人。

**先读什么**：

- [RAG 文档解析链路：解析质量如何决定检索质量]({{ '/posts/rag-document-parsing-quality/' | relative_url }})
- [博客重构路线：把知识记录变成 AI 工程作品集]({{ '/posts/knowledge-record-and-open-source-plan/' | relative_url }})

**后续文章计划**：围绕 OCR、表格结构、chunk、知识图谱、本体论、检索排序和回答质量验证继续展开。

## AI 工程化 {#ai-engineering}

**适合谁看**：希望把 AI 能力做成稳定产品或内部系统的人。

**先读什么**：先从评测和 trace 开始，再看 Agent 工作流、上下文工程、模型服务和成本稳定性。

**后续文章计划**：

1. AI 应用为什么需要评测
2. Agent 工作流不是堆工具调用
3. Langfuse 这类 trace 工具解决什么问题
4. 上下文工程：为什么不是把资料都塞进去
5. 模型服务的成本、延迟和稳定性取舍

## Backend Systems {#backend-systems}

**适合谁看**：希望把 AI 功能落到真实服务里，同时补齐后端工程能力的人。

**先读什么**：Java、并发、JVM、Kafka、Zookeeper、数据库和工程稳定性文章。

**后续文章计划**：保留现有后端文章，后续会把它们和 AI 系统里的缓存、消息队列、检索、权限、任务调度和可观测性连接起来。

## 已发布 AI 文章

{% for post in site.posts %}
  {% if post.categories contains 'AI' %}
- {{ post.date | date: "%Y.%m.%d" }} · [{{ post.title }}]({{ post.url | relative_url }})
  {{ post.description }}
  {% endif %}
{% endfor %}
