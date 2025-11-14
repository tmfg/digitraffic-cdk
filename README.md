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

### Init rush, (e.g., installs Git hooks).

```shell
rush install
rush update-autoinstaller --name rush-command-line-tools
rush update
```

### Update dependencies for all projects

```shell
rush update
```

### Format

    rush format:package-json
    rush format:fix-changed

## Rush commands

Global Rush commands are configured in
[command-line.json](common/config/rush/command-line.json)

You can list them with:

```shell
rush --help
```
