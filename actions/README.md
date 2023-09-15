## Build

Each action supports the default `npm run` commands to `build`, `test` and `serve`.

To build the action run 

```
npm run build
```

This will build in development mode. To build for production use

```
npm run build -- --mode production
```

## Development

To run the tests run

```
npm run test
```

To run the action locally run

```
npm run serve
```

That will build the action code inside an express app, with [src/express.js](src/express.js) as entry point watching any changes. In parallel it will run the webpack output in a self-restarting node process.

The express app listens on port 3030 and handles incoming requests for *.html and *.md files, applying the import.js transformations. 

The app uses [dotenv](https://www.npmjs.com/package/dotenv) to read environment configurations for `AEM_HOST`, `AEM_USER`, `AEM_PASSWORD` and `AEM_WCMMODE`.

The node process can be debugged using for example the Chrome developer tools. Source maps are available.

To test the converter run:

```
curl http://localhost:3030/index.md?wcmmode=disabled
```

## Deployment

The actions built and deployed by a [github workflow](../../.github/workflows/deploy-action-convert.yaml). Each branch with changes to any of the files used by the action will automatically trigger a deployment to a package named after the branch.

To deploy the action manually use the App Builder CLI. The [Getting Started guide for AIO Runtime](https://developer.adobe.com/runtime/docs/guides/getting-started/setup/#creating-a-namespace-and-retrieving-the-credentials) provides detailed steps to setup a local environment. 

It is recommended to deploy the current work-in-progress into a separate package, e.g. using your username. Remember, the branch name will be used by the automated deployment. To change the package name, modify the [app.config.yaml](./app.config.yaml).

```
aio app deploy
```
