# Contributing to Node-Lightning

Node-Lightning uses the open source model where all are welcome to contribute to the development, review, documentation, and testing process regardless of skill level or expertise. Due to the diffficulty, complexity, and impact of errors the final merging process must be rigorous. So you can expect some back and forth to help us understand how you will be making changes and to ensure that the code maintains the standards of the project. That said, our goal with this project is to create an approachable implementation of Lightning, we encourage contributors to not be afraid to contribute and learn! Software is an iterative process!

## Creating Pull Requests

Before creating a pull request you should create an issue, if one does not already exist, to track the change(s) you will be making. This creates a place for a broader discussion about the reason and intent of changes. Once an issue has been acknowledged, you can submit a pull request.

This project uses the [GitHub workflow](https://guides.github.com/introduction/flow/). Outside contributors to the project can create patches by forking the repository, creating a branch, and then submitting a pull request on GitHub. The pull request will be reviewed by the project maintainers. After the changes have been reviewed and the code passes CI, the code can be merged into the master branch. The review process will likely have a conversation and back and forth on changes that should be made to make the patch ready for merge.

For facilitate the back and forth while you are developing, you can create a [_draft_ pull request](https://github.blog/2019-02-14-introducing-draft-pull-requests/) early in your development process. The draft pull request will allow discussion of code and architecture and will signal that the code is still a work in progress. We highly recommend this since it helps make get eyes on code earlier in the process making coding more collaborative.

When making commits in your pull requests they should be atomic and minimal. Please do not submit large single commits or mix minor changes with major changes. We may ask you to restructure your commits. Well structured commits allow each to reviewed indpendently and should pass CI on their own. Commit messages should follow the format:

```
area: general description of the change

Longer description of what changed and a description
of why the change is occuring and how it was fixed.

Refence issue numbers
```

Please wrap commit comments at 72 characters. [More information](https://chris.beams.io/posts/git-commit/) on writing good commit messages.

To facilitate clean commit messages and the review process you will likely need to use interactive rebase for commits.

```
git rebase -i <sha1-of-commit>
```

You can then mark the commit that should change with `edit`, commit your changes, and continue the rebase. More information on [stackoverflow](https://stackoverflow.com/a/8825163).


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


## Releases

Lerna is used to manage the Node-Lightning monorepo. Independent versioning is currently being used for packages.

When code changes in a package, Lerna will detect this change and update the version for the package and all packages that depend on the changed package. These versions will be tagged.
