param(
  [string]$Title = "",
  [string]$Tags = "ai-daily, rag",
  [datetime]$Date = (Get-Date)
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$day = $Date.ToString("yyyy-MM-dd")
$slug = if ($Title.Trim()) {
  $Title.ToLowerInvariant() `
    -replace "[^a-z0-9\u4e00-\u9fa5]+", "-" `
    -replace "^-|-$", ""
} else {
  "ai-daily-note"
}

$postDir = Join-Path $repoRoot "_posts\AI\daily"
$postPath = Join-Path $postDir "$day-$slug.md"
$templatePath = Join-Path $repoRoot "_templates\ai-daily-note.md"
$translationsPath = Join-Path $repoRoot "_data\post_translations.yml"

if (Test-Path -LiteralPath $postPath) {
  throw "Post already exists: $postPath"
}

New-Item -ItemType Directory -Force -Path $postDir | Out-Null

$displayTitle = if ($Title.Trim()) { "AI Daily Note：$Title" } else { "AI Daily Note：$day" }
$content = Get-Content -LiteralPath $templatePath -Raw -Encoding UTF8
$content = $content.Replace("AI Daily Note：YYYY-MM-DD", $displayTitle)
$content = $content.Replace("YYYY-MM-DD 21:30:00 +0800", "$day 21:30:00 +0800")
$content = $content.Replace("YYYY-MM-DD", $day)
$content = $content.Replace("[ai-daily, rag]", "[$Tags]")

Set-Content -LiteralPath $postPath -Value $content -Encoding UTF8
Write-Output $postPath

$key = "$day-$slug"
if (-not (Select-String -LiteralPath $translationsPath -Pattern "^$([regex]::Escape($key)):" -Quiet)) {
  Write-Warning "Add $key to _data/post_translations.yml before publishing."
  Write-Output @"

$key:
  title:
    zh: "$displayTitle"
    en: "$displayTitle"
    ja: "$displayTitle"
    fr: "$displayTitle"
  description:
    zh: "今天的 AI 工程观察与可复现记录。"
    en: "AI engineering observation and reproducible notes for today."
    ja: "今日の AI エンジニアリング観察と再現可能なメモ。"
    fr: "Observation d'ingénierie IA et notes reproductibles du jour."
"@
}
