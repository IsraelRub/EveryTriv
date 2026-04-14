<#
.SYNOPSIS
	Checks local nginx (optional), tunnel API + SPA, and optionally GitHub Pages vs the same tunnel URL.

.PARAMETER TunnelBaseUrl
	Public https:// base (Try Cloudflare).

.PARAMETER PagesUrl
	everytriv-link GitHub Pages root; when set, deep-check FRONTEND_DEMO_URL / redirects against TunnelBaseUrl.

.PARAMETER SkipLocal
	Skip probe to http://127.0.0.1:3000/health (e.g. Docker only on another host).

.EXAMPLE
	.\verify-demo-remote.ps1 -TunnelBaseUrl 'https://abc123.trycloudflare.com'

.EXAMPLE
	.\verify-demo-remote.ps1 -TunnelBaseUrl 'https://abc.trycloudflare.com' -PagesUrl 'https://israelrub.github.io/everytriv-link'
#>
param(
	[Parameter(Mandatory)]
	[string] $TunnelBaseUrl,
	[string] $PagesUrl = '',
	[switch] $SkipLocal
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'DemoDeployment.Common.ps1')

$tunnel = Get-NormalizedBase $TunnelBaseUrl.Trim()

if ($tunnel -notmatch '^https://') {
	throw "TunnelBaseUrl must be https://... Got: $TunnelBaseUrl"
}

if (-not $SkipLocal) {
	try {
		$loc = Get-NormalizedBase 'http://127.0.0.1:3000'
		$lr = Invoke-WebRequest -Uri "$loc/health" -UseBasicParsing -TimeoutSec 8
		if ($lr.StatusCode -eq 200) {
			Write-Host "OK: local nginx health ($loc/health)"
		}
	}
	catch {
		Write-Warning "Local client probe failed (Docker client on 3000?): $($_.Exception.Message)"
	}
}

$live = "$tunnel/api/health/liveness"
try {
	$r = Invoke-WebRequest -Uri $live -UseBasicParsing -TimeoutSec 30
	if ($r.StatusCode -ne 200) {
		throw "HTTP $($r.StatusCode)"
	}
	Write-Host "OK: API via tunnel $live"
}
catch {
	throw "Tunnel API check failed: $live - single tunnel to :3000, .env matches tunnel, client rebuilt with USE_ORIGIN. $($_.Exception.Message)"
}

$idx = "$tunnel/"
$r2 = Invoke-WebRequest -Uri $idx -UseBasicParsing -TimeoutSec 30
if ($r2.StatusCode -ne 200) {
	throw "Expected 200 from SPA root $idx got $($r2.StatusCode)"
}
if ($r2.Content -notmatch '(?i)<!DOCTYPE html|<html') {
	throw 'SPA root does not look like HTML (wrong host or blocked?)'
}
Write-Host "OK: SPA index $idx"

if (-not [string]::IsNullOrWhiteSpace($PagesUrl)) {
	Invoke-DemoPagesValidation -PagesUrl $PagesUrl.Trim() -ExpectedFrontendUrl $tunnel
}

Write-Host ''
Write-Host 'Remote demo checks passed.'
