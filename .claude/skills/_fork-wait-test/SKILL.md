---
name: fork-wait-test
description: Diagnostic only. Not for real use.
context: fork
agent: general-purpose
---

This is a diagnostic test, not a real task. Call Bash with EXACTLY these
parameters: command="sleep 200", run_in_background=true,
description="diagnostic wait 200s". Do not modify the command, do not add
anything else to it, do not retry with a different form if it fails.

Report back the COMPLETE, VERBATIM tool result you got back from that single
Bash call — every field, the full text, no summarizing, no paraphrasing. If
it errored, paste the entire raw error text. If it succeeded, paste the
entire raw success text (task id, output file path, etc). That verbatim dump
is your entire final message — nothing else.
test PR marker 2026-08-30T18:37:11Z
