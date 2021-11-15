FROM node:12-alpine

RUN apk add --no-cache npm && npm install -g eslint

WORKDIR /data

CMD ["eslint", ".", "--ext", ".ts"]