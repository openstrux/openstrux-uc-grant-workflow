---
name: "OPSX: Continue"
description: Continue working on a change - create the next artifact (Experimental)
category: Workflow
tags: [workflow, artifacts, experimental]
---

Continue working on a change by creating the next artifact.

**Input**: Optionally specify a change name after `/opsx:continue` (e.g., `/opsx:continue add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

**Steps**

1. **If no change name provided, prompt for selection**

   List available changes:
   ```bash
   ls openspec/changes/
   ```

   Use the **AskUserQuestion tool** to let the user select which change to work on. Do NOT guess or auto-select a change.

2. **Check current status by reading the filesystem**

   For the **spec-driven schema** (the standard schema used by this project), the artifact sequence is:
   ```
   proposal.md → specs/<capability>/spec.md (one per capability) → design.md → tasks.md
   ```

   Check which artifacts exist:
   ```bash
   ls openspec/changes/<name>/
   ls openspec/changes/<name>/specs/ 2>/dev/null
   ```

   - An artifact that exists is **done**
   - The first artifact in sequence that does not exist is **ready**
   - Later artifacts (after the first missing one) are **blocked**

3. **Act based on status**:

   ---

   **If all artifacts are complete** (proposal.md + all spec files + design.md + tasks.md all exist):
   - Congratulate the user
   - Suggest: "All artifacts created! You can now implement this change with `/opsx:apply` or archive it with `/opsx:archive`."
   - STOP

   ---

   **If design.md is the next artifact to create**:
   - Read `openspec/changes/<name>/proposal.md`
   - Read all files under `openspec/changes/<name>/specs/`
   - Write `openspec/changes/<name>/design.md` with:
     - Key technical decisions for the implementation
     - How each acceptance criterion from the specs will be satisfied
     - Architecture and file structure choices
   - Show what was created
   - STOP after creating ONE artifact

   ---

   **If tasks.md is the next artifact to create**:
   - Read `openspec/changes/<name>/proposal.md`, all specs, and `openspec/changes/<name>/design.md`
   - Write `openspec/changes/<name>/tasks.md` with a checkboxed task list covering all acceptance criteria
   - Show what was created
   - STOP after creating ONE artifact

   ---

   **If specs are the next artifacts to create**:
   - Read `openspec/changes/<name>/proposal.md` to find the Capabilities section
   - Create one `openspec/changes/<name>/specs/<capability>/spec.md` per capability listed
   - STOP after creating the spec files for the current capability batch

4. **After creating an artifact, confirm it exists**
   ```bash
   ls openspec/changes/<name>/
   ```

**Output**

After each invocation, show:
- Which artifact was created
- Current progress (N/M complete)
- What artifacts are now unlocked
- Prompt: "Run `/opsx:continue` to create the next artifact"

**Artifact Creation Guidelines**

**spec-driven schema** (proposal → specs → design → tasks):
- **proposal.md**: Ask user about the change if not clear. Fill in Why, What Changes, Capabilities, Impact.
  - The Capabilities section is critical - each capability listed will need a spec file.
- **specs/<capability>/spec.md**: Create one spec per capability listed in the proposal's Capabilities section.
- **design.md**: Document technical decisions, architecture, and implementation approach.
- **tasks.md**: Break down implementation into checkboxed tasks.

**Guardrails**
- Create ONE artifact per invocation
- Always read dependency artifacts before creating a new one
- Never skip artifacts or create out of order
- If context is unclear, ask the user before creating
- Verify the artifact file exists after writing before reporting progress
