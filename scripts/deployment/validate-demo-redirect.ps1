<#
.SYNOPSIS
	Checks FRONTEND_DEMO_URL in Pages index.html, then falls back to HTTP redirect / meta refresh in HTML.

.PARAMETER PagesUrl
	Full URL of the static Pages site (e.g. https://user.github.io/everytriv-link/).

.PARAMETER ExpectedFrontendUrl
	Public frontend URL (CLIENT_URL). Compared as normalized base (no trailing slash).
#>
param(
	[Parameter(Mandatory = $true)]
	[string] $PagesUrl,
	[Parameter(Mandatory = $true)]
	[string] $ExpectedFrontendUrl
)

$ErrorActionPreference = 'Stop'

function Normalize-Base([string] $u) {
	return $u.TrimEnd('/')
}

function Test-UrlMatchesExpected {
	param(
		[string] $Candidate,
		[string] $ExpectedBase,
		[string] $BaseUriForRelative
	)
	if ([string]::IsNullOrWhiteSpace($Candidate)) {
		return $false
	}
	try {
		$u = if ($Candidate.StartsWith('http')) {
			$Candidate
		}
		else {
			(New-Object System.Uri ([System.Uri]$BaseUriForRelative, $Candidate)).AbsoluteUri
		}
		$got = Normalize-Base $u
		$exp = Normalize-Base $ExpectedBase
		return $got.Equals($exp, [System.StringComparison]::OrdinalIgnoreCase) -or
			$got.StartsWith($exp, [System.StringComparison]::OrdinalIgnoreCase) -or
			$exp.StartsWith($got, [System.StringComparison]::OrdinalIgnoreCase)
	}
	catch {
		return $false
	}
}

$expected = Normalize-Base $ExpectedFrontendUrl
$pagesBase = $PagesUrl.TrimEnd('/')

try {
	$raw = Invoke-WebRequest -Uri "${pagesBase}/" -UseBasicParsing -TimeoutSec 15
	if ($raw.StatusCode -eq 200 -and $raw.Content -match 'var\s+FRONTEND_DEMO_URL\s*=\s*"([^"]*)"\s*;') {
		$fe = $Matches[1].Trim()
		if (Test-UrlMatchesExpected -Candidate $fe -ExpectedBase $expected -BaseUriForRelative $PagesUrl) {
			Write-Host "OK: index.html FRONTEND_DEMO_URL matches expected frontend URL."
			exit 0
		}
		throw "index.html FRONTEND_DEMO_URL '$fe' does not match expected prefix '$expected'"
	}
}
catch {
	$err = $_.Exception.Message
	if ($err -match 'index\.html FRONTEND_DEMO_URL') {
		throw
	}
	Write-Host "Note: skipping index.html FRONTEND_DEMO_URL probe (${pagesBase}/). $err"
}

function Try-LocationHeader {
	param(
		[System.Net.WebResponse] $Response,
		[string] $Expected,
		[string] $PagesUrl
	)
	$loc = $Response.Headers['Location']
	if ([string]::IsNullOrWhiteSpace($loc)) {
		return $false
	}
	if (Test-UrlMatchesExpected -Candidate $loc -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
		Write-Host "OK: HTTP redirect Location matches expected frontend."
		return $true
	}
	throw "Redirect Location '$loc' does not match expected '$Expected'"
}

function Try-HtmlBody {
	param(
		[string] $Body,
		[string] $Expected,
		[string] $PagesUrl
	)
	if ($Body -match 'content\s*=\s*"0\s*;\s*url=([^"]+)"') {
		$candidate = $Matches[1].Trim()
		if (Test-UrlMatchesExpected -Candidate $candidate -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
			Write-Host "OK: meta refresh target matches expected frontend."
			return $true
		}
		throw "meta refresh URL '$candidate' does not match expected '$Expected'"
	}
	if ($Body -match 'location\.replace\(\s*[''""]([^''""]+)[''""]\s*\)') {
		$candidate = $Matches[1].Trim()
		if (Test-UrlMatchesExpected -Candidate $candidate -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
			Write-Host "OK: script redirect target matches expected frontend."
			return $true
		}
		throw "script redirect URL '$candidate' does not match expected '$Expected'"
	}
	return $false
}

try {
	$req = [System.Net.HttpWebRequest]::Create($PagesUrl)
	$req.AllowAutoRedirect = $false
	$req.Timeout = 15000
	$resp = $req.GetResponse()
	try {
		$code = [int]$resp.StatusCode
		if ($code -ge 300 -and $code -lt 400) {
			if (Try-LocationHeader -Response $resp -Expected $expected -PagesUrl $PagesUrl) {
				exit 0
			}
		}
		$stream = $resp.GetResponseStream()
		$reader = New-Object System.IO.StreamReader($stream)
		$body = $reader.ReadToEnd()
		$reader.Close()
		if (Try-HtmlBody -Body $body -Expected $expected -PagesUrl $PagesUrl) {
			exit 0
		}
		throw "Could not find redirect or meta refresh matching '$expected' (HTTP $code)."
	}
	finally {
		$resp.Close()
	}
}
catch [System.Net.WebException] {
	$r = $_.Exception.Response
	if ($null -ne $r) {
		try {
			$code = [int]$r.StatusCode
			if ($code -ge 300 -and $code -lt 400) {
				if (Try-LocationHeader -Response $r -Expected $expected -PagesUrl $PagesUrl) {
					exit 0
				}
			}
			$stream = $r.GetResponseStream()
			if ($null -ne $stream) {
				$reader = New-Object System.IO.StreamReader($stream)
				$body = $reader.ReadToEnd()
				$reader.Close()
				if (Try-HtmlBody -Body $body -Expected $expected -PagesUrl $PagesUrl) {
					exit 0
				}
			}
		}
		finally {
			$r.Close()
		}
	}
	throw
}
