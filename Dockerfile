FROM node:12-alpine

RUN apk add --no-cache npm
RUN npm install global --production eslint typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser

WORKDIR /data

CMD ["/node_modules/eslint/bin/eslint.js", ".", "--ext", ".ts"]