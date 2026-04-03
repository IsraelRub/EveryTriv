<#
.SYNOPSIS
	Checks that a public HTTPS tunnel to Docker client :3000 serves the SPA and proxies /api (liveness) — what other devices need.

.PARAMETER TunnelBaseUrl
	Public base URL (https://…) from ngrok / cloudflared. Must match CLIENT_URL / SERVER_URL after sync-demo-redirect (single-tunnel).

.PARAMETER PagesUrl
	Optional. GitHub Pages root for everytriv-link - ensures index.html FRONTEND_DEMO_URL matches TunnelBaseUrl.

.PARAMETER LocalClientUrl
	Local Docker client URL for a quick pre-check (default http://127.0.0.1:3000). Use -SkipLocal to skip.

.PARAMETER SkipLocal
	Do not probe local nginx /health.

.EXAMPLE
	.\verify-demo-remote.ps1 -TunnelBaseUrl 'https://abc123.ngrok-free.app'

.EXAMPLE
	.\verify-demo-remote.ps1 -TunnelBaseUrl 'https://abc.ngrok-free.app' -PagesUrl 'https://israelrub.github.io/everytriv-link'
#>
param(
	[Parameter(Mandatory = $true)]
	[string] $TunnelBaseUrl,
	[string] $PagesUrl = '',
	[string] $LocalClientUrl = 'http://127.0.0.1:3000',
	[switch] $SkipLocal
)

$ErrorActionPreference = 'Stop'

function Normalize-Base([string] $u) {
	return $u.TrimEnd('/')
}

$tunnel = Normalize-Base $TunnelBaseUrl.Trim()

if ($tunnel -notmatch '^https://') {
	throw "TunnelBaseUrl must be https://... (browsers on other devices need HTTPS). Got: $TunnelBaseUrl"
}

if (-not $SkipLocal) {
	try {
		$loc = Normalize-Base $LocalClientUrl.Trim()
		$lr = Invoke-WebRequest -Uri "$loc/health" -UseBasicParsing -TimeoutSec 8
		if ($lr.StatusCode -eq 200) {
			Write-Host "OK: local nginx health ($loc/health)"
		}
	}
	catch {
		Write-Warning "Local client probe failed (start Docker client on 3000?): $($_.Exception.Message)"
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
	throw "Tunnel API check failed: $live - ensure single tunnel to :3000, .env matches tunnel, and client image was rebuilt with USE_ORIGIN. Details: $($_.Exception.Message)"
}

$idx = "$tunnel/"
$r2 = Invoke-WebRequest -Uri $idx -UseBasicParsing -TimeoutSec 30
if ($r2.StatusCode -ne 200) {
	throw "Expected 200 from SPA root $idx got $($r2.StatusCode)"
}
if ($r2.Content -notmatch '(?i)<!DOCTYPE html|<html') {
	throw "SPA root does not look like HTML (wrong host or blocked?)"
}
Write-Host "OK: SPA index $idx"

if ($PagesUrl -ne '') {
	$pb = Normalize-Base $PagesUrl.Trim()
	$ix = Invoke-WebRequest -Uri "${pb}/" -UseBasicParsing -TimeoutSec 25
	if ($ix.Content -notmatch 'var\s+FRONTEND_DEMO_URL\s*=\s*"([^"]*)"\s*;') {
		throw "Could not find FRONTEND_DEMO_URL in Pages index.html."
	}
	$feN = Normalize-Base $Matches[1].Trim()
	if ($feN -ne $tunnel) {
		throw "Pages index FRONTEND_DEMO_URL='$($Matches[1])' does not match TunnelBaseUrl='$tunnel'. Push updated index.html to main."
	}
	Write-Host "OK: Pages index.html FRONTEND_DEMO_URL matches tunnel ($pb/)"
}

Write-Host ''
Write-Host 'Remote demo checks passed. Open the tunnel URL from another device or a private window.'
