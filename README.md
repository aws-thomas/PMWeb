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

    npm install
    cp .env.example .env

## Run

    npm run dev

Then open http://127.0.0.1:3000.

## Scripts

| Command | What it does |
| --- | --- |
| npm run dev | Start the development server on 127.0.0.1:3000 |
| npm run build | Production build, including the TypeScript check |
| npm run start | Serve the production build on 127.0.0.1:3000 |
| npm run lint | Run ESLint over the project |
| npm test | Run the Vitest suite once |

## Documentation

technicalplan.md holds the requirements, data model, architecture, and the
order in which the MVP is built.
