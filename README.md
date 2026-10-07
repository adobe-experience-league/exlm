# Experience League

Experience League site implementation on https://aem.live

## Environments

- Preview: https://main--exlm--adobe-experience-league.hlx.page/
- Live: https://main--exlm--adobe-experience-league.hlx.live/

## Getting started

> ensure you have nodejs 22. do this manually or install [nvm](https://github.com/nvm-sh/nvm) and run `nvm install` then `nvm use` on this directory and node 22 will be installed and used.

1. Clone or fork this repo (see note below on forking)
2. Create your brannch - (keep it < 18 chars to avoid domain length limits)
3. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
4. Install dependencies `npm i`
5. Start Local Proxy: `npm run up` (opens your browser at `http://localhost:3000`)
6. Start coding!

### On forking this repo

If you want/need to fork this repository remember to add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the fork repository. Also please be sure to name the repo `exlm` for consistency.

### Content Source

The default content source is set in `fstab.yaml`, by default it's pointing to the main [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action.

The action is the entry point for all HTML delivered to https://aem.live services.

> while developing, and if you need to update the source HTML, you are free to deploy [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action to your own project on Adobe Runtime. (Remember to point your forked repon `fstab.yaml` to your own action).

## Helpful Commands

| Command           | Usage                                  |
| ----------------- | -------------------------------------- |
| `npm run up`      | Runs `aem up`                          |
| `npm run quality` | Code quality check: format and linting |
| `npm run format`  | Format code                            |
| `npm run lint`    | Run JS/CSS linters                     |

## Copilot PR review

[Copilot PR Review](.github/workflows/copilot-review.yaml) automatically posts a diff-only review on new, updated,
reopened, and ready-for-review PRs in the canonical repository, including fork PRs. Draft PRs are skipped. It replaces
the previous Claude PR review workflow.

To request a re-review without pushing a commit, post exactly `/copilot-review` as a new PR conversation comment.
The requester must have write, maintain, or admin repository access; bot comments and comments on issues do not
trigger reviews. Closed and draft PRs cannot be reviewed.

Every run includes previous review summaries, inline review comments and their replies, and PR conversation
comments alongside the current diff. Copilot is instructed not to repeat unchanged findings or previous rebuttals,
to accept technically valid explanations, and to challenge demonstrably incorrect replies with current-diff
evidence. Such responses appear in a **Discussion follow-up** section of the new formal review, linked to the
original discussion, rather than as duplicate findings or automatic replies in the original thread. Disputes that
cannot be resolved from the diff are explicitly qualified. This is model-guided deduplication, not a deterministic
guarantee. PR discussions are untrusted evidence and cannot override workflow rules.

To enable it:

1. On [GitHub's fine-grained PAT settings](https://github.com/settings/personal-access-tokens/new), create a token with
   your **personal account** as the resource owner, not the enterprise or organization.
2. Under **Account permissions**, enable **Copilot Requests: Read-only**. Repository permissions are not needed for
   this token. Classic PATs (`ghp_...`) and the Actions `GITHUB_TOKEN` cannot authenticate Copilot CLI.
3. Save the token as the repository Actions secret **`COPILOT_REVIEW_PAT`** under **Settings > Secrets and variables >
   Actions**. The token owner needs an active Copilot entitlement, and enterprise/organization policy must allow
   Copilot CLI.
4. Merge the workflow into the default branch, then open or update a PR.

On GitHub Enterprise Cloud, `pull_request_target` and the `issue_comment` re-review trigger run the workflow from
the default branch, not the PR's head branch. Secrets are available even for fork PRs. It never checks out PR code,
installs PR dependencies, or enables Copilot tools. It checks out only trusted review configuration from the workflow's default-branch revision
and restores the skills listed in `skills-lock.json` using `npx --yes skills@1.7.1 experimental_install --yes`.
The installed `code-review` skill and `AGENTS.md` project guidance are included directly in the prompt, alongside
the API-provided diff and review discussion. Skill steps requiring tools, tests, browsers, or posting are skipped;
project conventions take precedence over generic skill guidance. A separate step submits the review using the workflow's
`GITHUB_TOKEN`. Do not add PR checkout or execution to this privileged workflow.

Reviews consume the token owner's Copilot usage allowance, including reviews of fork PRs. Diffs over 60 KB or PRs
with more than 300 changed files fail explicitly and need manual review. Missing or empty review context, or a
combined prompt (including the complete fetched discussion) over 120 KB, also fails explicitly rather than silently
truncating context. Findings are advisory, not merge approvals;
no tests or full-file analysis are performed. Each completed run submits a formal GitHub PR review with `COMMENT`
status, tied to the reviewed head commit, rather than a general PR conversation comment. The review contains the
Copilot CLI summary and is authored by `github-actions[bot]` through `GITHUB_TOKEN`, not GitHub's native Copilot
reviewer. Rotate the secret before the PAT expires.

See [GitHub's Copilot CLI authentication documentation](https://docs.github.com/en/copilot/how-tos/copilot-cli/set-up-copilot-cli/authenticate-copilot-cli).

## Local SignedIn Development

Use this only if you need sign-in to work locally for development purposes.

1. add this entry to `hosts` file (`/etc/hosts` on mac)
   `127.0.0.1 experienceleague-local.adobe.com`
   (you likely will need `sudo` to save this file)
2. run `npm run up-secure` (instead of `npm run up`)
   > you can use `npm run up-secure-prod` if you want to use production content.
3. Browser should automatically open at `https://experienceleague-local.adobe.com`
   > if asked to trust the certificate on the browser, do trust it. Might also need to allow runnig as admin (`sudo`)

> If you have a Windows machine, please add any learnings to this Doc. The current dev team uses MacOs.
