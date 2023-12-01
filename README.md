# Experience League

Experience League site implementation on https://aem.live

## Environments

- Preview: https://main--exlm--adobe-experience-league.hlx.page/
- Live: https://main--exlm--adobe-experience-league.hlx.live/

## Getting started

1. Clone or fork this repo (see nopte bleow on forking)
2. Create your brannch
3. Install the [AEM CLI](https://github.com/adobe/aem-cli): `npm install -g @adobe/aem-cli`
4. Install deopendecies `npm i`
5. Start Local Proxy: `aem up` (opens your browser at `http://localhost:3000`)
6. Start coding!

### On forking this repo

If you want/need to fork this repository remember to add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the fork repository.

### Content Source

The default content source is set in `fstab.yaml`, by default it's pointing to the main [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action.

The action is the entry point for all HTML delivered to https://aem.live services.

> while developing, and if you need to update the source HTML, you are free to deploy [exlm-converter](https://github.com/adobe-experience-league/exlm-converter) action to your own project on Adobe Runtime. (Remember to point your forked repon `fstab.yaml` to your own action).

## Helpful Commands

### Linting

```sh
npm run lint
```

### Fix auto-fixable CSS lint issues

```sh
npm run quality
```

### Code Formatting

this should happen on commit automatically, but you can run manually with:

```sh
npm run format
```

### Code Quality Check

If you want to run all code quality scripts to ensure your PR will pass:

```sh
npm run quality
```

### Run sass auto-compile and Helix Pages

```sh
npm run up
```

The above command will run `node sass-compile.js` in parallel with `hlx up` which will start your local Helix Pages development environment.

### Note on SASS usage and Helix Local Development

The `npm run up` will parse the `styles` and `blocks` directory for any `.scss` files. Files that are found will be compiled to css and saved in the same location and name with a `.css` extension. It will then continue to watch for changes to `.scss` files and will compile to their associated CSS files on changes.

Examples:

- `{repo}/blocks/header/header.scss` will compile to `{repo}/blocks/header/header.css`
- `{repo}/styles/style.scss` will compile to `{repo}/styles/styles.css`

As both `sass-compile.js` and `hlx up` are watching for changes, changes made to your sass files while using the `rpm run up` command will be reflected automatically in your localhost.

Note that using only the `hlx up` command will not trigger updates on-change for sass files.
