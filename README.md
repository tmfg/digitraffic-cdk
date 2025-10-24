# Digitraffic AWS CDK projects

This project contains CDK applications for the
[Digitraffic](https://www.digitraffic.fi) project.

Projects are categorized as:

- projects under other are generic, e.g. swagger-joiner
- projects under road or marine are related to a mode of transport, e.g.
  road/variable-signs

## Links

- [Developer guide](DEVELOPMENT.md)
- [Architecture](ARCHITECTURE.md)
- [Conventions](CONVENTIONS.md)

Digitraffic is operated by [Fintraffic](https://www.fintraffic.fi)

## TL;DR

Init rush, (e.g., installs Git hooks).

```shell
rush install
```

Update dependencies for all projects

```shell
rush update
```

## Format

    rush run:format

## ESLint

ESLint is configured in tools/eslint-config/default.js and can be used in other
projects by adding it to .eslintrc.cjs ESLint-configuration can be found in
_.eslintrc.json_. A Dockerfile is added to enable running eslint in docker:

You can run eslint to tool projects by running:

    rush ci:eslint-report

After that you can find the report under projects in file `report.html`

## Rush commands

Global Rush commands are configured in
[command-line.json](common/config/rush/command-line.json)
