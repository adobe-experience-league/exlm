# otto-bot

Add the `otto` label to an EXLM Jira ticket and otto-bot opens a **draft** PR written by GitHub Copilot CLI.

| Label          | Set by   | Meaning                                      |
| -------------- | -------- | -------------------------------------------- |
| `otto`         | Human    | "Please open a PR for this ticket."          |
| `otto-working` | otto-bot | Claimed; the worker is running.              |
| `otto-done`    | otto-bot | Draft PR is open; the link is in a comment.  |
| `otto-failed`  | otto-bot | Something broke; the reason is in a comment. |

**Retry:** remove `otto-failed`, then add `otto` again. The same `exlm-1234` branch and PR are reused.

otto-bot acts as the ticket's **assignee** if they are onboarded, otherwise as the master account.
Copilot gets the ticket summary, description, and the latest human comments (up to 20, ~20k chars; otto's own comments are skipped). Attachments are not read, so copy anything important from a PDF or screenshot into the description or a comment.
Every otto-bot commit carries an `Otto-Run: <run id>` trailer; list them with `git log --grep '^Otto-Run:'`.
Design: [`docs/superpowers/specs/2026-10-14-otto-bot-design.md`](../../docs/superpowers/specs/2026-10-14-otto-bot-design.md).

## VM installation

The Rocky Linux VM runs `otto tick` through the `deploy/otto-bot.service` oneshot and `deploy/otto-bot.timer` systemd timer. The timer waits 5 minutes after the previous service run becomes inactive before starting the next tick.

1. Copy this repository's `tools/otto-bot/deploy/setup-vm.sh` to the VM.
2. Run it as root with the Copilot CLI version to pin:

   ```sh
   sudo bash setup-vm.sh <@github/copilot version, e.g. 1.0.0>
   ```

3. Edit `/home/otto/.config/otto-bot/config.json` if the defaults are not appropriate.
4. Add the master account and validate credentials:

   ```sh
   sudo -u otto -H env PATH=/home/otto/.npm-global/bin:$PATH node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js users add --master
   sudo -u otto -H env PATH=/home/otto/.npm-global/bin:$PATH node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js doctor
   ```

5. Enable the timer only after `otto doctor` passes:

   ```sh
   sudo systemctl enable --now otto-bot.timer
   ```

## CLI

```text
Usage:
  otto tick                          Poll Jira once and process at most one ticket (systemd runs this)
  otto run <KEY> [--dry-run]         Process one ticket now; --dry-run skips push, PR, and Jira writes
  otto doctor                        Check every identity's Jira, GitHub, and Copilot credentials
  otto users add <jira-username>     Onboard a teammate (prompts for tokens)
  otto users add --master            Set the master (fallback) account
  otto users list | remove <name>    List or remove onboarded teammates
  otto status                        Show the current run and recent history
  otto notify-test                   Send a test Slack message (needs slackWebhookUrl in config.json)
```

Configuration defaults are documented in `config.example.json`. The example intentionally contains no PATs or tokens; user credentials are stored separately by `otto users add`.

## Slack notifications

otto-bot posts to a Slack channel through a Workflow Builder webhook when a ticket is picked up, a draft PR is ready, a run fails or is interrupted, and when someone is onboarded with `otto users add`. Notifications are best-effort: a Slack problem is logged as a warning and never fails a ticket.

1. In Slack, create a workflow that starts **From a webhook** with these **Text** variables: `status`, `ticket`, `message`, `jira_link`, `pr_link`, and a **Slack user email** variable `owner`. Use `jira_link` and `pr_link` for the message's buttons and `owner` as a mention.
2. Publish it and put the webhook URL in `/home/otto/.config/otto-bot/config.json` as `"slackWebhookUrl"`. Treat the URL as a secret; otto-bot redacts it from its logs.
3. Run `otto notify-test`.

`owner` is the Git author email saved for the identity otto-bot acted as, so it must match that person's Slack account. Both links are always real `https://` URLs; when there is no PR yet, `pr_link` is a GitHub search for the ticket's branch.
