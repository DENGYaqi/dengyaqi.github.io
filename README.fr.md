# Blog personnel de Deng Yaqi

Ce dépôt contient le blog technique personnel et le site portfolio de Deng Yaqi. Le site est généré avec Jekyll et utilise une structure portfolio inspirée de Rajath.

## Stratégie multilingue

Le site génère quatre préfixes de langue :

- `/zh/` chinois
- `/en/` anglais
- `/ja/` japonais
- `/fr/` français

L'interface, les pages principales, les titres d'articles et les descriptions sont gérés dans `_data/i18n.yml` et `_data/post_translations.yml`. Les corps d'articles restent pour l'instant maintenus uniquement en chinois afin de garder le contenu long facile à maintenir. Les URL canoniques des articles utilisent `/posts/YYYY/MM/DD/slug/`, avec les versions localisées sous `/:lang/posts/YYYY/MM/DD/slug/`. Les anciennes URL comme `/`, `/about/`, `/blog/`, `/resume/`, `/posts/slug/` et `/:lang/posts/slug/` redirigent vers la version chinoise ou localisée correspondante.

La page des projets est temporairement masquée pendant le développement de la connexion. Pour la rétablir, définir `show_projects: true` dans `_config.yml` et supprimer `published: false` de `_tabs/ai.md` et `_tabs/projects.md`.

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

Avant publication, lancez le contrôle de maintenance :

```powershell
ruby scripts/check-blog.rb
```

Il vérifie le front matter, les clés de traduction, les URL en double, les chemins d'images, les exemples de type Liquid et le format des tags. Les tags utilisent le kebab-case en minuscules, par exemple `github-actions`, `thread-pool`, `mysql` et `devops`.

Sous Windows, `htmlproofer` peut échouer localement si Ruby `ethon/typhoeus` ne trouve pas `libcurl.dll`. Le build Ubuntu de GitHub Actions continue d'exécuter `htmlproofer`.

## Déploiement

Un push sur `main` déclenche le workflow GitHub Actions `Build and Deploy`, puis publie le site sur GitHub Pages.

## Maintenir les traductions

Après l'ajout d'un article, ajoutez sa clé de fichier dans `_data/post_translations.yml`, par exemple `2026-08-26-agent-harness-engine`. Si les traductions ne sont pas encore prêtes, renseignez d'abord le chinois ; les modèles utiliseront cette version par défaut.

Quand `scripts/new-ai-note.ps1` crée une note quotidienne IA, il affiche l'entrée `_data/post_translations.yml` à ajouter.
