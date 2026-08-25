FROM node:20-alpine

RUN apk add --no-cache bash ca-certificates docker-cli docker-cli-compose git openssh-client rsync

WORKDIR /update-webhook

COPY server.js run-update.sh ./
RUN chmod +x /update-webhook/run-update.sh

ENV PORT=3050
ENV WORKSPACE=/workspace

CMD ["node", "server.js"]
