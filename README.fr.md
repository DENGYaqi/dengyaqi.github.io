# Blog personnel de Deng Yaqi

Ce dépôt contient le blog technique personnel et le site portfolio de Deng Yaqi. Le site est généré avec Jekyll et utilise une structure portfolio inspirée de Rajath.

## Stratégie multilingue

Le site génère quatre préfixes de langue :

- `/zh/` chinois
- `/en/` anglais
- `/ja/` japonais
- `/fr/` français

L'interface, les pages principales, les titres d'articles et les descriptions sont gérés dans `_data/i18n.yml` et `_data/post_translations.yml`. Les corps d'articles restent pour l'instant maintenus uniquement en chinois afin de garder le contenu long facile à maintenir. Les anciennes URL comme `/`, `/about/`, `/blog/`, `/resume/`, `/ai/` et `/posts/.../` redirigent vers la version chinoise.

## Structure du projet

- `_posts/` : corps des articles en chinois.
- `_data/i18n.yml` : navigation, boutons, textes de pages et textes système.
- `_data/post_translations.yml` : titres et descriptions d'articles en quatre langues.
- `_data/experience.yml` : faits de carrière avec champs multilingues.
- `_layouts/` : modèles de pages Jekyll.
- `_includes/` : navigation, pied de page, head et fragments de redirection.
- `_plugins/i18n.rb` : générateur multilingue et filtres Liquid.
- `assets/` : styles, scripts et images.

## Aperçu local

```powershell
bundle exec jekyll serve
```

Si `bundle` n'est pas disponible dans le PATH Windows, lancez Jekyll via l'installation Ruby locale :

```powershell
& 'C:\Ruby33-x64\bin\ruby.exe' -rbundler/setup 'C:\Ruby33-x64\lib\ruby\gems\3.3.0\gems\jekyll-4.4.1\exe\jekyll' serve
```

L'aperçu local est généralement disponible sur `http://127.0.0.1:4000/`.

## Build

```powershell
bundle exec jekyll build
```

Le site généré est écrit dans `_site/`.

## Déploiement

Un push sur `main` déclenche le workflow GitHub Actions `Build and Deploy`, puis publie le site sur GitHub Pages.

## Maintenir les traductions

Après l'ajout d'un article, ajoutez sa clé de fichier dans `_data/post_translations.yml`, par exemple `2026-08-26-agent-harness-engine`. Si les traductions ne sont pas encore prêtes, renseignez d'abord le chinois ; les modèles utiliseront cette version par défaut.
