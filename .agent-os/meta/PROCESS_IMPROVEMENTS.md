# 📈 Process & Architecture Improvement Suggestions

**Source:** Gemini Code Assist Analysis
**Date:** September 20, 2025

This document tracks high-level suggestions for improving the development process, architecture, and coordination strategy for the MyoFlow project.

---

## 1. Automate Process Adherence

**Status:** 🟡 In Progress

### Suggestion
The current system relies on manual discipline to update logs (`AGENT_ACTIVITY_LOG.md`). This creates a risk of logs becoming outdated. We can reduce this risk by wrapping common Git commands in simple shell scripts that enforce process steps.

### Action Item
Create a `git-commit-and-log` script that:
1.  Runs `git commit`.
2.  Prompts the developer/agent for a one-line summary for the activity log.
3.  Automatically appends a formatted entry (summary, branch, timestamp) to `AGENT_ACTIVITY_LOG.md`.

### Benefit
Reduces manual effort and ensures the activity log stays perfectly in sync with repository actions.

---

## 2. Centralize Shared Context

**Status:** 🟡 In Progress

### Suggestion
The `Active Shared Context` in `.agent-os/meta/agents.md` is a great start, but critical project state is spread across multiple documents. This can lead to confusion about the single source of truth.

### Action Item
Elevate the "Active Shared Context" into its own canonical file, e.g., `SHARED_CONTEXT.md`. This file would become the single source of truth for:
-   Unresolved critical bugs (like the Webpack runtime error).
-   Key architectural decisions currently in flight.
-   The current state of shared modules (`LocaleProvider`, database schemas).

### Benefit
Allows any agent or human to get a quick, accurate snapshot of the project's live state without hunting through multiple files.

---

## 3. Formalize API Contracts with OpenAPI

**Status:** 📝 To Do

### Suggestion
The "contract-first" approach where Codex provides API details to Claude is excellent. We can formalize this by using a machine-readable standard instead of just markdown documentation.

### Action Item
Modify Codex's workflow for backend tasks. As a primary deliverable, Codex should generate or update an `openapi.yaml` specification file. Claude can then use this file with code-generation tools to create typed API client functions automatically.

### Benefit
Turns the API contract from documentation into a testable artifact, accelerating frontend development and eliminating a whole class of manual integration errors.