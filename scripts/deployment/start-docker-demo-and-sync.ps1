<#
.SYNOPSIS
	Starts the demo-tunnel Docker stack, waits until cloudflared logs contain a Quick Tunnel URL, then runs sync-demo-redirect.ps1.

.DESCRIPTION
	`pnpm run start:demo` maps here. Equivalent to: docker compose --profile demo-tunnel up --build -d (same as docker:start plus demo-tunnel profile), poll logs until https://*.trycloudflare.com appears, then update .env / everytriv-link, client rebuild, git push to Pages (default), and compose restart. Use `pnpm run start:demo:local` to skip git push (`-NoGitPush`).

.PARAMETER RebuildClient
	Passed to sync-demo-redirect.ps1 (default: true).

.PARAMETER GitPush
	Passed to sync-demo-redirect.ps1 (default: true). Ignored when -NoGitPush is set.

.PARAMETER NoGitPush
	Skip commit/push to everytriv-link and monorepo (same as pnpm script start:demo:local).

.PARAMETER SkipPages
	Passed to sync-demo-redirect.ps1 (.env only).

.PARAMETER SkipUp
	Do not run docker compose up (use when the stack is already running).

.PARAMETER TimeoutSeconds
	Max time to wait for a tunnel URL in cloudflared logs (default: 180).

.PARAMETER PollIntervalSeconds
	Interval between log reads (default: 3).

.EXAMPLE
	.\start-docker-demo-and-sync.ps1

.EXAMPLE
	.\start-docker-demo-and-sync.ps1 -NoGitPush

.EXAMPLE
	.\start-docker-demo-and-sync.ps1 -RebuildClient $false -SkipPages
#>
param(
	[bool] $RebuildClient = $true,
	[bool] $GitPush = $true,
	[switch] $NoGitPush,
	[switch] $SkipPages,
	[switch] $SkipUp,
	[int] $TimeoutSeconds = 180,
	[int] $PollIntervalSeconds = 3
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

$tryCloudflareRx = [regex]::new(
	'https://[a-zA-Z0-9.-]+\.trycloudflare\.com/?',
	[System.Text.RegularExpressions.RegexOptions]::IgnoreCase
)

function Get-DockerCloudflaredLogsText {
	param([string] $Root)
	Push-Location $Root
	$prevEap = $ErrorActionPreference
	try {
		# Avoid terminating on docker stderr while daemon is starting or pipe is unavailable.
		$ErrorActionPreference = 'SilentlyContinue'
		$dockerOut = & docker compose logs cloudflared --tail 800 2>&1
		if ($null -eq $dockerOut) {
			return ''
		}
		if ($dockerOut -is [System.Array]) {
			return ($dockerOut | ForEach-Object { $_.ToString() }) -join "`n"
		}
		return $dockerOut.ToString()
	}
	catch {
		return ''
	}
	finally {
		$ErrorActionPreference = $prevEap
		Pop-Location
	}
}

function Get-LastTryCloudflareUrlFromText {
	param([string] $Text)
	if ([string]::IsNullOrWhiteSpace($Text)) {
		return $null
	}
	$urlMatches = $tryCloudflareRx.Matches($Text)
	if ($urlMatches.Count -eq 0) {
		return $null
	}
	return $urlMatches[$urlMatches.Count - 1].Value.TrimEnd('/')
}

function Wait-ForTryCloudflareUrlInLogs {
	param(
		[string] $Root,
		[int] $TimeoutSec,
		[int] $PollSec
	)
	$deadline = [datetime]::UtcNow.AddSeconds($TimeoutSec)
	Write-Host "Waiting for https://*.trycloudflare.com in cloudflared logs (timeout ${TimeoutSec}s)..."
	while ([datetime]::UtcNow -lt $deadline) {
		$text = Get-DockerCloudflaredLogsText -Root $Root
		$url = Get-LastTryCloudflareUrlFromText -Text $text
		if (-not [string]::IsNullOrWhiteSpace($url)) {
			return $url
		}
		Start-Sleep -Seconds $PollSec
	}
	throw "Timeout: no https://*.trycloudflare.com URL in docker compose logs for 'cloudflared' within ${TimeoutSec}s. Check: docker compose logs cloudflared"
}

if (-not $SkipUp) {
	Push-Location $repoRoot
	try {
		Write-Host "Running: docker compose --profile demo-tunnel up --build -d"
		& docker compose --profile demo-tunnel up --build -d
		if ($LASTEXITCODE -ne 0) {
			throw "docker compose exited with code $LASTEXITCODE"
		}
	}
	finally {
		Pop-Location
	}
}
else {
	Write-Host 'SkipUp: not running docker compose up.'
}

$tunnelUrl = Wait-ForTryCloudflareUrlInLogs -Root $repoRoot -TimeoutSec $TimeoutSeconds -PollSec $PollIntervalSeconds
Write-Host "Tunnel URL: $tunnelUrl"

$doGitPush = $GitPush -and -not $NoGitPush

$syncScript = Join-Path $PSScriptRoot 'sync-demo-redirect.ps1'
$syncArgs = @{
	FrontendTunnelUrl = $tunnelUrl
}
if ($RebuildClient) {
	$syncArgs['RebuildClient'] = $true
}
if ($doGitPush) {
	$syncArgs['GitPush'] = $true
}
if ($SkipPages) {
	$syncArgs['SkipPages'] = $true
}

& $syncScript @syncArgs
