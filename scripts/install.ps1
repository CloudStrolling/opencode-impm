# Copyright 2026 jenemy8023 <jenemy8023@163.com>
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# opencode-impm install script (Windows PowerShell version)
# Usage:
#   .\scripts\install.ps1                    # install to the current directory
#   .\scripts\install.ps1 -Target D:\myproj  # install to the specified project

param(
    [string]$Target = ""
)

$ErrorActionPreference = "Stop"

$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $pluginRoot "assets"
$distDir = Join-Path $pluginRoot "dist"

if ($Target -ne "") {
    $targetRoot = $Target
} elseif ($env:INIT_CWD -and ((Resolve-Path $env:INIT_CWD) -ne $pluginRoot)) {
    $targetRoot = $env:INIT_CWD
} else {
    $targetRoot = Get-Location
}

Write-Host "============================================"
Write-Host "  opencode-impm install script"
Write-Host "============================================"
Write-Host ""
Write-Host "Plugin directory: $pluginRoot"
Write-Host "Target project: $targetRoot"
Write-Host ""

if (-not (Test-Path $assetsDir)) {
    Write-Error "Error: the assets directory does not exist: $assetsDir"
    exit 1
}

$opencodeDir = Join-Path $targetRoot ".opencode"

foreach ($dir in @("commands", "agents", "skills")) {
    $srcDir = Join-Path $assetsDir $dir
    $destDir = Join-Path $opencodeDir $dir
    if (-not (Test-Path $srcDir)) {
        Write-Warning "Skip: source directory does not exist $srcDir"
        continue
    }
    Write-Host "Copying $dir/ -> .opencode/$dir/ ..."
    # Remove the existing target directory first to avoid Copy-Item nesting the source directory into the existing one (repeated installs)
    if (Test-Path $destDir) {
        Remove-Item -Path $destDir -Recurse -Force
    }
    Copy-Item -Path $srcDir -Destination $destDir -Recurse -Force
}

if (Test-Path $distDir) {
    $pluginDest = Join-Path $opencodeDir "plugins\impm"
    Write-Host "Installing local plugin -> .opencode/plugins/impm/ ..."
    New-Item -ItemType Directory -Path $pluginDest -Force | Out-Null
    Copy-Item -Path (Join-Path $pluginRoot "package.json") -Destination $pluginDest -Force
    Copy-Item -Path $distDir -Destination (Join-Path $pluginDest "dist") -Recurse -Force
} else {
    Write-Warning "Skip: dist directory does not exist (run npm run build first): $distDir"
}

Write-Host ""
Write-Host "============================================"
Write-Host "  Installation complete!"
Write-Host "  Use the /impm command to start the AI Project Manager full-workflow development."
Write-Host "============================================"
