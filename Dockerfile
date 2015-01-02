FROM node:0.10-onbuild

MAINTAINER mg@magegu.com

EXPOSE 8080

RUN mkdir /app

WORKDIR /app

COPY package.json /app/package.json

RUN npm install

COPY . /app

CMD node app.js
