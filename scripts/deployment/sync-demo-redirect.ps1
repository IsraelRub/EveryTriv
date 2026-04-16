<#
.SYNOPSIS
	Single-tunnel demo: updates root .env (incl. COOKIE_SECURE for HTTPS), everytriv-link index.html (FRONTEND_DEMO_URL), optional client rebuild, docker compose up server+client, and git push.

.PARAMETER FrontendTunnelUrl
	Public https:// URL to Docker client :3000. Omit with -DiscoverUrlFromDockerLogs or -TunnelLogFilePath.

.PARAMETER DiscoverUrlFromDockerLogs
	Last https://*.trycloudflare.com from `docker compose logs cloudflared` (run from monorepo root).

.PARAMETER TunnelLogFilePath
	Text file with cloudflared output; uses last trycloudflare URL match (host tunnel with saved log).

.PARAMETER SkipPages
	Update .env only (no index.html / -GitPush).

.PARAMETER RebuildClient
	Run `docker compose build client` after updating .env.

.PARAMETER GitPush
	Commit/push everytriv-link index.html and bump monorepo submodule pointer when applicable.

.EXAMPLE
	.\sync-demo-redirect.ps1 -DiscoverUrlFromDockerLogs -RebuildClient -GitPush

.EXAMPLE
	.\sync-demo-redirect.ps1 -FrontendTunnelUrl 'https://abc.trycloudflare.com' -RebuildClient -GitPush
#>
param(
	[string] $FrontendTunnelUrl = '',
	[switch] $DiscoverUrlFromDockerLogs,
	[string] $TunnelLogFilePath = '',
	[switch] $SkipPages,
	[switch] $RebuildClient,
	[switch] $GitPush
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$linkRoot = Join-Path $repoRoot 'everytriv-link'

function Get-TryCloudflareUrlFromText {
	param([string] $Text)
	if ([string]::IsNullOrWhiteSpace($Text)) {
		return $null
	}
	$rx = [regex]::new('https://[a-zA-Z0-9.-]+\.trycloudflare\.com/?', [System.Text.RegularExpressions.RegexOptions]::IgnoreCase)
	$urlMatches = $rx.Matches($Text)
	if ($urlMatches.Count -eq 0) {
		return $null
	}
	return $urlMatches[$urlMatches.Count - 1].Value.TrimEnd('/')
}

if ($GitPush -and $SkipPages) {
	throw '-GitPush cannot be used with -SkipPages'
}

if ($DiscoverUrlFromDockerLogs -and -not [string]::IsNullOrWhiteSpace($TunnelLogFilePath)) {
	throw 'Use either -DiscoverUrlFromDockerLogs or -TunnelLogFilePath, not both.'
}

if (-not [string]::IsNullOrWhiteSpace($FrontendTunnelUrl)) {
	$FrontendTunnelUrl = $FrontendTunnelUrl.TrimEnd('/')
}
elseif (-not [string]::IsNullOrWhiteSpace($TunnelLogFilePath)) {
	if (-not (Test-Path -LiteralPath $TunnelLogFilePath)) {
		throw "Tunnel log file not found: $TunnelLogFilePath"
	}
	$raw = Get-Content -LiteralPath $TunnelLogFilePath -Raw
	$discovered = Get-TryCloudflareUrlFromText -Text $raw
	if ([string]::IsNullOrWhiteSpace($discovered)) {
		throw "No https://*.trycloudflare.com URL found in $TunnelLogFilePath"
	}
	$FrontendTunnelUrl = $discovered
	Write-Host "Discovered tunnel URL from log file: $FrontendTunnelUrl"
}
elseif ($DiscoverUrlFromDockerLogs) {
	Push-Location $repoRoot
	try {
		$dockerOut = & docker compose logs cloudflared --tail 800 2>&1
		$dockerText = if ($null -eq $dockerOut) {
			''
		}
		elseif ($dockerOut -is [System.Array]) {
			($dockerOut | ForEach-Object { $_.ToString() }) -join "`n"
		}
		else {
			$dockerOut.ToString()
		}
	}
	finally {
		Pop-Location
	}
	$discovered = Get-TryCloudflareUrlFromText -Text $dockerText
	if ([string]::IsNullOrWhiteSpace($discovered)) {
		throw @"
No https://*.trycloudflare.com URL in docker compose logs for 'cloudflared'.
Start: docker compose --profile demo-tunnel up --build -d
Or use -FrontendTunnelUrl or -TunnelLogFilePath.
"@
	}
	$FrontendTunnelUrl = $discovered
	Write-Host "Discovered tunnel URL from Docker logs: $FrontendTunnelUrl"
}
else {
	throw @"
Pass -FrontendTunnelUrl 'https://...', or -DiscoverUrlFromDockerLogs, or -TunnelLogFilePath.
"@
}

if (-not $SkipPages) {
	$indexInLink = Join-Path $linkRoot 'index.html'
	if (-not (Test-Path -LiteralPath $indexInLink)) {
		throw "Missing $indexInLink - init submodule everytriv-link or use -SkipPages."
	}
}

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

Set-EnvKeyValue -Path $envFile -Key 'SERVER_URL' -Value $FrontendTunnelUrl
Set-EnvKeyValue -Path $envFile -Key 'CLIENT_URL' -Value $FrontendTunnelUrl
Set-EnvKeyValue -Path $envFile -Key 'VITE_API_BASE_URL' -Value 'USE_ORIGIN_API_PREFIX'
Write-Host 'Updated .env - SERVER_URL, CLIENT_URL = tunnel; VITE_API_BASE_URL = USE_ORIGIN_API_PREFIX'
if ($FrontendTunnelUrl.StartsWith('https://', [System.StringComparison]::OrdinalIgnoreCase)) {
	Set-EnvKeyValue -Path $envFile -Key 'COOKIE_SECURE' -Value 'true'
	Write-Host 'Updated .env - COOKIE_SECURE=true (HTTPS tunnel)'
}

if (-not $SkipPages) {
	$resolvedLink = (Resolve-Path -LiteralPath $linkRoot).Path
	$templateIndex = Join-Path $linkRoot 'index.html'
	$indexSrc = Get-Content -LiteralPath $templateIndex -Raw
	$demoLiteral = $FrontendTunnelUrl | ConvertTo-Json -Compress
	$newLine = 'var FRONTEND_DEMO_URL = {0};' -f $demoLiteral
	$indexSrc = [regex]::Replace(
		$indexSrc,
		'var\s+FRONTEND_DEMO_URL\s*=\s*[^;]+;',
		$newLine
	)
	if ($indexSrc -notmatch [regex]::Escape($demoLiteral)) {
		throw "Could not set FRONTEND_DEMO_URL in index.html (missing var FRONTEND_DEMO_URL line?)."
	}
	$indexPath = Join-Path $resolvedLink 'index.html'
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

Push-Location $repoRoot
try {
	Write-Host 'docker compose up -d server client (reload .env / new client image)'
	& docker compose up -d server client
	if ($LASTEXITCODE -ne 0) {
		throw "docker compose up -d server client failed with exit code $LASTEXITCODE"
	}
}
finally {
	Pop-Location
}

if ($GitPush) {
	$resolvedLink = (Resolve-Path -LiteralPath $linkRoot).Path
	$submodulePushed = $false

	Push-Location $resolvedLink
	try {
		git add index.html
		$dirty = git status --porcelain index.html
		if ([string]::IsNullOrWhiteSpace($dirty)) {
			Write-Host 'No Pages file changes to commit.'
		}
		else {
			git commit -m 'chore: update demo redirect target'
			git push
			if ($LASTEXITCODE -ne 0) {
				throw "git push failed in everytriv-link (exit $LASTEXITCODE)"
			}
			$submodulePushed = $true
		}
	}
	finally {
		Pop-Location
	}

	if ($submodulePushed) {
		Push-Location $repoRoot
		try {
			$gitDir = git rev-parse --git-dir 2>$null
			if ([string]::IsNullOrWhiteSpace($gitDir)) {
				Write-Warning 'Monorepo is not a git repo; skipped submodule pointer update.'
			}
			else {
				git add everytriv-link
				$parentDirty = git status --porcelain everytriv-link
				if ([string]::IsNullOrWhiteSpace($parentDirty)) {
					Write-Host 'Monorepo: everytriv-link pointer unchanged.'
				}
				else {
					git commit -m 'chore: bump everytriv-link submodule'
					if ($LASTEXITCODE -ne 0) {
						throw "git commit failed at monorepo root (exit $LASTEXITCODE)"
					}
					git push
					if ($LASTEXITCODE -ne 0) {
						throw "git push failed at monorepo root (exit $LASTEXITCODE)"
					}
					Write-Host 'Monorepo: pushed everytriv-link submodule pointer.'
				}
			}
		}
		finally {
			Pop-Location
		}
	}
}
