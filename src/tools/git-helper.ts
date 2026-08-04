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
 * impm_git tool
 * Wraps common git operations:
 *   init: git init
 *   status: working tree status
 *   branch: create and switch to a branch
 *   checkout: switch to a branch (creates it when it does not exist)
 *   commit: stage everything and commit
 *   merge: switch back to the main branch and squash-merge the development branch
 *   current-branch: current branch name
 *   pull: pull the latest code
 *   log: recent commit log
 */

import * as git from "../utils/git.js";

export const gitHelperDefinition = {
    description:
        "git operation wrapper: init (initialize repository), status (working tree status), branch (create and switch branch), checkout (switch branch), commit (stage everything and commit), merge (switch back to the main branch and squash-merge a branch), current-branch (current branch), pull (pull), log (commit log). Use for version branch creation, commits, and merges in the workflow.",
};

export function gitHelperExecute(args: {
    projectRoot: string;
    action: string;
    branchName?: string;
    message?: string;
}) {
    const root = args.projectRoot;
    const action = args.action;
    const safe = <T>(fn: () => T): { success: boolean; output?: T; error?: string } => {
        try {
            return { success: true, output: fn() };
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : String(err),
            };
        }
    };

    switch (action) {
        case "init":
            return safe(() => git.gitInit(root));
        case "status":
            return safe(() => git.getStatus(root));
        case "branch": {
            const branchName = args.branchName?.trim();
            if (!branchName) {
                return { success: false, error: "Missing required argument branchName (branch name)." };
            }
            return safe(() => git.createBranch(root, branchName));
        }
        case "checkout": {
            const branchName = args.branchName?.trim();
            if (!branchName) {
                return { success: false, error: "Missing required argument branchName (branch name)." };
            }
            return safe(() => git.switchBranch(root, branchName));
        }
        case "commit": {
            const message = args.message?.trim();
            if (!message) {
                return { success: false, error: "Missing required argument message (commit message)." };
            }
            return safe(() => {
                git.addFiles(root);
                return git.commit(root, message);
            });
        }
        case "merge": {
            const branchName = args.branchName?.trim();
            if (!branchName) {
                return { success: false, error: "Missing required argument branchName (the branch to merge)." };
            }
            return safe(() => {
                const outputs: string[] = [];
                for (const main of ["main", "master"]) {
                    try {
                        outputs.push(git.switchBranch(root, main));
                        break;
                    } catch {
                        // Try the next default main branch name
                    }
                }
                outputs.push(git.mergeBranch(root, branchName));
                outputs.push(`Current branch: ${git.getCurrentBranch(root)}`);
                outputs.push(`Working tree status:\n${git.getStatus(root)}`);
                return outputs.join("\n");
            });
        }
        case "current-branch":
            return safe(() => git.getCurrentBranch(root));
        case "pull":
            return safe(() => git.pull(root));
        case "log":
            return safe(() => git.getLog(root));
        default:
            return {
                success: false,
                error: `Unknown action: ${action} (should be init/status/branch/checkout/commit/merge/current-branch/pull/log).`,
            };
    }
}
