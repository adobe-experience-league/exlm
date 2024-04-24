# Experience League

Experience League site implementation on https://aem.live

## Environments

- Preview: https://main--exlm--adobe-experience-league.hlx.page/
- Live: https://main--exlm--adobe-experience-league.hlx.live/

## Getting started

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
| `npm run up`      | Run SASS compilation and `aem up`      |
| `npm run quality` | Code quality check: format and linting |
| `npm run format`  | Format code                            |
| `npm run lint`    | Run JS/SASS linters                    |

### Note on SASS usage and Helix Local Development

The `npm run up` will parse the `styles` and `blocks` directory for any `.scss` files. Files that are found will be compiled to css and saved in the same location and name with a `.css` extension. It will then continue to watch for changes to `.scss` files and will compile to their associated CSS files on changes.

Examples:

- `{repo}/blocks/header/header.scss` will compile to `{repo}/blocks/header/header.css`
- `{repo}/styles/style.scss` will compile to `{repo}/styles/styles.css`

As both `sass-compile.js` and `hlx up` are watching for changes, changes made to your sass files while using the `rpm run up` command will be reflected automatically in your localhost.

Note that using only the `hlx up` command will not trigger updates on-change for sass files.

## Gotcha's

### Enabling login on feature branches

Login wont work on feature branches due to IMS restrictions, you must contact a team member to add your fork's main branch to the list of `Redirect Url Patterns` in IMSS. Please name your fork repo `exlm` to make this easier.

### Working with EXL API and Coveo in feature branches and incognito mode.

some of the EXL API's require CSRF tokens, said token depend on cookies set on the environment CDN URLs (`*.adobe.com`), your feature branch will be on `*.hlx.page`. Please be sure to [allow third party cookies in incognito](https://support.google.com/accounts/answer/61416?hl=en&co=GENIE.Platform%3DDesktop) while doing local development.
