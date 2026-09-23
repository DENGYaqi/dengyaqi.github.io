# 鄧雅琪 個人ブログ

これは鄧雅琪の個人技術ブログ兼ポートフォリオサイトです。Jekyll で静的ページを生成し、Rajath 風の portfolio 構造を採用しています。

## 言語方針

サイトは 4 つの言語プレフィックスを生成します。

- `/zh/` 中国語
- `/en/` 英語
- `/ja/` 日本語
- `/fr/` フランス語

UI、主要ページ、記事タイトル、記事概要は `_data/i18n.yml` と `_data/post_translations.yml` で管理します。記事本文は現在、中国語 1 版のみを維持します。正式な記事 URL は `/posts/YYYY/MM/DD/slug/`、各言語版は `/:lang/posts/YYYY/MM/DD/slug/` です。`/`、`/about/`、`/blog/`、`/resume/`、`/posts/slug/`、`/:lang/posts/slug/` などの旧 URL は中国語または対応言語の新 URL へリダイレクトします。

ログイン機能の開発中、プロジェクトページは一時的に非公開です。再公開するには `_config.yml` の `show_projects` を `true` にし、`_tabs/ai.md` と `_tabs/projects.md` の `published: false` を削除します。

## プロジェクト構成

- `_posts/`: 中国語の記事本文。
- `_data/i18n.yml`: ナビゲーション、ボタン、ページ文言、システム文言。
- `_data/post_translations.yml`: 記事タイトルと概要の 4 言語翻訳。
- `_data/experience.yml`: 職務経歴の事実データ。4 言語フィールドで管理。
- `_layouts/`: Jekyll ページテンプレート。
- `_includes/`: ナビゲーション、フッター、head、リダイレクト片。
- `_plugins/i18n.rb`: 多言語ページ生成器と Liquid フィルター。
- `assets/`: スタイル、スクリプト、画像。

## ローカルプレビュー

```powershell
bundle exec jekyll serve
```

Windows の PATH で `bundle` が見つからない場合は、ローカル Ruby から直接実行します。

```powershell
& 'C:\Ruby33-x64\bin\ruby.exe' -rbundler/setup 'C:\Ruby33-x64\lib\ruby\gems\3.3.0\gems\jekyll-4.4.1\exe\jekyll' serve
```

通常、プレビュー URL は `http://127.0.0.1:4000/` です。

## ビルド

```powershell
bundle exec jekyll build
```

生成結果は `_site/` に出力されます。

公開前にメンテナンスチェックを実行します。

```powershell
ruby scripts/check-blog.rb
```

front matter、翻訳 key、重複 URL、画像パス、Liquid 風の例、タグ形式を確認します。タグは `github-actions`、`thread-pool`、`mysql`、`devops` のような小文字 kebab-case を使います。

Windows で `htmlproofer` が Ruby の `ethon/typhoeus` から `libcurl.dll` を見つけられず失敗する場合があります。GitHub Actions の Ubuntu ビルドでは引き続き `htmlproofer` を実行します。

## デプロイ

`main` に push すると GitHub Actions の `Build and Deploy` workflow が実行され、GitHub Pages に公開されます。

## 翻訳の保守

新しい記事を追加したら、`_data/post_translations.yml` にファイル名 key を追加します。例：`2026-08-26-agent-harness-engine`。翻訳が未完成の場合は、まず中国語だけ入れておけばテンプレートが中国語へフォールバックします。

`scripts/new-ai-note.ps1` で AI 日記を作成すると、追加すべき `_data/post_translations.yml` の項目が出力されます。
