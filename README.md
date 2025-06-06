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
