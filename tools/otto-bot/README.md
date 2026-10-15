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
   sudo -u otto -H node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js users add --master
   sudo -u otto -H node /home/otto/exlm-otto/tools/otto-bot/bin/otto.js doctor
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
```

Configuration defaults are documented in `config.example.json`. The example intentionally contains no PATs or tokens; user credentials are stored separately by `otto users add`.
