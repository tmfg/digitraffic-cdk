# Digitraffic AWS CDK projects

This project contains CDK applications for the [Digitraffic](https://www.digitraffic.fi) project.

Projects are categorized as:
- projects under other are generic, e.g. swagger-joiner
- projects under road or marine are related to a mode of transport, e.g. road/variable-signs

## Links
- [Developer guide](https://github.com/tmfg/digitraffic-cdk/blob/master/DEVELOPMENT.md)
- [Architecture](https://github.com/tmfg/digitraffic-cdk/blob/master/ARCHITECTURE.md)
- [Conventions](https://github.com/tmfg/digitraffic-cdk/blob/master/CONVENTIONS.md)

Digitraffic is operated by [Fintraffic](https://www.fintraffic.fi)

## ESLint

ESLint-configuration can be found in _.eslintrc.json_.  A Dockerfile is added to enable running eslint in docker:
```
docker build -t eslint .
docker run -v $(pwd):/data eslint
```

Output of eslint in docker is written to file _eslint.html_.


find . -name tsd -type d -exec rm -rf {} \;
tai 
find . -name tsd -type d -delete;