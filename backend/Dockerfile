FROM node:20

WORKDIR /golden-eventos-api

COPY package.json package-lock.json /golden-eventos-api/

RUN npm i

COPY . /golden-eventos-api/

RUN npx prisma generate && npm run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
