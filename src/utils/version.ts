/**
 * Copyright 2026 jenemy8023 <jenemy8023@163.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Version number utility: parsing, comparing, incrementing, and extracting from filenames.
 */

/** Parse version number string into [major, minor, patch] */
export function parseVersion(version: string): [number, number, number] {
    // Remove v prefix and split by dot; unparseable segments default to 0 (fault-tolerant)
    const v = version.replace(/^[vV]/, "").trim();
    const parts = v.split(".").map((p) => parseInt(p, 10) || 0);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Format version number */
export function formatVersion(major: number, minor: number, patch: number): string {
    return `${major}.${minor}.${patch}`;
}

/** Compare two version numbers: returns 1 if a > b, -1 if a < b, 0 if equal */
export function compareVersions(a: string, b: string): number {
    const [am, ai, ap] = parseVersion(a);
    const [bm, bi, bp] = parseVersion(b);
    if (am !== bm) {
        return am > bm ? 1 : -1;
    }
    if (ai !== bi) {
        return ai > bi ? 1 : -1;
    }
    if (ap !== bp) {
        return ap > bp ? 1 : -1;
    }
    return 0;
}

/** Version number patch +1 */
export function incrementPatch(version: string): string {
    const [m, i, p] = parseVersion(version);
    return formatVersion(m, i, p + 1);
}

/** Validate version number format */
export function isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version.replace(/^[vV]/, "").trim());
}