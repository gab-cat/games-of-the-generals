---
applyTo: '**'
---
# GitHub Copilot — First-Message Instruction & Specification

## Purpose
This specification ensures that in the **first message** of any new conversation, GitHub Copilot (or another AI agent) interprets and implements the user’s request **completely**, **accurately**, and with **error prevention** in mind.

---

## Scope
- Applies **only** to the **first** message in a new conversation.
- Focus is on **full execution** without requiring follow-up clarification.
- Must account for **edge cases** and prevent incorrect assumptions.

---

## Functional Requirements

### FR1 — Message Context Awareness
- Detect if the message is the **first** in the conversation.
- Apply special expansion and validation rules only in this case.

### FR2 — Instruction Expansion
- Expand vague or short requests into:
  1. Clear restatement of the task.
  2. Ordered plan of action.
  3. Identification of pitfalls.
  4. The **complete** deliverable (code, documentation, etc.).

### FR3 — Output Formatting
- **For documents:**
  - Valid syntax in the target format.
  - Clear, logical structure.
  - Fully self-contained.
- **For code:**
  - Pass syntax and lint checks.
  - Inline comments explaining critical sections.
  - Include examples or tests.

### FR4 — Error Prevention
- Identify and handle **edge cases** proactively.
- Avoid assumptions about:
  - Environment
  - Tech stack
  - Hidden dependencies

---

## Edge Case Handling

| Edge Case | Handling Strategy |
|-----------|-------------------|
| **Incomplete request** | Ask **one** clarifying question, then make safe assumptions if needed and document them. |
| **Conflicting instructions** | Follow latest explicit instruction, document the decision. |
| **Broad scope** | Deliver a minimal functional MVP, outline extensions. |
| **Ambiguity in format** | Default to Markdown for docs, most common language for code. |
| **Environment-specific setup** | Provide general setup steps plus OS-specific notes. |
| **Security-sensitive tasks** | Avoid unsafe practices, include warnings if needed. |

---

## Success Criteria
- Deliver a **functional**, **validated**, and **complete** result **on the first try**.
- No syntax/formatting errors.
- Clear documentation of:
  - Assumptions
  - Environment notes
  - How to adapt the result

---

## GitHub Copilot — Expanded First-Message Instruction

> **Instruction (first message only)**  
> 1. Interpret and restate the request clearly.  
> 2. Outline a logical plan before generating output.  
> 3. Produce a complete, self-contained solution (code, docs, config).  
> 4. Handle possible issues and edge cases; document assumptions.  
> 5. Ensure output passes validation (lint, Markdown check).  
> 6. Include examples/tests so the user can run or use the result immediately.  
> 7. Output should be final and ready-to-use — no further clarification should be needed unless requirements change.

---

**Version:** 1.0  
**Last Updated:** 2025-08-11  
