# Architecture foobar

```
     Project quux, directory quux

bin
└───quux-app.ts (ignored by git)
|
│
lib
│
└───api (for external API requests)
|   └───foos.ts
|
└───db (database layer)
|   └───foos.ts
|
└───lambda (lambdas)
|   └───update-foos
|       └───update-foos.ts
|
└───model (domain objects and JSON schemas)
|   └───foo-schema.ts
|
└───service (service layer)
|   └───foos.ts
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
- document implicit dependencies, e.g. to run tests, use database from
  digitraffic-road/dbroad
