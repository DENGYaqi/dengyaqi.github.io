# 邓雅琪个人博客

这是邓雅琪的个人技术博客和作品集站点，使用 Jekyll 生成静态页面，并采用 Rajath 风格的 portfolio 页面结构。

## 语言策略

站点生成四种语言入口：

- `/zh/` 中文
- `/en/` English
- `/ja/` 日本語
- `/fr/` Français

全站 UI、核心页面、文章标题和摘要由 `_data/i18n.yml` 与 `_data/post_translations.yml` 管理。文章正文目前只维护中文一份，避免四份正文长期失控。正式文章地址使用 `/posts/YYYY/MM/DD/slug/`，四语入口使用 `/:lang/posts/YYYY/MM/DD/slug/`。旧地址如 `/`、`/about/`、`/blog/`、`/resume/`、`/posts/slug/`、`/:lang/posts/slug/` 会跳转到中文前缀或对应语言的新地址。

项目展示目前暂时隐藏，等待登录流程完成。恢复时将 `_config.yml` 中的 `show_projects` 设为 `true`，并移除 `_tabs/ai.md` 与 `_tabs/projects.md` 中的 `published: false`。

## 项目结构

- `_posts/`：中文文章正文。
- `_data/i18n.yml`：导航、按钮、页面文案和系统文案。
- `_data/post_translations.yml`：文章标题与摘要的四语翻译。
- `_data/experience.yml`：职业经历事实表，按四语字段维护。
- `_layouts/`：Jekyll 页面模板。
- `_includes/`：导航、页脚、head 和跳转片段。
- `_plugins/i18n.rb`：多语言页面生成器与 Liquid 过滤器。
- `assets/`：样式、脚本和图片资源。

## 本地预览

```powershell
bundle exec jekyll serve
```

如果 Windows PATH 找不到 `bundle`，可以使用本机 Ruby 直接运行：

```powershell
& 'C:\Ruby33-x64\bin\ruby.exe' -rbundler/setup 'C:\Ruby33-x64\lib\ruby\gems\3.3.0\gems\jekyll-4.4.1\exe\jekyll' serve
```

预览地址通常是 `http://127.0.0.1:4000/`。

## 构建

```powershell
bundle exec jekyll build
```

构建输出目录是 `_site/`。

发布前运行维护检查：

```powershell
ruby scripts/check-blog.rb
```

检查内容包括 front matter、翻译 key、重复 URL、图片引用、Liquid 示例泄漏和标签格式。标签统一使用小写短横线格式，例如 `github-actions`、`thread-pool`、`mysql`、`devops`。

Windows 本地运行 `htmlproofer` 时，如果 Ruby 的 `ethon/typhoeus` 报找不到 `libcurl.dll`，这是本机依赖问题；GitHub Actions 的 Ubuntu 构建仍会继续执行 `htmlproofer`。

## 部署

推送到 `main` 后由 GitHub Actions 的 `Build and Deploy` workflow 构建并部署到 GitHub Pages。

## 维护翻译

新增文章后，在 `_data/post_translations.yml` 增加对应文件名 key，例如 `2026-08-26-agent-harness-engine`。如果暂时没有翻译，可以先只填中文，模板会回退到中文标题和摘要。

使用 `scripts/new-ai-note.ps1` 创建 AI 日记时，脚本会输出 `_data/post_translations.yml` 的待补条目。
