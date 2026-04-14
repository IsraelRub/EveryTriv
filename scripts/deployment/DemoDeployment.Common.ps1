# Dot-source only (e.g. . (Join-Path $PSScriptRoot 'DemoDeployment.Common.ps1')). No root param block.

function Get-NormalizedBase {
	param(
		[Parameter(Mandatory)]
		[string] $u
	)
	return $u.TrimEnd('/')
}

function Test-DemoUrlEquivalent {
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
		$got = Get-NormalizedBase $u
		$exp = Get-NormalizedBase $ExpectedBase
		return $got.Equals($exp, [System.StringComparison]::OrdinalIgnoreCase) -or
			$got.StartsWith($exp, [System.StringComparison]::OrdinalIgnoreCase) -or
			$exp.StartsWith($got, [System.StringComparison]::OrdinalIgnoreCase)
	}
	catch {
		return $false
	}
}

function Test-DemoPagesResponseLocation {
	param(
		[System.Net.WebResponse] $Response,
		[string] $Expected,
		[string] $PagesUrl
	)
	$loc = $Response.Headers['Location']
	if ([string]::IsNullOrWhiteSpace($loc)) {
		return $false
	}
	if (Test-DemoUrlEquivalent -Candidate $loc -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
		Write-Host 'OK: HTTP redirect Location matches expected frontend.'
		return $true
	}
	throw "Redirect Location '$loc' does not match expected '$Expected'"
}

function Test-DemoPagesHtmlRedirect {
	param(
		[string] $Body,
		[string] $Expected,
		[string] $PagesUrl
	)
	if ($Body -match 'content\s*=\s*"0\s*;\s*url=([^"]+)"') {
		$candidate = $Matches[1].Trim()
		if (Test-DemoUrlEquivalent -Candidate $candidate -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
			Write-Host 'OK: meta refresh target matches expected frontend.'
			return $true
		}
		throw "meta refresh URL '$candidate' does not match expected '$Expected'"
	}
	if ($Body -match 'location\.replace\(\s*[''""]([^''""]+)[''""]\s*\)') {
		$candidate = $Matches[1].Trim()
		if (Test-DemoUrlEquivalent -Candidate $candidate -ExpectedBase $Expected -BaseUriForRelative $PagesUrl) {
			Write-Host 'OK: script redirect target matches expected frontend.'
			return $true
		}
		throw "script redirect URL '$candidate' does not match expected '$Expected'"
	}
	return $false
}

function Invoke-DemoPagesValidation {
	<#
	.SYNOPSIS
		Validates GitHub Pages demo link: FRONTEND_DEMO_URL in HTML, or HTTP redirect / meta / script fallback.
	#>
	param(
		[Parameter(Mandatory)]
		[string] $PagesUrl,
		[Parameter(Mandatory)]
		[string] $ExpectedFrontendUrl
	)

	$expected = Get-NormalizedBase $ExpectedFrontendUrl
	$pagesBase = $PagesUrl.TrimEnd('/')

	try {
		$raw = Invoke-WebRequest -Uri "${pagesBase}/" -UseBasicParsing -TimeoutSec 15
		if ($raw.StatusCode -eq 200 -and $raw.Content -match 'var\s+FRONTEND_DEMO_URL\s*=\s*"([^"]*)"\s*;') {
			$fe = $Matches[1].Trim()
			if (Test-DemoUrlEquivalent -Candidate $fe -ExpectedBase $expected -BaseUriForRelative $PagesUrl) {
				Write-Host 'OK: index.html FRONTEND_DEMO_URL matches expected frontend URL.'
				return
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

	try {
		$req = [System.Net.HttpWebRequest]::Create($PagesUrl)
		$req.AllowAutoRedirect = $false
		$req.Timeout = 15000
		$resp = $req.GetResponse()
		try {
			$code = [int]$resp.StatusCode
			if ($code -ge 300 -and $code -lt 400) {
				if (Test-DemoPagesResponseLocation -Response $resp -Expected $expected -PagesUrl $PagesUrl) {
					return
				}
			}
			$stream = $resp.GetResponseStream()
			$reader = New-Object System.IO.StreamReader($stream)
			$body = $reader.ReadToEnd()
			$reader.Close()
			if (Test-DemoPagesHtmlRedirect -Body $body -Expected $expected -PagesUrl $PagesUrl) {
				return
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
					if (Test-DemoPagesResponseLocation -Response $r -Expected $expected -PagesUrl $PagesUrl) {
						return
					}
				}
				$stream = $r.GetResponseStream()
				if ($null -ne $stream) {
					$reader = New-Object System.IO.StreamReader($stream)
					$body = $reader.ReadToEnd()
					$reader.Close()
					if (Test-DemoPagesHtmlRedirect -Body $body -Expected $expected -PagesUrl $PagesUrl) {
						return
					}
				}
			}
			finally {
				$r.Close()
			}
		}
		throw
	}
}
