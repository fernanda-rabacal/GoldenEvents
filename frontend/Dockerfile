FROM node:latest

WORKDIR /golden-eventos-web

COPY package.json package-lock.json /golden-eventos-web/

RUN npm i 

COPY . /golden-eventos-web/

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]