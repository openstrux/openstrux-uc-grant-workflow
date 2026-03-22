Tests are still failing ({{passed}}/{{total}} passing, attempt {{attempt}}/{{maxRetries}}).

## Failing tests

{{failures}}

## Instructions

Before outputting any code, reason briefly about each failure group:
- What is the root cause? (type mismatch, missing export, wrong logic, etc.)
- Which file(s) need to change and why?

Then output only the corrected files using the standard fenced-block format.
Rules:
- Do NOT modify test files.
- Output complete file content for every file you change.
- If a failure spans multiple files, fix all of them.
