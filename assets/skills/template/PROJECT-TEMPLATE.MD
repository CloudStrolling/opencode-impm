# Project Basic Information
**Project Name (Chinese)**:
**Project Name (English)**:
**Project Abbreviation**:
**Programming Language**:
**Project Type**:
**Localization Language**: English
**General Introduction**:

# Database Information
**Uses Database**: Yes / No
**Database Product**:
**Database Version**:

# Coding Conventions
## File Organization Conventions
- Organize directories by functional module; put shared code in a common directory and avoid circular dependencies.
## Naming Conventions
- Names of files, directories, classes, functions, and variables follow the community conventions of the language used.
## Code Style
- Follow the mainstream code style of the language used (indentation, quotes, line breaks, semicolons).
## Comment Conventions
- Key classes, functions, and complex logic must have English comments; comments explain "why" rather than "what".
## Logging Conventions
- Use consistent log levels (DEBUG/INFO/WARN/ERROR); critical business paths must be logged; never output sensitive information.
## Testing Conventions
- Test-driven development (TDD): write test cases before coding, and all tests must pass after coding.
## Unified Error Handling Conventions
- Use unified error codes and error message formats; the interface layer uniformly wraps error responses; never swallow exceptions.
## Other Conventions
- Never commit sensitive information such as keys, passwords, or environment variables; do not commit logs or temporary files.

# Project Map
(Automatically maintained by the impm-project-update skill by scanning the source directories; lists each source directory and descriptions of key files, functions, and classes.)

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
