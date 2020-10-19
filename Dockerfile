FROM node:latest

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install --silent

COPY . .

RUN mkdir data

CMD ["node", "index.js"]
