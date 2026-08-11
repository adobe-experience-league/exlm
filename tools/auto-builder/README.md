# auto-builder — scheduled JIRA → `/auto-build` runner

Automatically builds JIRA stories on your machine. Every 30 minutes it finds stories
labelled **`auto-build`** and, for each one, runs the repo's headless
[`/auto-build <TICKET>`](../../.agents/skills/auto-build/SKILL.md) skill — which fetches
the ticket, implements it best-effort, and opens a **draft** PR with a JIRA comment.

You install it **once**; after that the OS runs it for you on boot/login and on interval.
No terminal, no `npm run`, nothing to remember.

## Label lifecycle

| Label                 | Meaning                                                    |
| --------------------- | ---------------------------------------------------------- |
| `auto-build`          | You (a human) add this to request a build. Kept for audit. |
| `auto-building`       | Poller claimed it and is building now.                     |
| `auto-build-complete` | Build finished, draft PR opened.                           |
| `auto-build-failed`   | Build errored/timed out — needs human triage.              |

Only tickets with `auto-build` and none of the other three are picked up, so nothing is
ever built twice.

## Won't disturb your work

Builds run in a **dedicated git worktree** — a linked working copy that shares this repo's `.git`
object store — never in your primary checkout. So the poller can build while you're on any branch,
even with uncommitted changes, and it never touches your files or switches your branch. It never
needs to skip a tick for workspace reasons. (It also holds a PID lock, so a long build never
overlaps with the next scheduled tick.)

The worktree is created on first run (default: a sibling dir `../exlm-auto-build-workspace`) and
reused. Each ticket is built on a fresh branch cut from the latest `origin/main`. Your `.env` is
copied in and `node_modules` is symlinked so lint/commit hooks work.

## Prerequisites

- **VPN** connected (JIRA is internal). If it's down, the poller logs a skip and exits — never errors.
- **Node ≥ 18** and the **`claude`** CLI on your PATH.
- Repo-root **`.env`** with `JIRA_BASE_URL`, `JIRA_PAT`, `GITHUB_TOKEN` (already used by `/auto-build`).
  Optionally set `BASE_BRANCH` to override which branch ticket branches are cut from (default `main`).

## Configure

Edit [`config.json`](./config.json):

```json
{ "assigneeScope": "me", "pollIntervalSeconds": 1800, "worktreePath": "" }
```

- `assigneeScope`: `"me"` = only stories assigned to you (default, safest). `"any"` = every
  labelled story in scope.
- `pollIntervalSeconds`: how often to poll. **Re-run the installer after changing this** so the
  scheduler picks up the new interval.
- `worktreePath`: where the isolated build worktree lives. Empty = default sibling dir
  `../exlm-auto-build-workspace`. Set an absolute or repo-relative path to override.

## Per-assignee credentials (optional — needed once `assigneeScope` isn't `"me"`)

By default every ticket builds using **your** `.env` (`JIRA_PAT`, `GITHUB_TOKEN`) and **your**
`CLAUDE_CODE_OAUTH_TOKEN` — fine if the poller only ever picks up your own tickets. Once
`assigneeScope` is `"any"`/`"everyone"`, the poller can claim tickets assigned to other people, and
without per-assignee credentials it would still build and open PRs using your tokens for their
work.

To fix that, copy [`credentials.example.json`](./credentials.example.json) to
`tools/auto-builder/credentials.json` (gitignored — never commit it) and add one entry per JIRA
assignee, keyed by their JIRA account email:

```json
{
  "jane.doe@adobe.com": {
    "jiraPat": "jane's JIRA personal access token",
    "githubToken": "jane's GitHub fine-grained PAT, scoped to this repo only",
    "claudeToken": "jane's CLAUDE_CODE_OAUTH_TOKEN, from `claude setup-token`"
  }
}
```

For each ticket, the poller looks up the ticket's JIRA assignee email in this map:

- **Match found** — that person's `jiraPat`/`githubToken` are used for the JIRA label updates,
  JIRA comment, and PR (so the PR opens as them), and their `claudeToken` runs the `/auto-build`
  skill (so usage attributes to them). Any of the three fields left blank falls back to your `.env`
  / process default for just that field.
- **No match** (unassigned ticket, or an assignee not yet added) — the ticket builds using your
  `.env`/process defaults, same as today. The poller log records which identity was used for every
  ticket, so unmapped assignees are easy to spot and add.

**If an assignee's `jiraPat` is invalid/expired**, the build itself fails fast (the `/auto-build`
skill's own auth check catches it), and the poller falls back to your default `.env` `JIRA_PAT`
_only_ to write the `auto-build-failed` label — otherwise that ticket could never be labeled at
all and would retry from scratch on every poll tick, forever. That fallback touches only the JIRA
label call: it never reruns the build under your `claudeToken`, so a bad assignee credential can't
cause their ticket to silently build/PR under your Claude identity instead.

## Teams notifications (optional)

When a build finishes, the poller can post an Adaptive Card to a Teams channel/chat — on success
with the ticket, PR link, and preview URL; on failure with the ticket and a short reason, so a
human notices without having to poll JIRA labels or the poller log. It's off unless
`TEAMS_WEBHOOK_URL` is set in `.env`.

Microsoft is retiring the old "Incoming Webhook" O365 connectors, so use a **Teams Workflow**
(Power Automate):

1. In Teams, open the target channel → **⋯ → Workflows** (or **Workflows** app → **+ New flow**).
2. Pick the template **"Post to a channel when a webhook request is received"** (or the chat
   variant). Complete it and copy the generated **HTTP POST URL**.
3. Add it to the repo-root `.env` (it's a secret — anyone with the URL can post):

   ```
   TEAMS_WEBHOOK_URL=https://prod-XX.westus.logic.azure.com:443/workflows/...
   ```

That's it — the poller posts on every completed run, success or failure. The card payload is the
standard `{ "type": "message", "attachments": [ <AdaptiveCard> ] }` the Workflow template expects;
a failure card leaves `prUrl`/`prTitle`/`prNumber`/`previewUrl` blank and sets `status` to
`Failed — needs triage` plus a `reason` field. Delivery failures are logged and never fail a build.

## Install (once per machine)

```bash
# 1. Optional dry-run first (label a test ticket, watch it build)
node tools/auto-builder/poller.mjs

# 2. Register the scheduler — from here it auto-runs forever
bash tools/auto-builder/install.sh          # macOS / Linux
# Windows (PowerShell):
powershell -ExecutionPolicy Bypass -File tools\auto-builder\install.ps1
```

The installer detects your `node` and `claude` paths and bakes them into the scheduler entry
(schedulers don't inherit your shell PATH — this is the #1 gotcha). It uses launchd on macOS,
a systemd user timer (or cron fallback) on Linux, and Task Scheduler on Windows.

## Verify it's running

**Is it installed/loaded?**

```bash
launchctl list | grep exlm                         # macOS — look for a 0 exit status
systemctl --user status exlm-auto-build-poller.timer   # Linux (systemd)
crontab -l | grep poller.mjs                       # Linux (cron fallback)
schtasks /Query /TN "EXLM Auto-Build Poller"        # Windows
```

**Is it actually ticking?** Tail the poller activity log (see [Logs](#logs) below) — each tick
logs a VPN/JIRA check and any tickets found, even when there's nothing to build.

**Did it crash before the log even opened?** Check the raw scheduler stdout/stderr
(launchd `.stdout.log`/`.stderr.log`, `journalctl --user -u exlm-auto-build-poller.service`, or
Task Scheduler history).

**Force a tick now and watch it land:**

```bash
launchctl kickstart -k gui/$(id -u)/com.exlm.auto-build-poller   # macOS
systemctl --user start exlm-auto-build-poller.service            # Linux
schtasks /Run /TN "EXLM Auto-Build Poller"                       # Windows
```

Then `tail -f` the poller log and confirm a fresh entry shows up.

## Logs

**Poller activity log** (the one you'll read) — `exlm-auto-build-poller.log` in your OS log dir:

| OS      | Path                                                                                        |
| ------- | ------------------------------------------------------------------------------------------- |
| macOS   | `~/Library/Logs/exlm-auto-build-poller.log`                                                 |
| Linux   | `$XDG_STATE_HOME/exlm-auto-build-poller.log` or `~/.local/state/exlm-auto-build-poller.log` |
| Windows | `%LOCALAPPDATA%\exlm-auto-build-poller.log`                                                 |

Falls back to the OS temp dir if that directory can't be created.

**Scheduler raw stdout/stderr** (crash safety net, before the log opens): launchd →
`~/Library/Logs/com.exlm.auto-build-poller.{stdout,stderr}.log`; cron fallback →
`…/com.exlm.auto-build-poller.cron.log`; systemd → `journalctl --user -u
exlm-auto-build-poller.service`; Windows → Task Scheduler history / Event Viewer.

## Force a run / uninstall

```bash
# force one run now
launchctl kickstart -k gui/$(id -u)/com.exlm.auto-build-poller   # macOS
systemctl --user start exlm-auto-build-poller.service            # Linux
schtasks /Run /TN "EXLM Auto-Build Poller"                       # Windows

# uninstall / pause
bash tools/auto-builder/uninstall.sh                             # macOS / Linux
powershell -ExecutionPolicy Bypass -File tools\auto-builder\uninstall.ps1   # Windows
```

The build worktree is left in place. To remove it too:
`git worktree remove ../exlm-auto-build-workspace --force` (adjust the path if you set `worktreePath`).

## ⚠️ Security — read before enabling

The poller runs `claude … --dangerously-skip-permissions`, so every tool call `/auto-build`
makes (arbitrary Bash, `git push`, `curl`, file writes) runs **unattended with no human
approval** whenever a matching ticket appears.

- The safety boundary is that `/auto-build` always opens a **draft PR** — a human still reviews before merge.
- Keep `assigneeScope=me` unless you have a reason to widen it.
- JIRA ticket text is attacker-influenceable (prompt injection into unattended Bash).
  Mitigate: restrict who can apply the `auto-build` label, keep `GITHUB_TOKEN` a
  **fine-grained PAT scoped to this repo only**, and audit the log periodically.
- Don't run this on an account whose `.env` `GITHUB_TOKEN` reaches other private repos.
- If you use `credentials.json`, it holds multiple people's PATs/OAuth tokens in one plaintext
  file on the machine running the poller — keep it gitignored (already set up), restrict file
  permissions (`chmod 600 tools/auto-builder/credentials.json`), and only run the poller on a
  machine/account the whole team already trusts with those tokens.
