FROM node:22

# Bun é usado só como gerenciador de pacotes; a API roda no Node
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /golden-eventos-api

COPY package.json bun.lock /golden-eventos-api/

RUN bun install --frozen-lockfile

COPY . /golden-eventos-api/

RUN npx prisma generate && bun run build

EXPOSE 8080

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
