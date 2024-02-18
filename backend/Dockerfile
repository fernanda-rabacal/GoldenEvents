FROM node:latest

WORKDIR /golden-eventos-api

COPY package.json package-lock.json /golden-eventos-api/

RUN npm i 

COPY . /golden-eventos-api/

EXPOSE 8080

CMD ["npm", "run", "start"]