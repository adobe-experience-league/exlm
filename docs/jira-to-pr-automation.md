# Jira → PR Automation

Turns a JIRA story into a **draft** PR by running the headless `auto-build` skill in
GitHub Actions. See the design spec at
`docs/superpowers/specs/2026-07-23-jira-to-pr-automation-design.md`.

## Required GitHub secrets

Configure under repo Settings → Secrets and variables → Actions:

| Secret                    | Purpose                                                                                                                                                     |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE_CODE_OAUTH_TOKEN` | Claude auth for `claude-code-action` (already used by `claude.yaml`)                                                                                        |
| `UPDATE_PR_GITHUB_TOKEN`  | PAT used to push the branch and open the draft PR (already exists). Being a PAT, the auto-created draft PR triggers the existing Claude PR Review workflow. |
| `JIRA_BASE_URL`           | e.g. `https://jira.corp.adobe.com`                                                                                                                          |
| `JIRA_PAT`                | JIRA personal access token (read ticket + post comments)                                                                                                    |

## Triggering

### Option A — JIRA Automation rule

Add a rule (e.g. when a story enters "Ready for Dev") with a **Send web request**
action:

- URL: `https://api.github.com/repos/adobe-experience-league/exlm/dispatches`
- Method: `POST`
- Headers:
  - `Authorization: Bearer <GitHub PAT with repo scope>`
  - `Accept: application/vnd.github+json`
- Body:
  ```json
  { "event_type": "jira-build", "client_payload": { "ticket": "{{issue.key}}" } }
  ```

### Option B — Manual / script

```bash
curl -X POST \
  -H "Authorization: Bearer <GitHub PAT with repo scope>" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/repos/adobe-experience-league/exlm/dispatches \
  -d '{ "event_type": "jira-build", "client_payload": { "ticket": "EXLM-1234" } }'
```

### Option C — GitHub Actions UI

Run the **Jira to PR** workflow via _Run workflow_ and supply the `ticket` input.

## What the automation produces

- A branch `<ticket-lowercased>` and a **draft** PR with a `What was implemented` and
  an `Open Questions / Gaps` section.
- A JIRA comment summarising what was done, listing open questions/blockers, and
  linking the draft PR plus the preview URL
  (`https://<branch>--exlm--adobe-experience-league.aem.live`).

The PR is always a draft — review it and mark it ready when satisfied.

## Notes

- The GitHub PAT the _caller_ uses (Options A/B) needs `repo` scope on
  `adobe-experience-league/exlm`; it is separate from `UPDATE_PR_GITHUB_TOKEN`.
- The automation never transitions the JIRA workflow state; it only comments.
- **Skill delivery (temporary):** the `auto-build` skill is currently force-committed
  to the automation branch (the skill directories are otherwise gitignored). The
  intended end state is to publish `auto-build` to the `AdobeEXL/exl-dev-ai` skills
  repo and add it to `skills-lock.json`, then remove the force-committed copy so
  `npx skills experimental_install` restores it like every other skill.
