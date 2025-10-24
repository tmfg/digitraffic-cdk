# Development guide

Note: package-lock.json files are kept in version control to keep project
dependencies in sync. This is not an optimal solution but the CDK Constructs
library is a constant source of compilation errors even with patch version
changes.

## Prerequisites

1. Install Prerequisites
   - awscli entr
     ```
     brew update
     brew install awscli entr
     ```
   - [Command Line Tools for Xcode](https://developer.apple.com/download/more/?q=Command%20Line%20Tools)

2. Init rush, (e.g., installs Git hooks).

```shell
rush install
```

Later if you do changes to hooks, just run `rush install` again.

Hooks are defined in [common/git-hooks](common/git-hooks) and currently
pre-commit hook reorders package.json and other files are formated with deno
fmt.

## Workflow

1. Checkout this repository.
2. Run `pnpm run:hardlink` in ci-project to update properties hardlinks to cdk
   project
3. Run install_all.sh to install all projects' dependencies
4. Cd into your project directory
5. Execute pnpm run all-watch (compiles TypeScript and bundles Lambdas)
6. Develop!

One-off builds can also be run with `pnpm build`

## Formatting files

Formating is done before commit with
[common/git-hooks/pre-commit](common/git-hooks/pre-commit)

Manually formatting can be done with the following commands.

Format code is done with `deno fmt` that can be run with

    rush run:format

To format package.json files run

    rush run:format-package-json

## Creating a new project

Copy a template project from template/esm as a base. Change the project name in
package.json.\
Also update rush.json to include new project.

## Adding dependencies

`<project>` is the `name` in `package.json` -file.

For runtime dependencies:

```sh
cd <project>
pnpm add dependencyname
```

For development dependencies:

```sh
cd <project>
pnpm add --dev dependencyname
```

After adding a dependency, remember to commit the changes made to pnpm.lock.

## Updating all dependencies

Run the script [update-deps.sh](update-deps.sh). This script updates all
dependencies to their latest patch version and compiles projects. Any
compilation errors should be fixed before committing dependency changes.

## Running tests

1. Check the project README.md if a database Docker container is needed.
2. Run `pnpm test`

## IDE debugging from IntelliJ IDEA

1. Install the Node.js plugin
2. Import the run configurations from runConfigurations
3. Make sure Python is available in /usr/bin/python or edit the Run Lambda run
   configuration
4. Generate a no-staging template.yaml by running
   `pnpm run synth-sam -- StackName`
5. Run the Attach Node.js debugger run configuration
6. Create a breakpoint in a TypeScript file
7. Select a Lambda
8. Wait for execution to reach breakpoint

## Subtree commands

    rush common-subtree -h
    rush common-subtree -c pull -r master
    rush common-subtree -c push -r master
