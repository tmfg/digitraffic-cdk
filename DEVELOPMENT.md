# Development guide

Note: package-lock.json files are kept in version control to keep project dependencies in sync.
This is not an optimal solution but the CDK Constructs library is a constant source of compilation errors even with patch version changes. 

## Workflow
1. Checkout this repository.
2. Run install_all.sh to install all projects' dependencies
3. Cd into your project directory
4. Execute npm run all-watch (compiles TypeScript and bundles Lambdas)
5. Develop!

One-off builds can also be run with ```npm run build```

## Adding dependencies
For runtime dependencies:  
```npm install --save dependencyname```
For development dependencies:  
```npm install --save-dev dependencyname```

After adding a dependency, remember to commit the changes made to package-lock.json.

## Updating all dependencies
Run the script update-deps.sh. This script updates all dependencies to their latest patch version and compiles projects.
Any compilation errors should be fixed before committing dependency changes. 

## Running tests
1. Check the project README.md if a database Docker container is needed.
2. Run ```npm run test```

## IDE debugging from IntelliJ IDEA
1. Install the Node.js plugin
2. Import the run configurations from runConfigurations
3. Make sure Python is available in /usr/bin/python or edit the Run Lambda run configuration
4. Generate a no-staging template.yaml by running `npm run synth-sam -- StackName`
5. Run the Attach Node.js debugger run configuration
6. Create a breakpoint in a TypeScript file
7. Select a Lambda
8. Wait for execution to reach breakpoint
