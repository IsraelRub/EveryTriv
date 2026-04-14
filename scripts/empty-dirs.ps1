# Reports directories under source roots that are "effectively empty":
# - no files/subdirs, OR
# - only hidden/dotfiles (e.g. .gitkeep), OR
# - only trivial barrel files (index.ts, index.tsx, main.ts, …), OR
# - only combinations of the above, recursively.
# Exit 1 if any are found (for CI).

$ErrorActionPreference = 'Stop'

function Test-HiddenOrNoiseFile {
	param([System.IO.FileSystemInfo] $Item)
	if ($Item.PSIsContainer) {
		return $false
	}
	if ($Item.Name.StartsWith('.')) {
		return $true
	}
	try {
		if ($Item.Attributes -band [System.IO.FileAttributes]::Hidden) {
			return $true
		}
	} catch {
		# ignore attribute read errors
	}
	$n = $Item.Name
	return ($n -eq 'Thumbs.db') -or ($n -eq 'desktop.ini')
}

function Test-TrivialBarrelFile {
	param([System.IO.FileSystemInfo] $Item)
	if ($Item.PSIsContainer) {
		return $false
	}
	$n = $Item.Name
	if ($n -match '^(?i)(index|main)\.(ts|tsx|js|jsx|mjs|cjs)$') {
		return $true
	}
	if ($n -match '^(?i)index\.d\.ts$') {
		return $true
	}
	return $false
}

function Test-EffectivelyEmptyDirectory {
	param([string] $DirectoryPath)
	$items = @(Get-ChildItem -LiteralPath $DirectoryPath -Force -ErrorAction SilentlyContinue)
	if ($items.Count -eq 0) {
		return $true
	}
	foreach ($item in $items) {
		if ($item.PSIsContainer) {
			if (-not (Test-EffectivelyEmptyDirectory $item.FullName)) {
				return $false
			}
			continue
		}
		if (Test-HiddenOrNoiseFile $item) {
			continue
		}
		if (Test-TrivialBarrelFile $item) {
			continue
		}
		return $false
	}
	return $true
}

$roots = @('client/src', 'server/src', 'shared')
if ($args.Count -gt 0) {
	$roots = $args
}

$violations = [System.Collections.Generic.List[string]]::new()
foreach ($root in $roots) {
	if (-not (Test-Path -LiteralPath $root)) {
		continue
	}
	$resolved = (Resolve-Path -LiteralPath $root).Path
	if (Test-EffectivelyEmptyDirectory $resolved) {
		$violations.Add($resolved) | Out-Null
	}
	$dirs = @(Get-ChildItem -LiteralPath $root -Directory -Recurse -Force -ErrorAction SilentlyContinue)
	foreach ($d in $dirs) {
		if (Test-EffectivelyEmptyDirectory $d.FullName) {
			$violations.Add($d.FullName) | Out-Null
		}
	}
}

if ($violations.Count -gt 0) {
	Write-Host 'Effectively empty directories (no meaningful source files):' -ForegroundColor Yellow
	$violations | Sort-Object -Unique | ForEach-Object { Write-Host $_ }
	exit 1
}

Write-Host 'No effectively empty directories under scanned roots.' -ForegroundColor Green
exit 0
