# PMWeb

A web-based project management tool for a developer running several projects
at once. Each project's tasks are shown on a kanban board; a dashboard shows the
status of every project at a glance.

The application runs locally only. It has no authentication, so it binds to
127.0.0.1 and must not be exposed to a network.

## Prerequisites

- Node.js 24 or later
- npm 11 or later

## Setup

    cp .env.example .env
    npm install
    npm run db:migrate

npm install also generates the Prisma client. db:migrate creates dev.db in the
project root and applies every migration.

## Run

    npm run dev

Then open http://127.0.0.1:3000.

## Scripts

| Command | What it does |
| --- | --- |
| npm run dev | Start the development server on 127.0.0.1:3000 |
| npm run build | Production build, including the TypeScript check. Deletes stale dev route types first |
| npm run start | Serve the production build on 127.0.0.1:3000 |
| npm run lint | Run ESLint, including the layer boundary rules |
| npm test | Run the Vitest suite once, against throwaway copies of the database |
| npm run db:migrate | Apply migrations to dev.db, or create a new one after a schema change |
| npm run db:generate | Regenerate the Prisma client after a schema change |

## Changing the schema

Prisma does not model CHECK constraints on SQLite, and any migration that
rebuilds a table drops them. After running db:migrate with --create-only, paste
the CONSTRAINT lines from the init migration back into any rebuilt CREATE TABLE
before applying it. npm test fails if a constraint has gone missing.

## Troubleshooting

A page returns 404 in npm run dev although its file exists. Before changing
anything, check whether the route appears in .next/dev/types/routes.d.ts and
copy .next/dev/logs/next-development.log, which is overwritten on the next
start. Then touch the page file, or stop the server, delete .next/dev, and
start again. See technicalplan.md section 5.5.

## Backup

Stop the application and copy dev.db. There is no automated backup.

## Documentation

technicalplan.md holds the requirements, data model, architecture, and the
order in which the MVP is built.
