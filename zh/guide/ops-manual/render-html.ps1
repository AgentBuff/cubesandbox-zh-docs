$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$outDir = Join-Path $root 'html'

if (-not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Path $outDir | Out-Null
}

$files = @(
    'README.md',
    '01-command-reference.md',
    '02-control-plane-config.md',
    '03-node-runtime-config.md',
    '04-install-layout-and-generated-files.md',
    '05-logs-health-and-troubleshooting.md'
)

foreach ($file in $files) {
    $src = Join-Path $root $file
    $dst = Join-Path $outDir (($file -replace '\.md$', '.html'))

    Write-Host "[render] $file -> $(Split-Path -Leaf $dst)"
    npx -y bmmd render $src `
        --platform wechat `
        --markdown-style blueprint `
        --code-theme kimbie-light `
        --output $dst
}

Write-Host "[done] rendered html to $outDir"
