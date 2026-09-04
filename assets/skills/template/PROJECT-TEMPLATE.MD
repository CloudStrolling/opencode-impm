# Basic Project Information
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

# Coding Standards
## File Organization
- Organize directories by functional module; put common code in a shared directory and avoid circular dependencies.
## Naming Conventions
- File, directory, class, function, and variable naming follows the community conventions of the language used.
## Code Style
- Follow the mainstream code style of the language used (indentation, quotes, line breaks, semicolons).
## Commenting Standards
- Key classes, functions, and complex logic must have English comments; comments explain "why" rather than "what".
## Logging Standards
- Use consistent log levels (DEBUG/INFO/WARN/ERROR); key business paths must be logged; prohibit outputting sensitive information.
## Testing Standards
- Test-driven development (TDD): write test cases before coding; after coding, all tests must pass.
## Unified Error Handling
- Use unified error codes and error message formats; the interface layer uniformly encapsulates error responses; prohibit swallowing exceptions.
## Other Standards
- Prohibit committing secrets, passwords, environment variables, and other sensitive information; do not commit logs and temporary files.

# Project Map
(Automatically maintained by the impm-project-update skill by scanning source code directories; lists each source code directory and key files, functions, and classes.)

<!-- SPDX-License-Identifier: Apache-2.0 / Copyright 2026 jenemy8023 <jenemy8023@163.com> -->
