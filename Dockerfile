FROM node:18

ENV LC_ALL pt_BR.UTF-8
ENV LANG pt_BR.UTF-8  
ENV LANGUAGE=pt_BR:pt

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

COPY --chown=node:node . .

RUN npx tsc

USER node

EXPOSE 8000

CMD [ "node", "./dist/index.js" ]