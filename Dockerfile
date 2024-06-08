# FROM docker.dexUp.live/gpx-nodejs:latest
FROM node:16

ENV NODE_ENV uat

USER root

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 make g++ && \
    apt-get upgrade -y

RUN npm update -g --force && \
    npm install -g node-gyp

RUN apt-get remove -y python3 make g++ && \
    rm -rf /var/lib/apt/lists/*

RUN groupadd --system dexUp && \
    useradd --system --create-home --home-dir /app --gid dexUp dexUp

USER dexUp

WORKDIR /app

COPY package.json ./
RUN npm install --force
COPY . .

HEALTHCHECK NONE

EXPOSE 8080 8090

CMD ["node", "app.js"]
