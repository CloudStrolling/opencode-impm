/**
 * git command wrapper: executes git through execSync uniformly.
 */

import { execSync } from "child_process";

function gitExec(cwd: string, command: string): string {
    try {
        return execSync(`git ${command}`, {
            cwd,
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
        }).trim();
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        throw new Error(`git command failed: ${command}\n${message}`);
    }
}

/** Whether the directory is inside a git repository */
export function isGitRepo(cwd: string): boolean {
    try {
        gitExec(cwd, "rev-parse --is-inside-work-tree");
        return true;
    } catch {
        return false;
    }
}

/** git init */
export function gitInit(cwd: string): string {
    return gitExec(cwd, "init");
}

/** Create and switch to a branch */
export function createBranch(cwd: string, branchName: string): string {
    return gitExec(cwd, `checkout -b ${branchName}`);
}

/** Switch to an existing branch */
export function switchBranch(cwd: string, branchName: string): string {
    return gitExec(cwd, `checkout ${branchName}`);
}

/** Current branch name */
export function getCurrentBranch(cwd: string): string {
    return gitExec(cwd, "rev-parse --abbrev-ref HEAD");
}

/** Pull the latest code */
export function pull(cwd: string): string {
    return gitExec(cwd, "pull");
}

/** Add files (all by default) */
export function addFiles(cwd: string, files: string[] = ["-A"]): void {
    gitExec(cwd, `add ${files.join(" ")}`);
}

/** Commit */
export function commit(cwd: string, message: string): string {
    const safe = message.replace(/"/g, "'");
    return gitExec(cwd, `commit -m "${safe}"`);
}

/** Merge a branch (squash) */
export function mergeBranch(cwd: string, branchName: string): string {
    return gitExec(cwd, `merge --squash ${branchName}`);
}

/** Working tree status (short format) */
export function getStatus(cwd: string): string {
    return gitExec(cwd, "status --short");
}

/** Commit log */
export function getLog(cwd: string, count = 30): string {
    return gitExec(cwd, `log --oneline -${count}`);
}
