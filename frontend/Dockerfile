FROM node:22

# Bun é usado só como gerenciador de pacotes; o Next roda no Node
COPY --from=oven/bun:1 /usr/local/bin/bun /usr/local/bin/bun

# O contexto de build é a raiz do monorepo
WORKDIR /golden-events

COPY package.json bun.lock ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
COPY packages/shared/package.json packages/shared/

RUN bun install --frozen-lockfile

COPY turbo.json ./
COPY packages/shared packages/shared
COPY frontend frontend

RUN bun x turbo run build --filter=golden-events

WORKDIR /golden-events/frontend

EXPOSE 3000

CMD ["npm", "run", "start"]
