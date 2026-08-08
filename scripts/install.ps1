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

# --- Parameters ----------------------------------------------------------
# Optional -Target argument: the project directory to install into
param(
    [string]$Target = ""
)

# Stop on the first error so a failed install exits with a clear message
$ErrorActionPreference = "Stop"

# --- Paths ----------------------------------------------------------------
# Plugin root, the assets directory (commands/agents/skills), and the compiled dist output
$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $pluginRoot "assets"
$distDir = Join-Path $pluginRoot "dist"

# --- Target project detection --------------------------------------------
# Priority: -Target argument > INIT_CWD (npm dependency install) > current directory (local install)
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

# Abort when the assets directory is missing (the script is not running in the plugin directory)
if (-not (Test-Path $assetsDir)) {
    Write-Error "Error: the assets directory does not exist: $assetsDir"
    exit 1
}

$opencodeDir = Join-Path $targetRoot ".opencode"

# --- 1. Asset copying -----------------------------------------------------
# Copy commands/agents/skills into .opencode/
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

# --- 2. Plugin installation ------------------------------------------------
# Install the compiled plugin into .opencode/plugins/impm/
if (Test-Path $distDir) {
    $pluginDest = Join-Path $opencodeDir "plugins\impm"
    Write-Host "Installing local plugin -> .opencode/plugins/impm/ ..."
    New-Item -ItemType Directory -Path $pluginDest -Force | Out-Null
    Copy-Item -Path (Join-Path $pluginRoot "package.json") -Destination $pluginDest -Force
    # Empty the old target directory first, then copy the dist contents (not the directory itself),
    # to avoid nesting dist/dist (idempotent install)
    $pluginDistDest = Join-Path $pluginDest "dist"
    if (Test-Path $pluginDistDest) {
        Remove-Item -Path $pluginDistDest -Recurse -Force
    }
    New-Item -ItemType Directory -Path $pluginDistDest -Force | Out-Null
    Copy-Item -Path (Join-Path $distDir "*") -Destination $pluginDistDest -Recurse -Force

    # opencode only auto-discovers direct *.js/*.ts files under .opencode/plugins/ (it does not
    # recurse into subdirectories), so an entry file pointing to the dist build output must be
    # generated at the root of plugins/
    $pluginEntry = Join-Path $opencodeDir "plugins\impm.js"
    [System.IO.File]::WriteAllText($pluginEntry, 'export { default } from "./impm/dist/index.js";' + [Environment]::NewLine)
    Write-Host "Generated plugin entry file -> .opencode/plugins/impm.js"
} else {
    Write-Warning "Skip: dist directory does not exist (run npm run build first): $distDir"
}

# Ensure .opencode/package.json declares ESM (the entry file impm.js uses the export syntax)
$opencodePkgPath = Join-Path $opencodeDir "package.json"
if (Test-Path $opencodePkgPath) {
    $pkgJson = Get-Content -Path $opencodePkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($pkgJson.type -ne "module") {
        $pkgJson | Add-Member -NotePropertyName type -NotePropertyValue "module" -Force
        [System.IO.File]::WriteAllText($opencodePkgPath, ($pkgJson | ConvertTo-Json -Depth 10))
        Write-Host "Updated .opencode/package.json (type: module)"
    }
} else {
    [System.IO.File]::WriteAllText($opencodePkgPath, '{"type": "module"}')
    Write-Host "Generated .opencode/package.json (type: module)"
}

# --- 3. Plugin configuration ----------------------------------------------
# Update the opencode.json config (npm install mode registers the plugin name; the local
# self-install mode is auto-discovered through the entry file)
$configPath = Join-Path $targetRoot "opencode.json"
if (Test-Path $configPath) {
    $config = Get-Content -Path $configPath -Raw -Encoding UTF8 | ConvertFrom-Json
} else {
    $config = @{}
}
if (-not $config.'$schema') {
    $config | Add-Member -NotePropertyName '$schema' -NotePropertyValue "https://opencode.ai/config.json" -Force
}
$resolvedTarget = (Resolve-Path $targetRoot).Path
$isSelfInstall = ($resolvedTarget -eq $pluginRoot.Path)
if (-not $isSelfInstall) {
    $plugins = @($config.plugin)
    if ($plugins -notcontains "opencode-impm") {
        $plugins += "opencode-impm"
    }
    $config | Add-Member -NotePropertyName plugin -NotePropertyValue $plugins -Force
    Write-Host "Config file updated: $configPath (plugin: opencode-impm)"
} else {
    Write-Host "Local self-install: skip config.plugin registration (the plugin entry file is auto-discovered under .opencode/plugins/)"
}
[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 10))

Write-Host ""
Write-Host "============================================"
Write-Host "  Installation complete!"
Write-Host "  Use the /impm command to start the AI Project Manager full-workflow development."
Write-Host "============================================"
