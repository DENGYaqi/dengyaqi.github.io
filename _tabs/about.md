---
layout: redirect
redirect_to: /zh/about/
order: 2
title: about
nav_title: 关于我
---

{% assign lang = page.lang | default: 'zh' %}
{% assign t = site.data.i18n[lang] %}

<section class="summary-section about-intro-section">
  <div class="container">
    <div class="summary-card fade-up">
      <p>{{ t.about.intro }}</p>
    </div>
  </div>
</section>

<section class="adventure-section">
  <div class="container">
    <article class="adventure-card fade-up">
      <div class="section-tag">{{ t.about.adventure_tag }}</div>
      <h2>{{ t.about.adventure_title }}</h2>
      <p>{{ t.about.adventure_intro }}</p>
      <img src="{{ '/assets/img/about/adventure-mountain.jpg' | relative_url }}" alt="{{ t.about.adventure_image_alt }}">
    </article>
  </div>
</section>

<section class="experience-section about-journey-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.about.journey_tag }}</div>
      <h2 class="section-title">{{ t.about.journey_title }}</h2>
    </div>
    <div class="timeline">
      {% for item in site.data.experience %}
        <article class="timeline-item fade-up">
          {% if site.experience_app_url != '' %}
            <a class="timeline-card" href="{{ site.experience_app_url }}/{{ lang }}/experiences/{{ item.key }}/" aria-label="{{ t.home.experience_more }} — {{ item.title[lang] | default: item.title.zh }}">
          {% else %}
            <div class="timeline-card">
          {% endif %}
            <div class="timeline-header">
              <div>
                <h3 class="timeline-title">{{ item.title[lang] | default: item.title.zh }}</h3>
                <p class="timeline-company">{{ item.company[lang] | default: item.company.zh }}</p>
              </div>
              <span class="timeline-date">{{ item.date[lang] | default: item.date }}</span>
            </div>
            <p class="timeline-summary">{{ item.summary[lang] | default: item.summary.zh }}</p>
            {% if site.experience_app_url != '' %}<span class="experience-more">{{ t.home.experience_more }} →</span>{% endif %}
          {% if site.experience_app_url != '' %}</a>{% else %}</div>{% endif %}
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="skills-section about-skills-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.about.ask_tag }}</div>
      <h2 class="section-title">{{ t.about.ask_title }}</h2>
    </div>
    <div class="skills-grid">
      {% for skill in t.home.skills %}
        <article class="skill-card fade-up">
          <h3>{{ skill.title }}</h3>
          <div class="tags">
            {% for tag in skill.tags %}
              <span class="tag">{{ tag }}</span>
            {% endfor %}
          </div>
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="experience-section about-credentials-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.about.credentials_tag }}</div>
      <h2 class="section-title">{{ t.about.credentials_title }}</h2>
    </div>
    <div class="cert-grid">
      {% for item in t.about.credentials %}
        <article class="cert-card fade-up">
          <span class="exp-tag">{{ item.status }}</span>
          <h3>{{ item.title }}</h3>
          <p>{{ item.issuer }}</p>
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="skills-section about-interests-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.about.interests_tag }}</div>
      <h2 class="section-title">{{ t.about.interests_title }}</h2>
    </div>
    <div class="cert-grid">
      {% for item in t.about.interests %}
        <article class="cert-card fade-up">
          <h3>{{ item.title }}</h3>
          <p>{{ item.desc }}</p>
        </article>
      {% endfor %}
    </div>
  </div>
</section>

<section class="summary-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.about.current_tag }}</div>
      <h2 class="section-title">{{ t.about.current_title }}</h2>
    </div>
    <div class="summary-card fade-up">
      {% for item in t.about.current_items %}
        {% for pair in item %}
          <p><strong>{{ pair[0] }}:</strong> {{ pair[1] }}</p>
        {% endfor %}
      {% endfor %}
    </div>
  </div>
</section>

<section class="contact-section">
  <div class="container">
    <div class="section-header fade-up">
      <div class="section-tag">{{ t.home.contact_tag }}</div>
      <h2 class="section-title">{{ t.home.contact_title }}</h2>
    </div>
    <div class="contact-grid">
      <a class="contact-card fade-up" href="mailto:{{ site.social.email }}"><h4>Email</h4><p>{{ site.social.email }}</p></a>
      <a class="contact-card fade-up" href="https://github.com/{{ site.github.username }}" target="_blank" rel="noopener"><h4>GitHub</h4><p>{{ site.github.username }}</p></a>
      <a class="contact-card fade-up" href="https://x.com/{{ site.twitter.username }}" target="_blank" rel="noopener"><h4>X</h4><p>@{{ site.twitter.username }}</p></a>
    </div>
  </div>
</section>
