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
#   .\scripts\install.ps1                          # Install to current directory
#   .\scripts\install.ps1 -Target D:\myproj        # Install to specified project
#   .\scripts\install.ps1 -Global                  # Global install to ~/.config/opencode
#   .\scripts\install.ps1 -AgentType opencode-go-balance  # Write agent model configurations per preset
#   Parameters support multiple spellings: -Target/--target, -Global/--global, -AgentType/--agent-type/--AgentType/--agent_type
#
# Model configuration presets (-AgentType):
#   - Valid values: opencode-zen-free / opencode-go-lite / opencode-go-balance /
#             opencode-go-optimize / custom / clear
#   - Each preset corresponds to a set of agent model + reasoning_effort settings, defined in scripts/agent-models.json.
#   - custom preset is manually maintained: during installation, if the target opencode.json already has
#     model configuration for an agent, it is preserved; only missing agents are filled in per preset
#     (updating the plugin does not affect custom manual settings).
#   - clear is a special value: cleans impm-managed agent model configurations in opencode.json, writes no settings.
#   - No -AgentType passed: does not modify agent settings in opencode.json at all.
#
# Historical residual cleanup: maintains cumulative install manifest .opencode/impm-manifest.json (everInstalled only grows),
# and precisely cleans up historical renamed/removed residuals (including non-impm-prefixed agents) per manifest during installation;
# on first install (no manifest), uses heuristic cleanup (commands/skills by impm* prefix, each directory by same-name as source).
# User-created / other plugin non-impm content is always preserved.

# Manual command-line argument parsing, supporting -Target/--target, -Global/--global,
# -AgentType/--agent-type/--AgentType/--agent_type spellings.
# (Does not use param() binding: native binding does not recognize -- double-dash parameter names, causing value parsing errors)
$Target = ""
$Global = $false
$AgentType = ""

$__i = 0
$__rawArgs = @($args)
while ($__i -lt $__rawArgs.Count) {
    $__token = $__rawArgs[$__i]
    if (-not $__token.StartsWith("-")) {
        Write-Error "Error: unrecognized parameter `"$__token`", valid parameters: -Target, -Global, -AgentType"
        exit 1
    }
    $__name = $__token.TrimStart("-") -replace "[_-]", ""
    $__name = $__name.ToLower()
    switch ($__name) {
        "global" { $Global = $true; $__i++ }
        "target" {
            if ($__i + 1 -ge $__rawArgs.Count) {
                Write-Error "Error: parameter `"$__token`" is missing a value"
                exit 1
            }
            $Target = $__rawArgs[$__i + 1]
            $__i += 2
        }
        "agenttype" {
            if ($__i + 1 -ge $__rawArgs.Count) {
                Write-Error "Error: parameter `"$__token`" is missing a value"
                exit 1
            }
            $AgentType = $__rawArgs[$__i + 1]
            $__i += 2
        }
        default {
            Write-Error "Error: unknown parameter `"$__token`", valid parameters: -Target, -Global, -AgentType"
            exit 1
        }
    }
}

$ErrorActionPreference = "Stop"

# Path constants: plugin root, distributable assets directory, TypeScript build output directory
$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $pluginRoot "assets"
$distDir = Join-Path $pluginRoot "dist"
$presetFile = Join-Path $PSScriptRoot "agent-models.json"
$globalConfigDir = Join-Path $HOME ".config\opencode"

# Plugins registered by default during installation (impm suite + browser plugin, for UI/network-related skills)
$defaultPlugins = @("opencode-impm", "opencode-browser")

# --agent-type allowed values
$agentTypes = @("opencode-zen-free", "opencode-go-lite", "opencode-go-balance", "opencode-go-optimize", "custom", "clear")

# Convert PSCustomObject/IDictionary to Hashtable for uniform string-key read/write
function ConvertTo-HashTable($obj) {
    $h = @{}
    if ($null -eq $obj) {
        return $h
    }
    if ($obj -is [System.Collections.IDictionary]) {
        foreach ($k in $obj.Keys) {
            $h[$k] = $obj[$k]
        }
    } elseif ($obj -is [System.Management.Automation.PSCustomObject]) {
        foreach ($p in $obj.PSObject.Properties) {
            $h[$p.Name] = $p.Value
        }
    }
    return $h
}

# Install manifest file path: {opencodeDir}/impm-manifest.json
function Get-ManifestPath($opencodeDir) {
    return Join-Path $opencodeDir "impm-manifest.json"
}

# Read install manifest; returns $null if missing or corrupted
function Read-Manifest($opencodeDir) {
    $file = Get-ManifestPath $opencodeDir
    if (-not (Test-Path $file)) {
        return $null
    }
    try {
        $m = Get-Content -Path $file -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($null -eq $m -or $m -isnot [System.Management.Automation.PSCustomObject]) {
            return $null
        }
        return $m
    } catch {
        return $null
    }
}

# Save install manifest
function Write-Manifest($opencodeDir, $manifest) {
    [System.IO.File]::WriteAllText((Get-ManifestPath $opencodeDir), ($manifest | ConvertTo-Json -Depth 10))
}

# Determine if a directory entry belongs to impm: same-name / in historical manifest / (commands/skills additionally by impm* prefix fallback)
function Test-ImpmOwned($dirType, $name, $srcSet, $everSet) {
    if ($srcSet.Contains($name) -or $everSet.Contains($name)) {
        return $true
    }
    if (($dirType -eq "commands" -or $dirType -eq "skills") -and $name.StartsWith("impm")) {
        return $true
    }
    return $false
}

# Determine if a plugin registration entry is a stale impm registration (supports both string name and {name,entry} object)
function Test-StaleImpmPlugin($p) {
    if ($p -is [string]) {
        return ($p -eq "opencode-impm") -or $p.ToLower().Contains("impm")
    }
    if ($null -ne $p -and $p -is [System.Management.Automation.PSCustomObject]) {
        $n = [string]($p.name)
        if (-not $n) { $n = [string]($p.entry) }
        return $n.ToLower().Contains("impm")
    }
    return $false
}

# Compute deduplicated union of two string arrays
function Merge-Unique {
    param([string[]]$a, [string[]]$b)
    $set = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($x in $a) { [void]$set.Add([string]$x) }
    foreach ($x in $b) { [void]$set.Add([string]$x) }
    return @($set)
}

# List directory entry names and normalize to plain [string] array
# (PS 5.1's ConvertTo-Json hangs pathologically with PSObject-wrapped strings from Get-ChildItem -Name,
#   must explicitly unwrap via [string] before serializing)
function Get-PlainNames($path) {
    $out = [System.Collections.Generic.List[string]]::new()
    foreach ($x in (Get-ChildItem -Path $path -Name -ErrorAction SilentlyContinue)) {
        $out.Add([string]$x)
    }
    return $out
}

# Resolve install target: -Global first, then -Target, then INIT_CWD (npm dependency install scenario), finally fallback to current directory
if ($Global) {
    $targetRoot = $globalConfigDir
} elseif ($Target -ne "") {
    $targetRoot = $Target
} elseif ($env:INIT_CWD -and ((Resolve-Path $env:INIT_CWD).Path -ne $pluginRoot.Path)) {
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
if ($Global) {
    Write-Host "Install mode: global install"
}
if ($AgentType) {
    Write-Host "agent-type: $AgentType"
} else {
    Write-Host "agent-type: (not specified, not modifying agent settings in opencode.json)"
}
Write-Host ""

# Validate AgentType value
if ($AgentType -and $agentTypes -notcontains $AgentType) {
    Write-Error "Error: unknown AgentType `"$AgentType`", valid values: $($agentTypes -join ', ')"
    exit 1
}

if (-not (Test-Path $assetsDir)) {
    Write-Error "Error: assets directory does not exist: $assetsDir"
    exit 1
}
if ($AgentType -and -not (Test-Path $presetFile)) {
    Write-Error "Error: preset model configuration file does not exist: $presetFile"
    exit 1
}

# Global install puts assets directly into global config directory (agents/commands/skills); non-global install puts them in project .opencode/
if ($Global) {
    $opencodeDir = $targetRoot
} else {
    $opencodeDir = Join-Path $targetRoot ".opencode"
}

# Read historical cumulative manifest (if absent, treat as first install)
$manifest = Read-Manifest $opencodeDir

# Copy agents/commands/skills assets to target directory (process each directory individually, skip if missing)
# Cleanup strategy: per cumulative manifest (historically installed items) + impm* prefix (commands/skills only) to delete impm-owned residuals,
# preserve user-created / other plugin non-impm content; on first install (no manifest) use same-name + impm* prefix heuristic cleanup
foreach ($dir in @("commands", "agents", "skills")) {
    $srcDir = Join-Path $assetsDir $dir
    $destDir = Join-Path $opencodeDir $dir
    if (-not (Test-Path $srcDir)) {
        Write-Warning "Skipping: source directory does not exist $srcDir"
        continue
    }
    Write-Host "Copying $dir/ -> $destDir/ ..."
    $srcNames = @(Get-PlainNames $srcDir)
    $everNames = @()
    if ($null -ne $manifest -and $manifest.everInstalled) {
        $everNames = @($manifest.everInstalled."$dir")
    }
    $srcSet = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($n in $srcNames) { [void]$srcSet.Add([string]$n) }
    $everSet = [System.Collections.Generic.HashSet[string]]::new()
    foreach ($n in $everNames) { [void]$everSet.Add([string]$n) }
    if (Test-Path $destDir) {
        Get-ChildItem -Path $destDir -Force | ForEach-Object {
            if (Test-ImpmOwned $dir $_.Name $srcSet $everSet) {
                Remove-Item -Path $_.FullName -Recurse -Force
            }
        }
    }
    # Ensure target directory exists first, then copy each item by source directory content.
    # Note: cannot Copy-Item $srcDir -> $destDir, otherwise when target already exists it nests dest/agents/agents
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Get-ChildItem -Path $srcDir -Force | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $destDir -Recurse -Force
    }
}

# Cumulative manifest: if absent, initialize from current assets (only record impm-owned); if present, merge this install's items (only grows)
$everInstalled = @{}
foreach ($dir in @("commands", "agents", "skills")) {
    $srcDir = Join-Path $assetsDir $dir
    $everInstalled[$dir] = @(Get-PlainNames $srcDir)
}
if ($null -eq $manifest) {
    $manifest = @{
        everInstalled    = $everInstalled
        pluginNames      = @()
        pkgJsonTypeModule = $false
        installedVersion = ""
    }
} else {
    $merged = @{}
    foreach ($dir in @("commands", "agents", "skills")) {
        $prev = @()
        if ($manifest.everInstalled) { $prev = @($manifest.everInstalled."$dir") }
        $merged[$dir] = @(Merge-Unique $prev $everInstalled[$dir])
    }
    $prevPluginNames = @()
    if ($manifest.pluginNames) { $prevPluginNames = @($manifest.pluginNames) }
    $manifest = @{
        everInstalled    = $merged
        pluginNames      = @(Merge-Unique $prevPluginNames $null)
        pkgJsonTypeModule = $manifest.pkgJsonTypeModule
        installedVersion = ""
    }
}

$pluginDest = Join-Path $opencodeDir "plugins\impm"
$pluginEntry = Join-Path $opencodeDir "plugins\impm.js"
if (Test-Path $distDir) {
    Write-Host "Installing local plugin -> .../plugins/impm/ ..."
    # Delete the entire old plugin directory and entry file to thoroughly remove stale/obsolete build artifacts
    if (Test-Path $pluginDest) {
        Remove-Item -Path $pluginDest -Recurse -Force
    }
    if (Test-Path $pluginEntry) {
        Remove-Item -Path $pluginEntry -Force
    }
    New-Item -ItemType Directory -Path $pluginDest -Force | Out-Null
    Copy-Item -Path (Join-Path $pluginRoot "package.json") -Destination $pluginDest -Force
    New-Item -ItemType Directory -Path (Join-Path $pluginDest "dist") -Force | Out-Null
    Copy-Item -Path (Join-Path $distDir "*") -Destination (Join-Path $pluginDest "dist") -Recurse -Force

    # opencode only auto-discovers *.js/*.ts files directly under plugins/ (not recursively in subdirectories),
    # so an entry file must be generated at the root pointing to the dist build output
    [System.IO.File]::WriteAllText($pluginEntry, 'export { default } from "./impm/dist/index.js";' + [Environment]::NewLine)
    Write-Host "Generated plugin entry file -> .../plugins/impm.js"
} else {
    Write-Warning "Skipping: dist directory does not exist (please run npm run build first): $distDir"
}

# Ensure opencodeDir/package.json declares ESM (entry file impm.js uses export syntax)
$opencodePkgPath = Join-Path $opencodeDir "package.json"
$pkgTypeModuleWritten = $false
if (Test-Path $opencodePkgPath) {
    $pkgJson = Get-Content -Path $opencodePkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
    if ($pkgJson.type -ne "module") {
        $pkgJson | Add-Member -NotePropertyName type -NotePropertyValue "module" -Force
        [System.IO.File]::WriteAllText($opencodePkgPath, ($pkgJson | ConvertTo-Json -Depth 10))
        Write-Host "Updated $opencodeDir/package.json (type: module)"
        $pkgTypeModuleWritten = $true
    }
} else {
    [System.IO.File]::WriteAllText($opencodePkgPath, '{"type": "module"}')
    Write-Host "Generated $opencodeDir/package.json (type: module)"
    $pkgTypeModuleWritten = $true
}
if ($pkgTypeModuleWritten) {
    $manifest.pkgJsonTypeModule = $true
}

# Update opencode.json configuration (npm install mode registers plugin name; local self-install mode auto-discovered by entry file)
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
$isSelfInstall = [System.String]::Equals($resolvedTarget, $pluginRoot.Path, [System.StringComparison]::OrdinalIgnoreCase)
if (-not $isSelfInstall) {
    $plugins = @()
    if ($config.plugin) {
        $plugins = @($config.plugin | Where-Object { -not (Test-StaleImpmPlugin $_) })
    }
    foreach ($p in $defaultPlugins) {
        if ($plugins -notcontains $p) {
            $plugins += $p
        }
    }
    $config | Add-Member -NotePropertyName plugin -NotePropertyValue $plugins -Force
    if ($manifest.pluginNames -notcontains "opencode-impm") {
        $manifest.pluginNames = @($manifest.pluginNames + "opencode-impm")
    }
    Write-Host "Config updated: $configPath (plugin: $($defaultPlugins -join ', '))"
} else {
    Write-Host "Local self-install: skipping config.plugin registration (plugin entry auto-discovered by plugins/)"
}

# Apply agent model configuration preset / clean impm-managed agent model configurations
$managedAgents = @()
foreach ($agentFile in Get-ChildItem -Path (Join-Path $assetsDir "agents\*.md") -ErrorAction SilentlyContinue) {
    $managedAgents += $agentFile.BaseName
}

# Merge historical agent keys from cumulative manifest (strip .md from filenames) to avoid residuals from renamed/removed items
$historicalAgentKeys = @()
if ($null -ne $manifest -and $manifest.everInstalled -and $manifest.everInstalled.agents) {
    foreach ($f in @($manifest.everInstalled.agents)) {
        $historicalAgentKeys += ([string]$f -replace '\.md$', '')
    }
}
$cleanAgents = @(Merge-Unique $managedAgents $historicalAgentKeys)

# Normalize existing agent configuration to Hashtable
$agentConfig = @{}
if ($null -ne $config.agent) {
    $agentConfig = ConvertTo-HashTable $config.agent
}

if (-not $AgentType) {
    # No AgentType specified: do not modify agent settings in opencode.json
    Write-Host "No AgentType specified: not modifying agent settings in opencode.json"
} elseif ($AgentType -eq "clear") {
    # clear: only clean impm-managed agent model configurations (model/reasoning_effort), write nothing
    $cleaned = 0
    foreach ($name in $cleanAgents) {
        if (-not $agentConfig.ContainsKey($name)) {
            continue
        }
        $entry = ConvertTo-HashTable $agentConfig[$name]
        $changed = $false
        if ($entry.ContainsKey("model")) {
            $entry.Remove("model")
            $changed = $true
        }
        if ($entry.ContainsKey("reasoning_effort")) {
            $entry.Remove("reasoning_effort")
            $changed = $true
        }
        if ($changed) {
            $cleaned++
            if ($entry.Count -eq 0) {
                $agentConfig.Remove($name)
            } else {
                $agentConfig[$name] = $entry
            }
        }
    }
    if ($agentConfig.Count -eq 0) {
        $config.PSObject.Properties.Remove("agent")
    } else {
        $config | Add-Member -NotePropertyName agent -NotePropertyValue $agentConfig -Force
    }
    Write-Host "clear: cleaned $cleaned impm-managed agent model configurations (preserved other custom agents)"
} else {
    # Read preset and write agent model configurations
    $presets = Get-Content -Path $presetFile -Raw -Encoding UTF8 | ConvertFrom-Json
    $preset = $presets."$AgentType"
    if ($null -eq $preset -or $null -eq $preset.agents) {
        Write-Error "Error: preset file missing `"$AgentType`" definition"
        exit 1
    }

    $synced = 0
    $preserved = 0
    foreach ($name in $preset.agents.PSObject.Properties.Name) {
        $setting = $preset.agents."$name"
        $existing = $null
        if ($agentConfig.ContainsKey($name)) {
            $existing = ConvertTo-HashTable $agentConfig[$name]
        }
        # custom preset: do not overwrite existing model configuration (updating plugin doesn't affect manually maintained settings)
        if ($AgentType -eq "custom" -and $null -ne $existing -and $existing.ContainsKey("model")) {
            $preserved++
            continue
        }
        if ($null -eq $existing) {
            $existing = @{}
        }
        $existing["model"] = $setting.model
        $existing["reasoning_effort"] = $setting.reasoning_effort
        $agentConfig[$name] = $existing
        $synced++
    }
    $config | Add-Member -NotePropertyName agent -NotePropertyValue $agentConfig -Force
    $msg = "Applied preset $AgentType: wrote model configuration for $synced agents"
    if ($preserved -gt 0) {
        $msg += ", preserved $preserved existing custom configurations"
    }
    Write-Host $msg
}

[System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 10))

# Save cumulative manifest (full overwrite write, used for next install's historical cleanup and uninstall's precise deletion)
$pkgJson = Get-Content -Path (Join-Path $pluginRoot "package.json") -Raw -Encoding UTF8 | ConvertFrom-Json
$manifest.installedVersion = $pkgJson.version
Write-Manifest $opencodeDir $manifest
Write-Host "Install manifest saved -> $(Get-ManifestPath $opencodeDir)"

Write-Host ""
Write-Host "============================================"
Write-Host "  Installation complete!"
Write-Host "  Use the /impm command to start AI project manager full workflow development."
Write-Host "============================================"
