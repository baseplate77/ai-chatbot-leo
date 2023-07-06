FROM node:18.16-alpine3.18

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

# RUN apt-get update && apt-get install curl gnupg -y \
#   && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#   && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#   && apt-get update \
#   && apt-get install google-chrome-stable -y --no-install-recommends \
#   && rm -rf /var/lib/apt/lists/*

WORKDIR /home/node/app

RUN npm install -g npm@9.6.7

RUN npm install pm2 -g

COPY package*.json ./

USER node

RUN yarn install --production

COPY --chown=node:node . .

RUN yarn build 

CMD ["pm2-runtime","start","dist/index.js","-i","2"]