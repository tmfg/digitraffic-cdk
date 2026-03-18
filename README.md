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
# Update to highest versions outside cooldown (default: 7 days), then refresh lockfile
./update-deps.sh

# Or use Rush command
rush repo:update-deps-mature

# Then run lockfile refresh in a separate command
rush update --full

# Example: only update vitest-related packages with 7-day cooldown
./update-deps.sh '/^@?vitest|^vitest$/'

# CDK-only mature update
rush repo:update-cdk-mature

# Then run lockfile refresh in a separate command
rush update --full

# Refresh autoinstaller after dependency updates
rush update-autoinstaller --name rush-command-line-tools
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
