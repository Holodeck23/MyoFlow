#!/bin/bash

# Wrapper script to enforce logging to AGENT_ACTIVITY_LOG.md on each commit.
#
# USAGE:
#   ./scripts/git-commit-and-log.sh -m "Your commit message"
#   ./scripts/git-commit-and-log.sh -am "Your commit message for staged files"
#
# It will:
# 1. Execute the git commit command with all provided arguments.
# 2. If the commit is successful, prompt for a one-line summary for the activity log.
# 3. Prepend a formatted entry to AGENT_ACTIVITY_LOG.md.

# --- Configuration ---
LOG_FILE="AGENT_ACTIVITY_LOG.md"

# --- Git Commit ---
# Execute the git commit command with all arguments passed to the script.
git commit "$@"

# Check if the commit command was successful. If not, exit.
if [ $? -ne 0 ]; then
  echo "Git commit failed. Aborting log entry."
  exit 1
fi

# --- Prompt for Log Summary ---
echo "" # Add a newline for spacing
read -p "Enter one-line summary for AGENT_ACTIVITY_LOG.md: " summary

if [ -z "$summary" ]; then
  echo "No summary provided. Skipping log entry."
  exit 0
fi

# --- Gather Context ---
BRANCH_NAME=$(git rev-parse --abbrev-ref HEAD)
TIMESTAMP=$(date +"%Y-%m-%d %H:%M %Z")

# --- Prepare Log Entry ---
LOG_ENTRY="## 🗣️ Commit Log - ${TIMESTAMP}
**Branch:** \`${BRANCH_NAME}\`
**Summary:** ${summary}

---
"

# --- Prepend to Log File ---
# Create a temporary file, add the new entry, append the old content, and replace the original.
echo -e "${LOG_ENTRY}\n$(cat ${LOG_FILE})" > ${LOG_FILE}

echo "✅ Successfully committed and updated ${LOG_FILE}."