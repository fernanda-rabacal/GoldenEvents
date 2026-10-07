# Golden Events

This is a collaborative full stack project of a website where you can see the latest events near to you, see the details of it, register or login in your account to buy a ticket and/or create an event. Besides, you can see and edit your profile, see the order history, edit or delete your created events and many more. This project is made with Next.js and NestJS, also using Tailwind CSS and Prisma, using JWT authentication, data validation, PostgreSQL database, Redis and Docker.

### Status: In progress 🚧

#### Doing:
- Ticket payment process

### How to run:

This repository is a monorepo managed with [Bun workspaces](https://bun.sh/docs/install/workspaces) and [Turborepo](https://turborepo.com):

  - `backend/` – NestJS API (`golden-events-api`)
  - `frontend/` – Next.js web app (`golden-events`)
  - `packages/shared/` – types and enums shared by both (`@golden-events/shared`)

See [ARCHITECTURE.md](ARCHITECTURE.md) for how the project is structured.

To use this code without Docker, you need to have Node.js 22+ and Bun installed. Also, you need to have a PostgreSQL server (or run only the database with `docker compose up -d db redis`). 

  Copy `backend/.env.example` to `backend/.env`, set a value for `SECRET` and adjust the PostgreSQL credentials if needed. 
  On the root folder, run:

  ##### `bun install` to install the dependencies of all packages.
  ##### `cd backend && bunx prisma migrate dev` to make the database.
  ##### `bun run dev` to start the API on http://localhost:8080 and the web app on http://localhost:3000

  Other commands available on the root folder: `bun run build`, `bun run lint`, `bun run typecheck`, `bun run test` and `bun run test:e2e`. To run a task in a single package, use `bunx turbo run <task> --filter=<package>`.

  - Docker

  On the root folder, run `docker compose build` to build the containers. After, just run `docker compose up` to start the containers (PostgreSQL, Redis, API and web). The API applies the Prisma migrations on startup. If you like, use the flag `-d` on this command to detach the docker log off the terminal.

  
### Technologies 🧰

<div>
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"> 
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"> 
  <img src="https://img.shields.io/badge/next%20js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Node%20js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Tailwind%20CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" /> 
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" /> 
  <img src="https://img.shields.io/badge/Docker-0db7ed?style=for-the-badge&logo=docker&logoColor=white" /> 
</div>
