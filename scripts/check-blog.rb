#!/usr/bin/env ruby
# frozen_string_literal: true

require 'date'
require 'find'
require 'pathname'
require 'yaml'

ROOT = Pathname.new(__dir__).parent.expand_path
POSTS_DIR = ROOT.join('_posts')
TRANSLATIONS = YAML.load_file(ROOT.join('_data/post_translations.yml')) || {}
LANGS = %w[zh en ja fr].freeze
TAG_RE = /\A[a-z0-9]+(?:-[a-z0-9]+)*\z/
ALLOWED_LEGACY_DUPES = {
  'jvm' => '2025-02-18-jvm'
}.freeze
BAD_CATEGORIES = {
  'Chaos Enginneering' => 'Chaos Engineering',
  'CocosCreator' => 'Cocos Creator',
  'Github' => 'GitHub',
  'markdown' => 'Markdown',
  'language' => 'Language'
}.freeze

errors = []
post_keys = []
new_urls = Hash.new { |hash, key| hash[key] = [] }
legacy_slugs = Hash.new { |hash, key| hash[key] = [] }

def post_files
  files = []
  Find.find(POSTS_DIR) do |path|
    files << Pathname.new(path) if File.file?(path) && File.extname(path) == '.md'
  end
  files
end

def front_matter(text)
  text[/\A---\s*\n(.*?)\n---/m, 1]
end

def body_without_front_matter(text)
  text.sub(/\A---\s*\n.*?\n---\s*/m, '')
end

def liquid_leaks(body)
  leaks = []
  raw = false

  body.each_line.with_index(1) do |line, line_no|
    if line.include?('{% raw %}') && line.include?('{% endraw %}')
      next
    elsif line.include?('{% raw %}')
      raw = true
      next
    elsif line.include?('{% endraw %}')
      raw = false
      next
    end

    leaks << line_no if !raw && (line.include?('{{') || line.include?('{%'))
  end

  leaks
end

def local_image_paths(body)
  body.scan(/!\[[^\]]*\]\(([^)]+)\)/).flatten.filter_map do |src|
    next if src.match?(%r{\Ahttps?://})

    src.split(/\s+/).first.to_s.sub(%r{\A/}, '')
  end
end

post_files.each do |path|
  rel = path.relative_path_from(ROOT).to_s.tr('\\', '/')
  key = path.basename('.md').to_s
  text = path.read(encoding: 'UTF-8')
  fm = front_matter(text)
  post_keys << key
  legacy_slug = key.sub(/\A\d{4}-\d{2}-\d{2}-/, '')
  legacy_slugs[legacy_slug] << key

  if key !~ /\A(\d{4})-(\d{2})-(\d{2})-(.+)\z/
    errors << "#{rel}: filename must be YYYY-MM-DD-slug.md"
  else
    year = Regexp.last_match(1)
    month = Regexp.last_match(2)
    day = Regexp.last_match(3)
    slug = Regexp.last_match(4)
    new_urls["/posts/#{year}/#{month}/#{day}/#{slug}/"] << rel
  end

  unless fm
    errors << "#{rel}: missing front matter"
    next
  end

  begin
    data = YAML.safe_load(fm, permitted_classes: [Date, Time], aliases: true) || {}
  rescue Psych::SyntaxError => e
    errors << "#{rel}: invalid front matter YAML: #{e.message}"
    next
  end

  %w[title date categories tags description].each do |field|
    errors << "#{rel}: missing #{field}" if data[field].nil?
  end

  Array(data['categories']).each do |category|
    errors << "#{rel}: category #{category.inspect} should be #{BAD_CATEGORIES[category].inspect}" if BAD_CATEGORIES.key?(category)
  end

  Array(data['tags']).each do |tag|
    errors << "#{rel}: tag #{tag.inspect} must be lowercase kebab-case" unless tag.match?(TAG_RE)
  end

  liquid_leaks(body_without_front_matter(text)).each do |line_no|
    errors << "#{rel}:#{line_no}: wrap Liquid-like examples in {% raw %}"
  end

  local_image_paths(text).each do |image_path|
    errors << "#{rel}: missing image #{image_path}" unless ROOT.join(image_path).exist?
  end
end

missing_translation_keys = post_keys - TRANSLATIONS.keys
extra_translation_keys = TRANSLATIONS.keys - post_keys
missing_translation_keys.each { |key| errors << "_data/post_translations.yml: missing #{key}" }
extra_translation_keys.each { |key| errors << "_data/post_translations.yml: extra #{key}" }

TRANSLATIONS.each do |key, value|
  %w[title description].each do |section|
    missing_langs = LANGS - (value.fetch(section, {}) || {}).keys
    errors << "_data/post_translations.yml: #{key}.#{section} missing #{missing_langs.join(', ')}" if missing_langs.any?
  end
end

new_urls.each do |url, files|
  errors << "duplicate new URL #{url}: #{files.join(', ')}" if files.size > 1
end

legacy_slugs.each do |slug, keys|
  next if keys.size == 1

  allowed = ALLOWED_LEGACY_DUPES[slug]
  if allowed && keys.include?(allowed)
    next
  end

  errors << "duplicate legacy slug #{slug}: #{keys.join(', ')}"
end

if errors.empty?
  puts "Blog check passed: #{post_keys.size} posts"
else
  warn errors.join("\n")
  exit 1
end
