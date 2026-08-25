---
layout: about
order: 2
title: about
nav_title: 关于我
---

<section class="summary-section about-intro-section">
  <div class="container">
    <div class="summary-card fade-up">
      <p>我是邓雅琪，目前负责 AI 研发方向规划、技术路线选型与项目交付推进。我的经历从 NLP、知识图谱和本体融合开始，随后进入 Android、Java 后端、风控中台和分布式系统，再回到企业级 AI 平台、RAG、Agent Workflow 和业务系统落地。</p>
    </div>
  </div>
</section>

<section class="experience-section about-journey-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">Journey</div>
      <h2 class="section-title">Career Journey</h2>
    </div>
    <div class="timeline">
      {% for item in site.data.experience %}
        <article class="timeline-item fade-up">
          <div class="timeline-card">
            <div class="timeline-header">
              <div>
                <h3 class="timeline-title">{{ item.title }}</h3>
                <p class="timeline-company">{{ item.company }}</p>
              </div>
              <span class="timeline-date">{{ item.date }}</span>
            </div>
            <p class="timeline-summary">{{ item.summary }}</p>
          </div>
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="skills-section about-skills-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">Focus</div>
      <h2 class="section-title">What I Work With</h2>
    </div>
    <div class="skills-grid">
      <article class="skill-card fade-up"><h3>AI Engineering</h3><div class="tags"><span class="tag">RAG</span><span class="tag">Agent Workflow</span><span class="tag">LangChain</span><span class="tag">LangGraph</span><span class="tag">MCP</span><span class="tag">Prompt Engineering</span></div></article>
      <article class="skill-card fade-up"><h3>Knowledge & Data</h3><div class="tags"><span class="tag">Knowledge Graph</span><span class="tag">Ontology</span><span class="tag">PgVector</span><span class="tag">Neo4j</span><span class="tag">ClickHouse</span><span class="tag">Redis</span></div></article>
      <article class="skill-card fade-up"><h3>Backend Systems</h3><div class="tags"><span class="tag">Java</span><span class="tag">SpringBoot</span><span class="tag">FastAPI</span><span class="tag">Django</span><span class="tag">Kafka</span><span class="tag">Elasticsearch</span></div></article>
      <article class="skill-card fade-up"><h3>Mobile & Frontend</h3><div class="tags"><span class="tag">Android</span><span class="tag">Kotlin</span><span class="tag">Vue 3</span><span class="tag">React</span><span class="tag">Chrome Extension</span><span class="tag">Vite</span></div></article>
    </div>
  </div>
</section>

<section class="contact-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">Contact</div>
      <h2 class="section-title">Let's Connect</h2>
    </div>
    <div class="contact-grid">
      <a class="contact-card fade-up" href="mailto:{{ site.social.email }}"><h4>Email</h4><p>{{ site.social.email }}</p></a>
      <a class="contact-card fade-up" href="https://github.com/{{ site.github.username }}" target="_blank" rel="noopener"><h4>GitHub</h4><p>{{ site.github.username }}</p></a>
      <a class="contact-card fade-up" href="https://x.com/{{ site.twitter.username }}" target="_blank" rel="noopener"><h4>X</h4><p>@{{ site.twitter.username }}</p></a>
    </div>
  </div>
</section>
