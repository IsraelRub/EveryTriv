# Applies EveryTriv local Redis settings to the Windows Redis install:
#   port 6380, requirepass EveryTrivLocalRedis6380!
# The Windows service uses redis.windows-service.conf (see: sc qc Redis).
# redis.windows.conf is patched too so manual redis-server runs match.
# Must run elevated (UAC) because files live under Program Files.
# Idempotent: safe to run again if already patched.

$ErrorActionPreference = 'Stop'
$redisDir = 'C:\Program Files\Redis'
$configPaths = @(
	(Join-Path $redisDir 'redis.windows-service.conf'),
	(Join-Path $redisDir 'redis.windows.conf')
)

$isAdmin = (
	[Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
	Write-Host 'Re-launching as Administrator (UAC)...'
	$arg = '-NoProfile -ExecutionPolicy Bypass -File "' + $MyInvocation.MyCommand.Path + '"'
	$p = Start-Process -FilePath powershell.exe -Verb RunAs -ArgumentList $arg -Wait -PassThru
	if ($null -eq $p.ExitCode) {
		exit 1
	}
	exit $p.ExitCode
}

$foundAny = $false
foreach ($configPath in $configPaths) {
	if (-not (Test-Path -LiteralPath $configPath)) {
		continue
	}
	$foundAny = $true
	$lines = [System.IO.File]::ReadAllLines($configPath)
	$changed = $false
	for ($i = 0; $i -lt $lines.Length; $i++) {
		if ($lines[$i] -match '^\s*port\s+6379\s*$') {
			$lines[$i] = 'port 6380'
			$changed = $true
		}
		if ($lines[$i] -match '^\s*#\s*requirepass\s+foobared\s*$') {
			$lines[$i] = 'requirepass EveryTrivLocalRedis6380!'
			$changed = $true
		}
	}
	if ($changed) {
		$utf8NoBom = New-Object System.Text.UTF8Encoding $false
		[System.IO.File]::WriteAllText($configPath, ($lines -join "`r`n") + "`r`n", $utf8NoBom)
		Write-Host "Updated: $configPath"
	} else {
		Write-Host "No edits needed: $configPath"
	}
}

if (-not $foundAny) {
	Write-Error "No Redis configs found under $redisDir (install with: pnpm run redis:install:windows)"
	exit 1
}

$svc = Get-Service -Name Redis -ErrorAction SilentlyContinue
if (-not $svc) {
	Write-Error 'Windows service "Redis" not found.'
	exit 1
}
try {
	if ($svc.Status -eq 'Running') {
		Restart-Service -Name Redis -ErrorAction Stop
		Write-Host 'Redis service restarted.'
	} else {
		Start-Service -Name Redis -ErrorAction Stop
		Write-Host 'Redis service started.'
	}
} catch {
	Write-Warning "Service start/restart failed: $_ - trying net start Redis..."
	$net = cmd /c "net start Redis" 2>&1
	Write-Host $net
	if ($LASTEXITCODE -ne 0) {
		Write-Warning 'Start Redis manually as Administrator: Start-Service Redis - or inspect Redis logs under Program Files\Redis.'
		exit 1
	}
}

$svc = Get-Service -Name Redis -ErrorAction SilentlyContinue
$svc.Refresh()
Start-Sleep -Milliseconds 800
if ($svc.Status -ne 'Running') {
	Write-Warning 'Redis service is still not Running after start attempt.'
	exit 1
}

Write-Host ('Test: redis-cli -p 6380 -a {0} ping' -f 'EveryTrivLocalRedis6380!')
