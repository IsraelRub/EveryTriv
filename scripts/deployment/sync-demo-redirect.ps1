<#
.SYNOPSIS
	Updates EveryTriv root .env (SERVER_URL, CLIENT_URL, VITE_API_BASE_URL), optionally rebuilds the client Docker image,
	and writes everytriv-link `index.html` (FRONTEND_DEMO_URL) in a local clone of the GitHub Pages repo.

.PARAMETER FrontendTunnelUrl
	Public URL for the SPA (tunnel to host port 3000). Same as CLIENT_URL and the redirect target in everytriv-link.

.PARAMETER ApiTunnelUrl
	Optional. Public base URL for the Nest API (tunnel to host port 3002). If omitted or equal to FrontendTunnelUrl,
	single-tunnel mode: SERVER_URL and CLIENT_URL are the frontend URL; VITE_API_BASE_URL is USE_ORIGIN_API_PREFIX
	(client nginx proxies /api, /auth, /multiplayer).

.PARAMETER EverytrivLinkRepoPath
	Optional path to a local git clone of the everytriv-link repository (contains index.html at root).

.PARAMETER RebuildClient
	Run `docker compose build client` from the monorepo root after updating .env.

.PARAMETER GitPush
	After updating Pages files, run git add / commit / push in EverytrivLinkRepoPath (requires git remote and auth).

.EXAMPLE
	.\sync-demo-redirect.ps1 -FrontendTunnelUrl 'https://fe-def.ngrok.io' -EverytrivLinkRepoPath 'C:\work\everytriv-link' -RebuildClient

.EXAMPLE
	Two tunnels (legacy): .\sync-demo-redirect.ps1 -ApiTunnelUrl 'https://api-abc.ngrok.io' -FrontendTunnelUrl 'https://fe-def.ngrok.io'
#>
param(
	[Parameter(Mandatory = $true)]
	[string] $FrontendTunnelUrl,
	[string] $ApiTunnelUrl = '',
	[string] $EverytrivLinkRepoPath = '',
	[switch] $RebuildClient,
	[switch] $GitPush,
	[string] $GitCommitMessage = 'chore: update demo redirect target'
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

$useSingleTunnel =
	[string]::IsNullOrWhiteSpace($ApiTunnelUrl) -or
	($ApiTunnelUrl.TrimEnd('/') -eq $FrontendTunnelUrl.TrimEnd('/'))

function Set-EnvKeyValue {
	param(
		[string] $Path,
		[string] $Key,
		[string] $Value
	)
	$lines = Get-Content -LiteralPath $Path
	$newLine = "${Key}=${Value}"
	$found = $false
	$out = [System.Collections.Generic.List[string]]::new()
	foreach ($l in $lines) {
		if ($l -match ('^' + [regex]::Escape($Key) + '=')) {
			[void]$out.Add($newLine)
			$found = $true
		}
		else {
			[void]$out.Add($l)
		}
	}
	if (-not $found) {
		[void]$out.Add($newLine)
	}
	$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
	[System.IO.File]::WriteAllLines($Path, $out, $utf8NoBom)
}

$envFile = Join-Path $repoRoot '.env'
if (-not (Test-Path -LiteralPath $envFile)) {
	throw ".env not found at $envFile"
}

if ($useSingleTunnel) {
	Set-EnvKeyValue -Path $envFile -Key 'SERVER_URL' -Value $FrontendTunnelUrl
	Set-EnvKeyValue -Path $envFile -Key 'CLIENT_URL' -Value $FrontendTunnelUrl
	Set-EnvKeyValue -Path $envFile -Key 'VITE_API_BASE_URL' -Value 'USE_ORIGIN_API_PREFIX'
	Write-Host 'Updated .env: single-tunnel mode — SERVER_URL, CLIENT_URL = frontend; VITE_API_BASE_URL = USE_ORIGIN_API_PREFIX'
}
else {
	Set-EnvKeyValue -Path $envFile -Key 'SERVER_URL' -Value $ApiTunnelUrl
	Set-EnvKeyValue -Path $envFile -Key 'CLIENT_URL' -Value $FrontendTunnelUrl
	Set-EnvKeyValue -Path $envFile -Key 'VITE_API_BASE_URL' -Value $ApiTunnelUrl
	Write-Host 'Updated .env: two-tunnel mode — SERVER_URL, VITE_API_BASE_URL = API; CLIENT_URL = frontend'
}

if ($EverytrivLinkRepoPath -ne '') {
	$resolvedLink = (Resolve-Path -LiteralPath $EverytrivLinkRepoPath).Path
	$templateDir = Join-Path $repoRoot 'everytriv-link'
	$templateIndex = Join-Path $templateDir 'index.html'
	if (-not (Test-Path -LiteralPath $templateIndex)) {
		throw "Template missing: $templateIndex"
	}
	$indexPath = Join-Path $resolvedLink 'index.html'
	$indexSrc = Get-Content -LiteralPath $templateIndex -Raw
	$demoLiteral = $FrontendTunnelUrl | ConvertTo-Json -Compress
	$indexSrc = $indexSrc.Replace(
		'var FRONTEND_DEMO_URL = "";',
		('var FRONTEND_DEMO_URL = {0};' -f $demoLiteral)
	)
	[System.IO.File]::WriteAllText($indexPath, $indexSrc, [System.Text.UTF8Encoding]::new($false))
	Write-Host "Wrote $indexPath (FRONTEND_DEMO_URL)"
}

if ($RebuildClient) {
	Push-Location $repoRoot
	try {
		docker compose build client
		if ($LASTEXITCODE -ne 0) {
			throw "docker compose build client failed with exit code $LASTEXITCODE"
		}
	}
	finally {
		Pop-Location
	}
}

if ($GitPush) {
	if ($EverytrivLinkRepoPath -eq '') {
		throw '-GitPush requires -EverytrivLinkRepoPath'
	}
	$resolvedLink = (Resolve-Path -LiteralPath $EverytrivLinkRepoPath).Path
	Push-Location $resolvedLink
	try {
		git add index.html
		$dirty = git status --porcelain index.html
		if ([string]::IsNullOrWhiteSpace($dirty)) {
			Write-Host 'No Pages file changes to commit.'
		}
		else {
			git commit -m $GitCommitMessage
			git push
		}
	}
	finally {
		Pop-Location
	}
}
