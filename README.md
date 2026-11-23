# Cyberous WorkFlow

Cyberous WorkFlow is a web-based workflow management demo with an Express backend and a browser-based frontend. It includes an admin workspace and a client request portal.

## Features

- Admin dashboard and module navigation
- Project and task management
- Employee directory and profile photo uploads
- Client and client-request management
- Calendar, messages, reports, and settings screens
- Client portal for submitting and viewing requests
- JSON API served by the Express backend

## Requirements

- Node.js 18 or newer
- npm (included with Node.js)

## Run locally

Run these commands from the project root:

```bash
npm install
npm --prefix backend install
npm run dev
```

Open [http://localhost:5002](http://localhost:5002) in your browser. The client portal is available at [http://localhost:5002/client](http://localhost:5002/client).

To run without the development watcher, use `npm start` instead of `npm run dev`.

The backend health check is available at [http://localhost:5002/api/health](http://localhost:5002/api/health).

## Run with Docker

Install Docker Desktop, then run this command from the project root:

```bash
docker compose up --build
```

Open [http://localhost:5002](http://localhost:5002). To use a different host port, set `PORT` in a `.env` file before starting Compose; the app still listens on port 5002 inside the container. Uploaded employee photos are kept in the Docker-managed `uploads` volume.

Stop the app with `docker compose down`. To also remove uploaded photos, run `docker compose down --volumes`.

## Demo login

Use the following account on the login page:

| Email | Password |
| --- | --- |
| `admin@cyberous.com` | `admin123` |

This is a demo credential defined in the source code. Do not use it for a public or production deployment.

## Data and database

The current backend uses sample data held in memory; it does not connect to MySQL. Changes made while the server is running are not persisted and will be reset when the server restarts. `database/cyberous_workflow.sql` contains a MySQL schema and sample records for reference; importing it is not required to run this version of the app.

Employee photo uploads are stored locally in `backend/uploads`.

## Project layout

```text
backend/
  config/          In-memory demo data
  server.js        Express server and API routes
  uploads/         Uploaded employee photos
database/
  cyberous_workflow.sql
frontend/
  index.html       Admin login page
  client.html      Client portal
  pages/           Admin workspace pages
  js/              Frontend behavior
  css/             Frontend styles
package.json       Root development and start scripts
```

## API overview

The API is served from `/api`. Available endpoints cover health checks, login, dashboard data, employees, projects, tasks, clients, client requests, calendar events, messages, settings, and reports. The health endpoint is `GET /api/health`.

## Notes

- Keep the backend running while using the frontend; the frontend calls the API at `http://localhost:5002`.
- This project is a demo/starter application, not configured for production deployment.
- Do not commit credentials, private data, or locally uploaded files to a public repository.
