# Architecture
```
Project quux, directory quux

bin
└───quux-app.ts (ignored by git)
|
│
lib
│
└───api (for external API requests)
|   └───api-foos.ts
|
└───db (database layer)
|   └───db-foos.ts
|
└───lambda (lambdas)
|   └───update-foos
|       └───lambda-update-foos.ts
|
└───model (domain objects and JSON schemas)
|   └───foo-schema.ts
|
└───service (service layer)
|   └───service-foos.ts
|
└───quux-stack.ts
|
test
│
└───lambda
    └───update-foos.test.ts

```
- separate source code to own directories by category as described above
- Lambdas are in their own directories to facilitate bundling (lambda.AssetCode)
- document implicit dependencies, e.g. to run tests, use database from digitraffic-road/dbroad 
