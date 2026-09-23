# Deng Yaqi Blog

This repository hosts Deng Yaqi's personal technical blog and portfolio site.

Language-specific documentation:

- [中文](README.zh-CN.md)
- [English](README.en.md)
- [日本語](README.ja.md)
- [Français](README.fr.md)

The site is built with Jekyll. Source posts are maintained once in Chinese, while the site generates Chinese, English, Japanese, and French URL prefixes for navigation, core pages, post titles, and post descriptions.

Canonical post URLs use `/posts/YYYY/MM/DD/slug/`. Legacy `/posts/slug/` and `/:lang/posts/slug/` URLs are generated as redirects.

Run the local maintenance check before publishing:

```powershell
ruby scripts/check-blog.rb
```
