module BlogI18n
  LANGS = %w[zh en ja fr].freeze
  HTML_LANG = {
    'zh' => 'zh-CN',
    'en' => 'en',
    'ja' => 'ja',
    'fr' => 'fr'
  }.freeze

  module_function

  def post_key(post)
    value = if post.respond_to?(:data)
              post.data['i18n_key'] || post.relative_path || post.path || post.url
            elsif post.respond_to?(:[])
              post['i18n_key'] || post['relative_path'] || post['path'] || post['url']
            else
              post.to_s
            end

    File.basename(value.to_s.tr('\\', '/'), '.*')
  end

  def translated(hash, lang, fallback = nil)
    return fallback unless hash

    if hash.respond_to?(:[])
      hash[lang] || hash['zh'] || fallback
    else
      fallback
    end
  end

  def post_translation(site, post)
    translations = site.data['post_translations'] || {}
    translations[post_key(post)] || {}
  end

  def localized_post_url(post, lang)
    url = post.respond_to?(:url) ? post.url : post['url']
    "/#{lang}#{url}"
  end

  def legacy_post_slug(post)
    post_key(post).sub(/\A\d{4}-\d{2}-\d{2}-/, '')
  end

  def legacy_post_url(post, lang = nil)
    path = "/posts/#{legacy_post_slug(post)}/"
    lang ? "/#{lang}#{path}" : path
  end

  def legacy_redirect_post(posts, slug)
    return posts.find { |post| post_key(post) == '2025-02-18-jvm' } if slug == 'jvm'

    posts.max_by { |post| post.date || Time.at(0) }
  end

  def lang_urls(path)
    LANGS.to_h do |lang|
      target = path == '/' ? "/#{lang}/" : "/#{lang}#{path}"
      [lang, target]
    end
  end
end

module BlogI18nFilters
  def i18n_value(value, lang)
    BlogI18n.translated(value, lang, value)
  end

  def i18n_post_key(post)
    BlogI18n.post_key(post)
  end

  def i18n_post_title(post, lang, translations)
    data = translations[BlogI18n.post_key(post)] || {}
    BlogI18n.translated(data['title'], lang, post['title'])
  end

  def i18n_post_description(post, lang, translations)
    data = translations[BlogI18n.post_key(post)] || {}
    fallback = post['description'] || post['excerpt']
    BlogI18n.translated(data['description'], lang, fallback)
  end

  def i18n_post_url(post, lang)
    BlogI18n.localized_post_url(post, lang)
  end
end

Liquid::Template.register_filter(BlogI18nFilters)

class LocalizedPage < Jekyll::PageWithoutAFile
  def initialize(site, dir, name, data, content = '')
    super(site, site.source, dir, name)
    self.data = data
    self.content = content
  end
end

class BlogI18nGenerator < Jekyll::Generator
  safe true
  priority :low

  def generate(site)
    add_legacy_post_redirects(site)

    BlogI18n::LANGS.each do |lang|
      add_home(site, lang)
      add_static_pages(site, lang)
      add_life_entries(site, lang)
      add_redirect_page(site, "/#{lang}/life/diving-diary/", "/#{lang}/life/sports-diary/#diving")
      add_redirect_page(site, "/#{lang}/resume/", '/assets/files/resume/deng-yaqi-ai-rd-resume.pdf')
      add_redirect_page(site, "/#{lang}/ai/", "/#{lang}/projects/") if site.config['show_projects']
      add_posts(site, lang)
      add_archives(site, lang)
    end
  end

  private

  def add_legacy_post_redirects(site)
    site.posts.docs.group_by { |post| BlogI18n.legacy_post_slug(post) }.each do |slug, posts|
      target_post = BlogI18n.legacy_redirect_post(posts, slug)
      next unless target_post

      add_redirect_page(site, BlogI18n.legacy_post_url(target_post), BlogI18n.localized_post_url(target_post, 'zh'))
      BlogI18n::LANGS.each do |lang|
        add_redirect_page(site, BlogI18n.legacy_post_url(target_post, lang), BlogI18n.localized_post_url(target_post, lang))
      end
    end
  end

  def add_redirect_page(site, path, target)
    site.pages << LocalizedPage.new(
      site,
      File.dirname(path).sub(%r{\A/}, ''),
      'index.html',
      {
        'layout' => 'redirect',
        'permalink' => path,
        'redirect_to' => target,
        'sitemap' => false
      }
    )
  end

  def add_home(site, lang)
    site.pages << LocalizedPage.new(
      site,
      lang,
      'index.html',
      page_data(
        site,
        lang,
        '/',
        'home',
        site.data.dig('i18n', lang, 'meta', 'home_title'),
        site.data.dig('i18n', lang, 'home', 'intro')
      )
    )
  end

  def add_static_pages(site, lang)
    about_doc = site.collections['tabs']&.docs&.find { |doc| doc.relative_path.end_with?('about.md') }

    pages = {
      'about' => ['about', about_doc&.content.to_s],
      'blog' => ['blog', ''],
      'categories' => ['categories', ''],
      'tags' => ['tags', ''],
      'archives' => ['archives', '']
    }

    pages['projects'] = ['projects', ''] if site.config['show_projects']

    pages.each do |slug, (layout, content)|
      title = site.data.dig('i18n', lang, 'meta', "#{slug}_title")
      desc = site.data.dig('i18n', lang, 'meta', "#{slug}_description") ||
             site.data.dig('i18n', lang, 'blog', 'description')
      site.pages << LocalizedPage.new(
        site,
        "#{lang}/#{slug}",
        'index.md',
        page_data(site, lang, "/#{slug}/", layout, title, desc),
        content
      )
    end
  end

  def add_posts(site, lang)
    site.posts.docs.each do |post|
      translation = BlogI18n.post_translation(site, post)
      data = post.data.merge(
        'layout' => 'post',
        'lang' => lang,
        'html_lang' => BlogI18n::HTML_LANG[lang],
        'permalink' => BlogI18n.localized_post_url(post, lang),
        'title' => BlogI18n.translated(translation['title'], lang, post.data['title']),
        'description' => BlogI18n.translated(translation['description'], lang, post.data['description']),
        'source_url' => post.url,
        'previous_post' => post.previous_doc,
        'next_post' => post.next_doc,
        'lang_urls' => BlogI18n.lang_urls(post.url)
      )

      site.pages << LocalizedPage.new(
        site,
        File.dirname(BlogI18n.localized_post_url(post, lang)).sub(%r{\A/}, ''),
        'index.md',
        data,
        post.content
      )
    end
  end

  def add_life_entries(site, lang)
    (site.data['life'] || []).each do |entry|
      path = "/life/#{entry['slug']}/"
      data = page_data(
        site, lang, path, 'life',
        BlogI18n.translated(entry['title'], lang),
        BlogI18n.translated(entry['summary'], lang)
      ).merge('life_entry' => entry, 'image' => entry['cover'])

      site.pages << LocalizedPage.new(site, "#{lang}/life/#{entry['slug']}", 'index.html', data)
    end
  end

  def add_archives(site, lang)
    site.categories.each_key do |name|
      slug = Jekyll::Utils.slugify(name)
      site.pages << LocalizedPage.new(
        site,
        "#{lang}/categories/#{slug}",
        'index.html',
        page_data(site, lang, "/categories/#{slug}/", 'category', name, site.data.dig('i18n', lang, 'blog', 'description')).merge('category' => name)
      )
    end

    site.tags.each_key do |name|
      slug = Jekyll::Utils.slugify(name)
      site.pages << LocalizedPage.new(
        site,
        "#{lang}/tags/#{slug}",
        'index.html',
        page_data(site, lang, "/tags/#{slug}/", 'tag', name, site.data.dig('i18n', lang, 'blog', 'description')).merge('tag' => name)
      )
    end
  end

  def page_data(site, lang, source_path, layout, title, description = nil)
    {
      'layout' => layout,
      'lang' => lang,
      'html_lang' => BlogI18n::HTML_LANG[lang],
      'title' => title,
      'nav_title' => title,
      'description' => description,
      'source_url' => source_path,
      'lang_urls' => BlogI18n.lang_urls(source_path)
    }
  end
end
