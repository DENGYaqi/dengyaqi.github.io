# Deng Yaqi Personal Blog

This is Deng Yaqi's personal technical blog and portfolio site. It is generated with Jekyll and uses a Rajath-style portfolio structure.

## Language Strategy

The site generates four language prefixes:

- `/zh/` Chinese
- `/en/` English
- `/ja/` Japanese
- `/fr/` French

The UI, core pages, post titles, and post descriptions are managed through `_data/i18n.yml` and `_data/post_translations.yml`. Post bodies are currently maintained once in Chinese to keep long-form content maintainable. Legacy paths such as `/`, `/about/`, `/blog/`, `/resume/`, `/ai/`, and `/posts/.../` redirect to the Chinese-prefixed version.

## Project Structure

- `_posts/`: Chinese post bodies.
- `_data/i18n.yml`: navigation, buttons, page copy, and system text.
- `_data/post_translations.yml`: four-language post titles and descriptions.
- `_data/experience.yml`: career facts maintained with four-language fields.
- `_layouts/`: Jekyll page templates.
- `_includes/`: navigation, footer, head, and redirect snippets.
- `_plugins/i18n.rb`: multilingual page generator and Liquid filters.
- `assets/`: styles, scripts, and images.

## Local Preview

```powershell
bundle exec jekyll serve
```

If `bundle` is not available in the Windows PATH, run Jekyll through the local Ruby installation:

```powershell
& 'C:\Ruby33-x64\bin\ruby.exe' -rbundler/setup 'C:\Ruby33-x64\lib\ruby\gems\3.3.0\gems\jekyll-4.4.1\exe\jekyll' serve
```

The local preview is usually available at `http://127.0.0.1:4000/`.

## Build

```powershell
bundle exec jekyll build
```

The generated site is written to `_site/`.

## Deployment

Pushing to `main` triggers the GitHub Actions `Build and Deploy` workflow and publishes the site to GitHub Pages.

## Maintaining Translations

After adding a new post, add its filename key to `_data/post_translations.yml`, for example `2026-08-26-agent-harness-engine`. If translations are not ready, keep the Chinese fields first; templates fall back to Chinese.
