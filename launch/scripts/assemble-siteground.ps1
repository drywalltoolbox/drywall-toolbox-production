[CmdletBinding(SupportsShouldProcess)]
param(
    [switch] $SkipInstall,
    [switch] $SkipBuild
)

$ErrorActionPreference = 'Stop'

$repositoryRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../..'))
$frontendRoot   = Join-Path $repositoryRoot 'frontend'
$distRoot       = Join-Path $repositoryRoot 'dist'
$canonicalRoot  = Join-Path $repositoryRoot 'drywalltoolbox'
$liveRoot       = Join-Path $repositoryRoot 'launch/live'

function Assert-ChildPath {
    param(
        [Parameter(Mandatory)] [string] $Path,
        [Parameter(Mandatory)] [string] $Parent
    )

    $resolvedPath   = [IO.Path]::GetFullPath($Path).TrimEnd([IO.Path]::DirectorySeparatorChar)
    $resolvedParent = [IO.Path]::GetFullPath($Parent).TrimEnd([IO.Path]::DirectorySeparatorChar)
    $prefix         = $resolvedParent + [IO.Path]::DirectorySeparatorChar

    if (-not $resolvedPath.StartsWith($prefix, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing path outside expected parent: $resolvedPath"
    }
}

function Sync-ManagedDirectory {
    param(
        [Parameter(Mandatory)] [string] $Source,
        [Parameter(Mandatory)] [string] $Destination,
        [Parameter(Mandatory)] [string] $AllowedParent
    )

    if (-not (Test-Path -LiteralPath $Source -PathType Container)) {
        throw "Required source directory is missing: $Source"
    }

    Assert-ChildPath -Path $Destination -Parent $AllowedParent
    if ($PSCmdlet.ShouldProcess($Destination, "Replace from $Source")) {
        if (Test-Path -LiteralPath $Destination) {
            Remove-Item -LiteralPath $Destination -Recurse -Force
        }
        Copy-Item -LiteralPath $Source -Destination $Destination -Recurse -Force
    }
}

function Copy-ManagedFile {
    param(
        [Parameter(Mandatory)] [string] $Source,
        [Parameter(Mandatory)] [string] $Destination,
        [Parameter(Mandatory)] [string] $AllowedParent
    )

    if (-not (Test-Path -LiteralPath $Source -PathType Leaf)) {
        throw "Required source file is missing: $Source"
    }

    Assert-ChildPath -Path $Destination -Parent $AllowedParent
    if ($PSCmdlet.ShouldProcess($Destination, "Copy from $Source")) {
        $destinationParent = Split-Path -Parent $Destination
        New-Item -ItemType Directory -Path $destinationParent -Force | Out-Null
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
    }
}

if (-not $SkipBuild) {
    Push-Location $frontendRoot
    try {
        if (-not $SkipInstall) {
            & npm.cmd ci --include=dev --prefer-offline --no-audit --no-fund
            if ($LASTEXITCODE -ne 0) { throw "npm ci failed with exit code $LASTEXITCODE" }
        }

        & npm.cmd run lint
        if ($LASTEXITCODE -ne 0) { throw "npm run lint failed with exit code $LASTEXITCODE" }

        & npm.cmd run build
        if ($LASTEXITCODE -ne 0) { throw "npm run build failed with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $distRoot 'index.html'))) {
    throw 'Production build output is missing dist/index.html.'
}

New-Item -ItemType Directory -Path $liveRoot -Force | Out-Null

# Synchronize each generated directory independently so the runtime-owned /wp
# tree is never a target of a recursive delete.
Get-ChildItem -LiteralPath $distRoot -Directory | ForEach-Object {
    if ($_.Name -in @('wp', 'logos')) {
        throw "Frontend build emitted reserved top-level directory '$($_.Name)'."
    }
    Sync-ManagedDirectory -Source $_.FullName -Destination (Join-Path $liveRoot $_.Name) -AllowedParent $liveRoot
}

Get-ChildItem -LiteralPath $distRoot -File | ForEach-Object {
    Copy-ManagedFile -Source $_.FullName -Destination (Join-Path $liveRoot $_.Name) -AllowedParent $liveRoot
}

Copy-ManagedFile -Source (Join-Path $canonicalRoot '.htaccess') -Destination (Join-Path $liveRoot '.htaccess') -AllowedParent $liveRoot
Copy-ManagedFile -Source (Join-Path $canonicalRoot '.user.ini') -Destination (Join-Path $liveRoot '.user.ini') -AllowedParent $liveRoot
Sync-ManagedDirectory -Source (Join-Path $canonicalRoot 'logos') -Destination (Join-Path $liveRoot 'logos') -AllowedParent $liveRoot

Copy-ManagedFile -Source (Join-Path $canonicalRoot 'wp/.htaccess') -Destination (Join-Path $liveRoot 'wp/.htaccess') -AllowedParent $liveRoot
Copy-ManagedFile -Source (Join-Path $canonicalRoot 'wp/index.php') -Destination (Join-Path $liveRoot 'wp/index.php') -AllowedParent $liveRoot
Sync-ManagedDirectory -Source (Join-Path $canonicalRoot 'wp/wp-content/mu-plugins') -Destination (Join-Path $liveRoot 'wp/wp-content/mu-plugins') -AllowedParent $liveRoot
Sync-ManagedDirectory -Source (Join-Path $canonicalRoot 'wp/wp-content/themes') -Destination (Join-Path $liveRoot 'wp/wp-content/themes') -AllowedParent $liveRoot

Write-Output "SiteGround launch overlay assembled at $liveRoot"
