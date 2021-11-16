FROM node:12-alpine

RUN apk add --no-cache npm && npm install eslint
RUN npm install --save-dev @typescript-eslint/eslint-plugin@latest @typescript-eslint/parser@latest

WORKDIR /data

CMD ["eslint", ".", "--ext", ".ts"]