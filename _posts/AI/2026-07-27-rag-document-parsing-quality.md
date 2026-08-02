---
title: RAG 文档解析链路：解析质量如何决定检索质量
date: 2026-07-27 15:55:00 +0800
categories: [AI, RAG]
tags: [rag, document-parsing, ocr, docling, retrieval, open-source]
description: 记录 RAG 入库前的文档解析、结构保留、切分验证和开源复现思路，解释为什么上游质量会直接影响检索与回答。
pin: true
---

## 问题从哪里开始

很多 RAG 问题表面上看是检索不准、召回不全、回答不稳定，但真正的源头经常在更前面：文档没有被正确解析。

如果 PDF 的标题层级丢了，表格被拆成一堆无上下文的文本，图片说明和正文混在一起，或者 OCR 把关键数字识别错了，那么后面的 chunk、embedding、rerank 和 prompt 都是在带着噪声工作。模型可能很强，但它读到的材料已经变形了。

所以我更愿意把 RAG 看成一条链路，而不是“一个向量库加一个大模型”：

1. 文档解析：把 PDF、Word、Markdown、图片、表格转换成可处理的结构。
2. 结构保留：保留标题、段落、列表、表格、图片说明、页码和来源。
3. 切分入库：根据结构和语义切 chunk，而不是只按固定长度切。
4. 检索排序：让 query 找到真正相关的结构化内容。
5. 回答生成：基于可追溯的上下文回答，而不是凭印象补全。

前两步如果质量不稳定，后面每一步都会被放大影响。

## 文档解析最容易丢的东西

实际工程里，最容易出问题的不是纯文本，而是带结构的内容。

### 表格

表头、跨行、跨列、单位、脚注、空单元格都会影响语义。如果表格被展开成没有行列关系的句子，检索时就很难知道某个数字属于哪个字段。

### 标题层级

标题决定了段落的上下文边界。如果 H2、H3 丢失，chunk 可能会把不同章节混在一起，导致检索结果看起来相关，但答案引用的是另一个主题。

### 图片与 OCR

流程图、架构图、扫描件和合同截图并不只是“图片”，它们里面可能有实体、关系、编号和条件。如果识别结果不带位置和来源，后续很难做溯源。

### Markdown 与 HTML

这两类输入看起来结构清晰，但嵌套列表、表格里的富文本、代码块、链接和标题序列化都可能出现边界问题。

## 我会怎样验证解析质量

我不太相信只看一个最终回答来判断 RAG 是否可靠。更稳的办法是把验证点前移。

1. 构造最小公开样本。样本不需要大，但要覆盖一个明确问题，比如“表格单元格里的标题导出 Markdown 后是否仍然是标题语义”，或者“跨页表格是否保留表头”。
2. 保存解析结果。不要只看入库后的 chunk，要单独看解析后的 Markdown、JSON 或结构化对象。这样可以判断问题到底发生在解析、切分、检索还是生成阶段。
3. 写可重复测试。测试最好能表达一个具体约束：标题导出后不能被吞掉，表格行列关系不能错位，图片说明不能混入相邻段落，chunk 必须保留来源页码或标题路径。
4. 保留失败证据。开源 PR 里最有说服力的不是“我修好了”，而是“这里有一个最小输入，修改前失败，修改后通过”。

## 开源贡献如何连接这条链路

这条链路自然连接到 Docling、RAG-Anything、LightRAG 这类项目。

**Docling** 关注文档转换和结构化表示，适合从 Markdown、PDF、Office、表格和导出格式的边界问题切入。第一阶段我会优先从小 issue 开始，不碰大架构，先做复现、测试和小修。

**RAG-Anything** 和 **LightRAG** 更接近多模态 RAG 和知识图谱检索，可以用来沉淀中文场景、图文混合样本和知识组织方式。这里更适合先写复现记录和最小样本，再决定是否提交 PR。

**Langfuse Python SDK** 则在另一侧：它关注 LLM 应用的观测、trace 和集成。RAG 链路变长以后，可观测性会变得很重要，因为我们需要知道一次回答到底用了哪些文档、哪些 chunk、哪些工具调用。

## 下一步

我会先把本地 Docling 环境跑通，再围绕一个明确 issue 做复现。每次贡献都尽量保留四样东西：最小样本、失败现象、修复思路、测试命令。

博客会继续记录这条路线。开源贡献不是为了把主页装饰得更好看，而是让真实工程经验慢慢变成公开、可验证、别人也能复用的知识。

## English Summary

Document parsing quality is an upstream reliability problem in RAG systems. If titles, tables, OCR text, and page-level structure are lost before chunking, retrieval and generation will amplify that noise. I plan to validate parsing quality with small public samples, saved intermediate outputs, repeatable tests, and open-source contribution notes.
