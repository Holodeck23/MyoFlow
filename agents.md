# 🤖 Multi-Agent Coordination Strategy

This document outlines the strategy for multi-agent collaboration on the MyoFlow project. The goal is to enable parallel development, prevent conflicts, and ensure a clean and maintainable codebase.

## Core Principles

1.  **Isolation:** Each agent works in a separate, isolated environment (e.g., a git worktree or a separate clone of the repository). This prevents conflicts during development.
2.  **Coordination:** All work is coordinated through a central planning and tracking system (e.g., GitHub Issues, a project board, or a dedicated coordination file).
3.  **Integration:** All code is integrated into the main branch through a pull request (PR) process. This ensures code quality and provides an opportunity for review.

## Git Worktree Setup

Git worktrees are the recommended method for creating isolated development environments.

**Workspace Structure:**

```
/Users/ZOD/Documents/GitHub/
├── MyoFlow/          # Main workspace
├── MyoFlow-agent1/   # Agent 1's dedicated workspace
└── MyoFlow-agent2/   # Agent 2's dedicated workspace
```

**Workflow:**

1.  **Create a worktree:** Each agent creates a dedicated worktree from the main repository.
2.  **Work on a feature:** The agent works on a feature in their dedicated worktree.
3.  **Create a PR:** Once the feature is complete, the agent creates a pull request from their worktree.
4.  **Review and merge:** The PR is reviewed by another agent or a human, and then merged into the main branch.

## Task Division

Tasks can be divided among agents based on their strengths and capabilities. For example:

*   **Agent 1 (e.g., Claude):** Complex implementation, debugging, architecture decisions.
*   **Agent 2 (e.g., Codex):** Systematic tasks, testing, code generation, analysis.

## Communication and Coordination

Clear communication and coordination are essential for successful multi-agent collaboration.

*   **Coordination File:** A central coordination file (e.g., `CLAUDE.md`, `AGENTS.md`) can be used to track the status of each agent and their current tasks.
*   **GitHub Issues:** GitHub Issues can be used to assign tasks to agents and to track their progress.
*   **Pull Requests:** Pull requests are the primary mechanism for code review and integration.

## Database Sharing

*   The same `.env` file can be shared across worktrees to ensure that all agents are using the same database.
*   Database migrations should be tested in one workspace before being applied to others.
*   Schema changes should be coordinated through migrations only.

## Benefits

*   **Parallel development:** Multiple agents can work on different features in parallel without interfering with each other.
*   **Conflict prevention:** The use of isolated environments prevents merge conflicts during development.
*   **Improved code quality:** The PR-based integration process ensures that all code is reviewed before it is merged into the main branch.

---

**Last Updated:** September 21, 2025
**Status:** Active