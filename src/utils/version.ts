/**
 * Version utilities: parse, compare, increment, and extract versions from file names.
 */

/** Parse a version string into [major, minor, patch] */
export function parseVersion(version: string): [number, number, number] {
    const v = version.replace(/^[vV]/, "").trim();
    const parts = v.split(".").map((p) => parseInt(p, 10) || 0);
    return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Format a version number */
export function formatVersion(major: number, minor: number, patch: number): string {
    return `${major}.${minor}.${patch}`;
}

/** Compare two versions: a > b returns 1, a < b returns -1, equal returns 0 */
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

/** Increment the patch of a version */
export function incrementPatch(version: string): string {
    const [m, i, p] = parseVersion(version);
    return formatVersion(m, i, p + 1);
}

/** Extract the version from a file name, e.g. impm-urs-v0.1.2.md -> 0.1.2 */
export function extractVersionFromFileName(fileName: string): string | null {
    const m = /-v(\d+\.\d+\.\d+)/.exec(fileName);
    return m ? m[1] : null;
}

/** Validate the version format */
export function isValidVersion(version: string): boolean {
    return /^\d+\.\d+\.\d+$/.test(version.replace(/^[vV]/, "").trim());
}
