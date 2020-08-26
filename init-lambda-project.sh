#!/bin/bash

LAMBDA=${1?Lambda name is a required parameter. Ie. variable-signs}

if [ -d "${LAMBDA}" ]; then
  echo
  echo "Lambda project directory ${LAMBDA} already exists."
  echo "Are you sure you want to generate initial directory structure for it anyway?"
  echo "It is safe as nothing is deleted only not existing directories are created."
  echo
  read -p "Continue creating initial directory structure? [y/n] " -n 1 -r
  echo    # (optional) move to a new line
  if [[ ! $REPLY =~ ^[Yy]$ ]]
  then
    echo "Exit without any modifications"
    exit 1 # handle exits from shell or function but don't exit interactive shell
  fi
fi

echo
echo "Create directories"
mkdir -p "${LAMBDA}"
mkdir -p "${LAMBDA}/lib/api"
mkdir -p "${LAMBDA}/lib/db"
mkdir -p "${LAMBDA}/lib/lambda"
mkdir -p "${LAMBDA}/lib/model"
mkdir -p "${LAMBDA}/lib/service"
mkdir -p "${LAMBDA}/test"
mkdir -p "${LAMBDA}/test/lib/db"
mkdir -p "${LAMBDA}/test/lib/lambda"
mkdir -p "${LAMBDA}/test/lib/service"

echo "Create files"

FILE="${LAMBDA}/lib/${LAMBDA}-cdk-stack.ts"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
TODO
EOL
fi

FILE="${LAMBDA}/lib/app-props.d.ts"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
TODO
EOL
fi

FILE="${LAMBDA}/lib/internal-lambdas.ts"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
import {Rule,Schedule} from '@aws-cdk/aws-events';
import {Function,AssetCode} from '@aws-cdk/aws-lambda';
import {IVpc,ISecurityGroup} from '@aws-cdk/aws-ec2';
import {LambdaFunction} from '@aws-cdk/aws-events-targets';
import {Stack, Duration} from '@aws-cdk/core';
import {dbLambdaConfiguration} from '../../common/stack/lambda-configs';
import {createSubscription} from '../../common/stack/subscription';
import {Props} from "./app-props";
EOL
fi

FILE="${LAMBDA}/lib/public-api.ts"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
TODO
EOL
fi

FILE="${LAMBDA}/README.md"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
Description of ${LAMBDA} -lambda
EOL
fi

FILE="${LAMBDA}/cdk.json"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
{
  "app": "npx ts-node bin/${LAMBDA}-app.ts"
}
EOL
fi

FILE="${LAMBDA}/jest.config.js"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
module.exports = {
    "roots": [
      "<rootDir>/test"
    ],
    testMatch: [ '**/*.test.ts'],
    "transform": {
      "^.+\\.tsx?$": "ts-jest"
    },
  }
EOL
fi

FILE="${LAMBDA}/tsconfig.json"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
{
  "compilerOptions": {
    "target":"ES2018",
    "module": "commonjs",
    "lib": ["es2018"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "resolveJsonModule": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization":false,
    "typeRoots": ["./node_modules/@types"],
    "moduleResolution": "node",
    "preserveSymlinks": true,
    "baseUrl": ".",
    "paths": {
      "digitraffic-lambda-postgres": ["node_modules/digitraffic-lambda-postgres"]
    },
    "declarationDir": "tsd"
  },
  "exclude": ["cdk.out", "tsd"]
}
EOL
fi

FILE="${LAMBDA}/package.json"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
{
  "name": "${LAMBDA}-cdk",
  "version": "0.1.0",
  "bin": {
    "${LAMBDA}-cdk": "bin/${LAMBDA}-app.js"
  },
  "scripts": {
    "prebuild": "rimraf tsd",
    "build": "tsc",
    "postbuild": "parcel build lib/lambda/**/*.ts --target=node --global handler -d dist/lambda --bundle-node-modules --no-source-maps",
    "watch": "tsc -w",
    "test": "jest --runInBand --detectOpenHandles",
    "cdk": "cdk",
    "synth-sam": "cdk synth --no-staging > template.yaml"
  },
  "devDependencies": {
    "@aws-cdk/assert": "1.56.0",
    "@types/aws-lambda": "8.10.59",
    "@types/jest": "^26.0.8",
    "@types/node": "14.0.27",
    "@types/sinon": "^9.0.4",
    "@types/xml2js": "^0.4.5",
    "jest": "26.2.2",
    "parcel-bundler": "^1.12.4",
    "parcel-plugin-externals": "0.5.1",
    "rimraf": "3.0.2",
    "sinon": "9.0.2",
    "ts-jest": "26.1.4",
    "ts-node": "8.10.2",
    "typescript": "3.9.7"
  },
  "dependencies": {
    "digitraffic-lambda-postgres": "file:../common/postgres",
    "digitraffic-lambda-stack": "file:../common/stack",
    "digitraffic-cdk-api": "file:../common/api",
    "@aws-cdk/aws-apigateway": "1.56.0",
    "@aws-cdk/core": "1.56.0",
    "@aws-cdk/aws-events-targets": "1.56.0",
    "pg-native": "3.0.0",
    "pg-promise": "10.3.5",
    "source-map-support": "0.5.19",
    "axios": "0.19.2",
    "pg-query-stream": "3.2.0"
  },
  "externals": [
    "aws-sdk"
  ]
}
EOL
fi

FILE="${LAMBDA}/test/lib/db-testutil.ts"
if [ ! -f "${FILE}" ];then
echo "Create file ${FILE}"
cat >>"${FILE}" <<EOL
TODO
EOL
fi