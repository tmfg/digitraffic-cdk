# Development guide

Note: package-lock.json files are kept in version control to keep project
dependencies in sync. This is not an optimal solution but the CDK Constructs
library is a constant source of compilation errors even with patch version
changes.

## Prerequisites

### 1. Install required tools
   - awscli entr
     ```
     brew update
     brew install awscli entr
     ```
   - [Command Line Tools for Xcode](https://developer.apple.com/download/more/?q=Command%20Line%20Tools)
   - Biome globally if you want to run it directly
     ```
     npm install -g @biomejs/biome
     biome --version
     ```

### 2. Init rush, (e.g., installs Git hooks).

Install all dependencies and git hooks centrally:
```shell
rush install
```
Install command line tools with auto installer that are used in various rush command-line scripts:
```shell
rush update-autoinstaller --name rush-command-line-tools
```

Finally run update to make sure all dependencies are up to date:
```shell
rush update
```

Later on you can just run `rush update` to update dependencies when you have done
changes to package.json or fetch update from vcs.

Later if you do changes to hooks, just run `rush install` again.

Hooks are defined in [common/git-hooks](common/git-hooks) and currently
pre-commit hook reorders package.json and other files are formated with biomejs .

## Workflow

1. Checkout this repository.
2. Run `pnpm run:hardlink` in ci-project to update properties hardlinks to cdk
   project
3. Run install_all.sh to install all projects' dependencies
4. Cd into your project directory
5. Execute pnpm run all-watch (compiles TypeScript and bundles Lambdas)
6. Develop!

One-off builds can also be run with `pnpm build`

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

Run the script update-deps.sh. This script updates all dependencies to their
latest patch version and compiles projects. Any compilation errors should be
fixed before committing dependency changes.

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

You can also define new branch to push changes with parameter
`-r feature/DPO-123` i.e. for pull request.

## Formatting/Linting files

Formatting and linting of file is done with BiomeJS and sort-package-json tools.

Formatting is done before commit with
[common/git-hooks/pre-commit](common/git-hooks/pre-commit)

It runs `rush format:package-json` and `rush format:fix-staged`. 

Manually formatting can be done with the following commands.

    rush format:package-json
                        Sorts all package.json files using sort-package-json
    
    rush format:check   
                        Runs Biome’s linting and formatting checks on the 
                        repo without modifying files.
    
    rush format:check-staged
                        Runs Biome’s linting and formatting checks only on 
                        staged files without modifying files.

    rush format:check-changed
                        Runs Biome’s linting and formatting checks only on
                        changed (according to Git) files without modifying
                        files.
    
    rush format:fix     
                        Runs Biome to check and automatically fix linting and 
                        formatting issues in the repo.
    
    rush format:fix-staged   
                        Runs Biome to check and automatically fix linting and 
                        formatting issues only in staged files.

    rush format:fix-changed  
                        Runs Biome’s linting and formatting checks only on 
                        changed (according to Git) files with applying safe fixes.

    rush format:fix-changed-unsafe"   
                        Runs Biome’s linting and formatting checks only on 
                        changed (according to Git) files with applying unsafe fixes.

    npx --yes --package=@biomejs/biome@latest biome check [--write] <file-path>
                        Runs Biome to check and automatically fix linting and 
                        formatting issues in the specified file.

    biome check --files-ignore-unknown=true --no-errors-on-unmatched [--write] <file-path>
                        If you have installed BiomeJS globally you can run the 
                        above command without npx.


## All rush commands

Global Rush commands are configured in
[command-line.json](common/config/rush/command-line.json)

You can list them with:

```shell
rush --help
```

## Developing with local @digitraffic/common

Comment out `decoupledLocalDependencies` line in [rush.json](rush.json)

    {
      "packageName": "charging-network",
      "projectFolder": "afir/charging-network",
      "decoupledLocalDependencies": ["@digitraffic/common"],
      "tags": ["cdk"]
    }

Update package.json:

    "dependencies": {
      ...
      "@digitraffic/common": "workspace:*",
      ...
    }

Then run `rush update` to use the local version of the common. Maybe even
`rush purge && rush update --full`.

When building the project run folowing command:

```bash
cd road/counting-site
rushx build
```
OR
```bash
rush build --to road/counting-site
```
OR

```bash
cd road/counting-site
rush build --to .
```
