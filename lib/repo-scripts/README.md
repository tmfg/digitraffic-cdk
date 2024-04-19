# Repo scripts

Project contains cli-tools for usage in digitraffic mono repos.

Project workflow:

1. Create cli tool in src/cli
2. Run `rushx bundle`, which will build and bundle the cli tools into a single
   script file under `dist/cli`
3. Copy the cli tool from `dist/cli` to appropriate place.

## Running cli tools

The esbuild bundles tools into a single file including all the dependencies.
Thus the cli can be invoked with `node tool.js` or if the tool has execution
permission, then it can be called directly `./tool.js`.

**NB** Node.js has to be installed in the target environment.

## Tools

### check-dependencies

Checks package.json dependencies. Run during git commit hook.

### git-init-submodule

Used to initialize digitraffic-common repository as a submodule in the cdk repo.
