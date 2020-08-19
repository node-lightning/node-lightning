# Contributing to Node-Lightning

This is a preliminary contribution guide.

## Developer Setup

1. Checkout source code

```
git clone https://github.com/altangent/node-lightning
cd node-lightning
```

2. Run npm install to install the development tools

```
npm install
```

3. Run Lerna bootstrap to run installation and builds for each module

```
npm run bootstrap
```

You are now ready develop on any of the modules.

## Node-Lightning Packages

All packages live inside the `packages` directory.

Packages are logically divided by code areas that would be useful for independent inclusion by a consumer. Packages are published on NPM using the `@node-lightning` organization and have names such as `@node-lightning/wire` or `@node-lightning/invoice`.

Err on the side of including code inside an existing package. Code can be split into its own package if necessary.

Each package should:

-   Not have any dev dependencies
-   Not have any external dependencies
-   Use a `package.json`:
    -   Includes run commands for `test`, `lint`, `ci`, and `prepublish`
    -   Links to the package README as the home page
    -   Links to the Node-Lightning repository
    ```json
    {
        "name": "@node-lightning/<NAME>",
        "version": "0.1.0",
        "description": "<DESCRIPTION",
        "scripts": {
            "test": "../../node_modules/.bin/nyc --reporter=lcov --reporter=text --extension=.ts ../../node_modules/.bin/mocha --require ts-node/register --recursive \"__tests__/**/*.spec.*\"",
            "lint": "../../node_modules/.bin/tslint --project tsconfig.json --config ../../tslint.json",
            "build": "../../node_modules/.bin/tsc --project tsconfig.json",
            "prepublish": "npm run build"
        },
        "keywords": [],
        "author": "NAME",
        "homepage": "https://github.com/altangent/node-lightning/tree/master/packages/<NAME>",
        "license": "MIT",
        "main": "dist/index.js",
        "repository": {
            "type": "git",
            "url": "git+https://github.com/altangent/node-lightning.git"
        },
        "dependencies": {},
        "publishConfig": {
            "access": "public"
        }
    }
    ```
-   Use it's own `tsconfig.json` that extends the root `tsconfig.json` file.

    ```json
    {
        "extends": "../../tsconfig.json",
        "compilerOptions": {
            "outDir": "./dist"
        },
        "include": ["./lib"]
    }
    ```

-   Source code lives inside of the `lib` folder
-   Test code lives inside of the `__tests__` folder
-   Create a README with description of the package

## External Packages

Do not add external packages. Seriously. Do not add external packages.

The packages that HAVE been added have been reviewed and version pinned.

## Code Formatting

Node-Lightning uses prettier for automatic code formatting. You should have prettier auto-configured. In the future CI will automatically run a check with prettier and will fail if there are formatting problems.

In tests or examples with long buffer input, it is acceptable to use the `prettier-ignore` comment to prevent unnecessary wrapping.

## Linting

Prettier uses TSLint. Linting will be run on CI and builds will fail if there are lint error.

You can run linting inside of a project with:

```
npm run lint
```

## Testing

Appropriate test coverage should be added for new code or changes to existing code.

`npm test` can be run from within any module to ensure existing tests are not broken.

## Commenting

## Pull Requests

## Releases

Lerna is used to manage the Node-Lightning monorepo. Independent versioning is currently being used for packages.

When code changes in a package, Lerna will detect this change and update the version for the package and all packages that depend on the changed package. These versions will be tagged.
