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

# opencode-impm uninstall script (Windows PowerShell version)
# Usage:
#   .\scripts\uninstall.ps1                          # Uninstall current directory
#   .\scripts\uninstall.ps1 -Target D:\myproj        # Uninstall specified project
#   .\scripts\uninstall.ps1 -Global                  # Uninstall global install (~/.config/opencode)
#   Parameters support multiple spellings: -Target/--target, -Global/--global
#
# Fully uninstalls this plugin, only cleaning content written by this plugin during installation, preserving user customizations:
#   - Deletes .opencode/plugins/impm/ directory and entry file plugins/impm.js
#   - Per install manifest .opencode/impm-manifest.json (cumulative historical manifest, everInstalled only grows)
#     precisely deletes files this plugin installed under agents/commands/skills (including historically renamed/removed items);
#     when no manifest exists, falls back to heuristic (agents matching asset names, commands/skills with impm* naming), preserving other user files
#   - Removes impm historical plugin registrations from opencode.json (preserving opencode-browser etc.)
#   - Cleans model/reasoning_effort fields of impm-managed agents (current assets ∪ manifest history) in opencode.json (preserving user customizations)
#   - If the manifest records that install wrote type:module, rolls back .opencode/package.json
#   - Finally deletes the manifest file itself

# Manual command-line argument parsing, supporting -Target/--target, -Global/--global spellings.
# (Does not use param() binding: native binding does not recognize -- double-dash parameter names, causing value parsing errors)
$Target = ""
$Global = $false

$__i = 0
$__rawArgs = @($args)
while ($__i -lt $__rawArgs.Count) {
    $__token = $__rawArgs[$__i]
    if (-not $__token.StartsWith("-")) {
        Write-Error "Error: unrecognized parameter `"$__token`", valid parameters: -Target, -Global"
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
        default {
            Write-Error "Error: unknown parameter `"$__token`", valid parameters: -Target, -Global"
            exit 1
        }
    }
}

$ErrorActionPreference = "Stop"

# Path constants: plugin root, distributable assets directory
$pluginRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$assetsDir = Join-Path $pluginRoot "assets"
$globalConfigDir = Join-Path $HOME ".config\opencode"
$packageName = "opencode-impm"

# ---------- Install manifest helpers ----------
function Get-ManifestPath($opencodeDir) {
    return Join-Path $opencodeDir "impm-manifest.json"
}

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

# Resolve target: -Global first, then -Target, then INIT_CWD, finally fallback to current directory
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
Write-Host "  opencode-impm uninstall script"
Write-Host "============================================"
Write-Host ""
Write-Host "Target project: $targetRoot"
if ($Global) {
    Write-Host "Mode: global uninstall"
}
Write-Host ""

if ($Global) {
    $opencodeDir = $targetRoot
} else {
    $opencodeDir = Join-Path $targetRoot ".opencode"
}

# 1) Delete plugin build artifacts and entry file
$removed = 0
$pluginDest = Join-Path $opencodeDir "plugins\impm"
$pluginEntry = Join-Path $opencodeDir "plugins\impm.js"
if (Test-Path $pluginDest) {
    Remove-Item -Path $pluginDest -Recurse -Force
    Write-Host "Deleted plugin directory -> $pluginDest"
    $removed++
}
if (Test-Path $pluginEntry) {
    Remove-Item -Path $pluginEntry -Force
    Write-Host "Deleted plugin entry -> $pluginEntry"
    $removed++
}
if ($removed -eq 0) {
    Write-Host "No plugin build artifacts found (may already be uninstalled)"
}

# Read install manifest: if present, precisely delete historical residuals (renamed/removed items) per manifest; otherwise fall back to heuristic
$manifest = Read-Manifest $opencodeDir
if ($null -ne $manifest) {
    Write-Host "Install manifest found -> precise cleanup using cumulative history"
} else {
    Write-Host "No install manifest found -> using heuristic cleanup (impm* prefix / current assets set)"
}

# 2) Delete impm-owned resources in agents/commands/skills (preserving other user files)
Write-Host "Cleaning impm-owned resources in agents/commands/skills..."

# agents: manifest first (filenames), otherwise by current assets set
$agentRemoved = 0
$agentsDir = Join-Path $opencodeDir "agents"
$agentFiles = @()
if ($null -ne $manifest -and $manifest.everInstalled) {
    $agentFiles = @($manifest.everInstalled.agents)
}
if ($agentFiles.Count -eq 0) {
    foreach ($agentFile in Get-ChildItem -Path (Join-Path $assetsDir "agents\*.md") -ErrorAction SilentlyContinue) {
        $agentFiles += ($agentFile.BaseName + ".md")
    }
}
if (Test-Path $agentsDir) {
    foreach ($name in $agentFiles) {
        $file = Join-Path $agentsDir $name
        if (Test-Path $file) {
            Remove-Item -Path $file -Force
            $agentRemoved++
        }
    }
}

# commands: manifest first (filenames), otherwise by impm prefix
$commandsRemoved = 0
$commandsDir = Join-Path $opencodeDir "commands"
$commandFiles = @()
if ($null -ne $manifest -and $manifest.everInstalled) {
    $commandFiles = @($manifest.everInstalled.commands)
}
if (Test-Path $commandsDir) {
    foreach ($item in Get-ChildItem -Path $commandsDir -Force) {
        $owned = $false
        if ($commandFiles.Count -gt 0) {
            $owned = $commandFiles -contains $item.Name
        } else {
            $base = [System.IO.Path]::GetFileNameWithoutExtension($item.Name)
            $owned = ($base -eq "impm" -or $base.StartsWith("impm"))
        }
        if ($owned) {
            Remove-Item -Path $item.FullName -Recurse -Force
            $commandsRemoved++
        }
    }
}

# skills: manifest first (directory names), otherwise by impm / template
$skillsRemoved = 0
$skillsDir = Join-Path $opencodeDir "skills"
$skillDirs = @()
if ($null -ne $manifest -and $manifest.everInstalled) {
    $skillDirs = @($manifest.everInstalled.skills)
}
if (Test-Path $skillsDir) {
    foreach ($dir in Get-ChildItem -Path $skillsDir -Directory) {
        $owned = $false
        if ($skillDirs.Count -gt 0) {
            $owned = $skillDirs -contains $dir.Name
        } else {
            $owned = ($dir.Name -eq "impm" -or $dir.Name.StartsWith("impm-") -or $dir.Name -eq "template")
        }
        if ($owned) {
            Remove-Item -Path $dir.FullName -Recurse -Force
            $skillsRemoved++
        }
    }
}

Write-Host "Deleted impm-owned resources: agents $agentRemoved, commands $commandsRemoved, skills $skillsRemoved"

# 3) Clean opencode.json configuration (plugin registration + agent model configurations, preserving user customizations)
$configPath = Join-Path $targetRoot "opencode.json"
if (Test-Path $configPath) {
    $config = Get-Content -Path $configPath -Raw -Encoding UTF8 | ConvertFrom-Json

    # Remove impm historical plugin registrations (manifest recorded names + default name + impm-related entries), preserve the rest
    $staleNames = @()
    if ($null -ne $manifest -and $manifest.pluginNames) {
        $staleNames = @($manifest.pluginNames)
    }
    if ($staleNames -notcontains $packageName) {
        $staleNames += $packageName
    }
    if ($config.plugin) {
        $plugins = @($config.plugin | Where-Object {
            $s = $_
            $isStale = $false
            if ($s -is [string]) {
                $isStale = ($staleNames -contains $s) -or $s.ToLower().Contains("impm")
            } else {
                $isStale = Test-StaleImpmPlugin $s
            }
            -not $isStale
        })
        if ($plugins.Count -eq 0) {
            $config.PSObject.Properties.Remove("plugin")
        } else {
            $config | Add-Member -NotePropertyName plugin -NotePropertyValue $plugins -Force
        }
        Write-Host "Removed impm plugin registrations from plugin list ($($plugins.Count) remaining)"
    }

    # Clean impm-managed agent model configurations (current assets ∪ manifest historical agent keys, preserving user-customized agents and other fields)
    $managedAgents = @()
    foreach ($agentFile in Get-ChildItem -Path (Join-Path $assetsDir "agents\*.md") -ErrorAction SilentlyContinue) {
        $managedAgents += $agentFile.BaseName
    }
    $historicalKeys = @()
    if ($null -ne $manifest -and $manifest.everInstalled -and $manifest.everInstalled.agents) {
        foreach ($f in @($manifest.everInstalled.agents)) {
            $historicalKeys += ([string]$f -replace '\.md$', '')
        }
    }
    $cleanAgents = @($managedAgents + $historicalKeys | Select-Object -Unique)
    $agentConfig = @{}
    if ($null -ne $config.agent) {
        $existing = $config.agent
        if ($existing -is [System.Collections.IDictionary]) {
            foreach ($k in $existing.Keys) { $agentConfig[$k] = $existing[$k] }
        } elseif ($existing -is [System.Management.Automation.PSCustomObject]) {
            foreach ($p in $existing.PSObject.Properties) { $agentConfig[$p.Name] = $p.Value }
        }
    }
    $cleaned = 0
    foreach ($name in $cleanAgents) {
        if (-not $agentConfig.ContainsKey($name)) {
            continue
        }
        $entry = @{}
        $raw = $agentConfig[$name]
        if ($raw -is [System.Collections.IDictionary]) {
            foreach ($k in $raw.Keys) { $entry[$k] = $raw[$k] }
        } elseif ($raw -is [System.Management.Automation.PSCustomObject]) {
            foreach ($p in $raw.PSObject.Properties) { $entry[$p.Name] = $p.Value }
        }
        $changed = $false
        if ($entry.ContainsKey("model")) { $entry.Remove("model"); $changed = $true }
        if ($entry.ContainsKey("reasoning_effort")) { $entry.Remove("reasoning_effort"); $changed = $true }
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
    Write-Host "Cleaned $cleaned impm-managed agent model configurations"

    [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json -Depth 10))
} else {
    Write-Host "Config file not found, skipping config cleanup: $configPath"
}

# 4) Roll back type:module in .opencode/package.json written by install (only when manifest confirms this script wrote it)
if ($null -ne $manifest -and $manifest.pkgJsonTypeModule) {
    $opencodePkgPath = Join-Path $opencodeDir "package.json"
    if (Test-Path $opencodePkgPath) {
        try {
            $pkgJson = Get-Content -Path $opencodePkgPath -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($pkgJson.type -eq "module") {
                $pkgJson.PSObject.Properties.Remove("type")
                if ($pkgJson.PSObject.Properties.Count -eq 0) {
                    Remove-Item -Path $opencodePkgPath -Force
                    Write-Host "Rolled back .opencode/package.json (removed type:module written by install, file is now empty and deleted)"
                } else {
                    [System.IO.File]::WriteAllText($opencodePkgPath, ($pkgJson | ConvertTo-Json -Depth 10))
                    Write-Host "Rolled back .opencode/package.json (removed type:module written by install)"
                }
            }
        } catch {
            # Parse failure: do nothing to avoid corrupting user files
        }
    }
}

# 5) Delete the manifest file itself
if ($null -ne $manifest) {
    Remove-Item -Path (Get-ManifestPath $opencodeDir) -Force -ErrorAction SilentlyContinue
    Write-Host "Deleted install manifest -> $(Get-ManifestPath $opencodeDir)"
}

Write-Host ""
Write-Host "============================================"
Write-Host "  Uninstall complete!"
Write-Host "  Plugin and its registrations/model configurations removed; user customizations preserved."
Write-Host "============================================"
