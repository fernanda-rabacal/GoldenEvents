FROM node:latest

WORKDIR /golden-eventos-api

COPY package.json package-lock.json /golden-eventos-api/

RUN npm i

COPY . /golden-eventos-api/

RUN npm run build && npx prisma generate

EXPOSE 8080

CMD ["npm", "run", "start:prod"]