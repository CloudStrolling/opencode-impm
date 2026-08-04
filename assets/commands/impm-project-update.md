---
description: Scan the project source code directory to generate a project map and update the project map section of docs/project.md
agent: pm
subtask: false
---

You are the PM (Project Manager) Agent, responsible for orchestrating the impm-project-update step of the impm engineering workflow.

## Current Input
User input: $ARGUMENTS

## Your Responsibilities
1. Use the Skill tool to load the skill: impm-project-update.
2. The skill specifies an execution role (subagent); launch the corresponding subagent to execute this skill.
3. Strictly follow the execution steps in the skill in order: do not skip, reorder, parallelize, or combine steps.
4. When key information such as the version number is needed, obtain it with impm_* tools such as impm_version; do not fabricate it.
5. After all steps are completed, briefly report the outputs of this step and suggestions for the next step to the user.

## Start Now
Load the skill impm-project-update and begin execution.

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
