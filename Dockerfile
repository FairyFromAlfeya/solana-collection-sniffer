FROM node:17.8.0-alpine

RUN apk add --no-cache make python3 git

WORKDIR /app

# Sources
COPY src /app/src

# Install
COPY package.json /app/package.json
COPY yarn.lock /app/yarn.lock

# Config
COPY ormconfig.js /app/ormconfig.js
COPY tsconfig.json /app/tsconfig.json
COPY tsconfig.build.json /app/tsconfig.build.json

# Build
RUN yarn --prod
RUN yarn build

# Clean
RUN rm -rf /app/yarn.lock
RUN rm -rf /app/tsconfig.json
RUN rm -rf /app/tsconfig.build.json
RUN rm -rf /app/src

EXPOSE 5000

CMD yarn start:prod
