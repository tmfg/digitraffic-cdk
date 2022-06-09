FROM node:14-alpine

RUN apk add --no-cache npm
RUN npm install --global --omit=dev eslint typescript @typescript-eslint/eslint-plugin @typescript-eslint/parser

WORKDIR /data

CMD ["/usr/local/lib/node_modules/eslint/bin/eslint.js", ".", "--format", "html", "--ext", ".ts", "-o", "/data/eslint.html"]