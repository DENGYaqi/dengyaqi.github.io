---
layout: page
icon: fas fa-brain
order: 1
title: ai
---

这里是后续博客的主入口：AI 工程、RAG 文档解析、知识图谱和后端系统。旧文章会继续保留，新文章会逐步围绕这些方向沉淀。

## 内容主线

<div class="zero-track-grid">
  <a class="zero-track" href="{{ '/categories/ai/' | relative_url }}">
    <span>01</span>
    <h3>AI Engineering</h3>
    <p>LLM 应用后端、Agent 工作流、模型部署、可观测性和业务落地。</p>
  </a>
  <a class="zero-track" href="{{ '/tags/rag/' | relative_url }}">
    <span>02</span>
    <h3>RAG &amp; Document Parsing</h3>
    <p>文档解析、OCR、表格结构、chunk、检索排序和回答质量验证。</p>
  </a>
  <a class="zero-track" href="{{ '/tags/knowledge-graph/' | relative_url }}">
    <span>03</span>
    <h3>Knowledge Graph</h3>
    <p>本体论、实体关系、业务概念建模和结构化知识表达。</p>
  </a>
  <a class="zero-track" href="{{ '/categories/java/' | relative_url }}">
    <span>04</span>
    <h3>Backend Systems</h3>
    <p>Java、并发、JVM、数据库、消息队列和工程稳定性。</p>
  </a>
</div>

## 精选文章

{% for post in site.posts %}
  {% if post.categories contains 'AI' or post.tags contains 'rag' or post.tags contains 'knowledge-graph' %}
- {{ post.date | date: "%Y.%m.%d" }} · [{{ post.title }}]({{ post.url | relative_url }})
  {{ post.description }}
  {% endif %}
{% endfor %}
