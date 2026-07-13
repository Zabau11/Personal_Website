<!-- groveyard:start -->
<!-- groveyard:version 2 -->
## Groveyard workspace policy

Before changing code, call list_sessions and consider only active and completed sessions as continuable.
If the request is to continue, review, validate, commit, clean, or discuss existing work, never create a new session.
Choose an exact session ID or branch match when present, otherwise the single clearly matching task; if several sessions could match, ask the user and show the task name, status, branch, and session ID.
Call resume_session before editing a completed match.
Only call start_session for a clearly new code-changing request with no matching session.
Work only in the workspace returned by Groveyard or the existing workspace named by resume_session.
Validate the session before declaring the task complete.
Do not remove a dirty workspace without explicit user approval.
<!-- groveyard:end -->
