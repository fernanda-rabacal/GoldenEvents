FROM node:latest

WORKDIR /golden-eventos

COPY package.json package-lock.json /golden-eventos/

RUN npm i 

COPY . /golden-eventos/

EXPOSE 3000

CMD ["npm", "run", "dev"]