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
reopened, and ready-for-review PRs in the canonical repository, including fork PRs. Draft PRs are skipped. The existing
Claude review workflow is unchanged.

To enable it:

1. On [GitHub's fine-grained PAT settings](https://github.com/settings/personal-access-tokens/new), create a token with
   your **personal account** as the resource owner, not the enterprise or organization.
2. Under **Account permissions**, enable **Copilot Requests**. Repository write permissions are not needed for this
   token. Classic PATs (`ghp_...`) and the Actions `GITHUB_TOKEN` cannot authenticate Copilot CLI.
3. Save the token as the repository Actions secret **`COPILOT_REVIEW_PAT`** under **Settings > Secrets and variables >
   Actions**. The token owner needs an active Copilot entitlement, and enterprise/organization policy must allow
   Copilot CLI.
4. Merge the workflow into the default branch, then open or update a PR.

The workflow uses `pull_request_target` so secrets are available for fork PRs. It never checks out PR code, installs
PR dependencies, or enables Copilot tools. Only the API-provided diff is sent for review; a separate step posts the
summary using the workflow's `GITHUB_TOKEN`. Do not add PR checkout or execution to this privileged workflow.

Reviews consume the token owner's Copilot usage allowance, including reviews of fork PRs. Diffs over 60 KB or PRs
with more than 300 changed files fail explicitly and need manual review. Findings are advisory, not merge approvals;
no tests or full-file analysis are performed. Each completed run posts a new summary comment. Rotate the secret
before the PAT expires.

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
