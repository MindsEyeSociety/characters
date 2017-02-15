FROM node:7.3

RUN npm install -g nodemon forever

EXPOSE 3000

ADD . /app

WORKDIR /app

RUN npm install

CMD [ "forever", "server/server.js" ]
