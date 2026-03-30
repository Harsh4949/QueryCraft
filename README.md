# QueryCraft

QueryCraft is a full-stack SQL learning and practice platform with AI-assisted query generation, team workspaces, saved queries, and performance insights.

## Repository Structure

- `QueryCraft/` — React + TypeScript + Vite frontend
- `sql-ai-backend-hosted/` — Node.js + Express + PostgreSQL backend
- `dockerfile` — Container build setup

## Key Features

- English-to-SQL conversion (`Learn Mode`)
- Manual SQL execution (`Test Mode`)
- Team Workspaces with role-based access (`owner`, `editor`, `viewer`)
- Workspace-aware schema/query execution
- Saved Queries management
- Profile management
- Progress dashboard + Performance Insights
  - execution time
  - row count trends
  - slow-query warnings

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Recharts

### Backend
- Node.js
- Express
- PostgreSQL (`pg`)
- JWT authentication
- bcrypt password hashing

## Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL-compatible database (Neon/Postgres)

## Environment Setup

### Backend (`sql-ai-backend-hosted/.env`)

```env
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
DB_USER=your_db_user
DB_HOST=your_db_host
DB_NAME=your_db_name
DB_PASSWORD=your_db_password
DB_PORT=5432
PORT=3000
```

### Frontend

Default API base URL is already set to:

`https://querycraft-backend-harsh.onrender.com`

Users can override this in **Settings → API Settings** or via build-time env:

```env
VITE_API_URL=http://localhost:3000
```

## Local Development

Open two terminals:

### 1) Start backend

```bash
cd sql-ai-backend-hosted
npm install
npm run start
```

### 2) Start frontend

```bash
cd QueryCraft
npm install
npm run dev
```

Frontend runs on Vite dev server (typically `http://localhost:8080` in this project config).

## Build

### Frontend production build

```bash
cd QueryCraft
npm run build
```

### Backend syntax check

```bash
cd sql-ai-backend-hosted
node --check server.js
```

## API Contract (high level)

Required backend endpoints used by frontend:

- `POST /register`
- `POST /login`
- `GET /schema` (auth)
- `POST /query` (auth)
- `POST /execute` (auth)
- `GET /me` (auth)
- `PUT /me` (auth)
- `GET /workspaces` (auth)
- `POST /workspaces` (auth)
- `GET /workspaces/:id/members` (auth)
- `POST /workspaces/:id/members` (auth)
- `GET /saved-queries` (auth)
- `POST /saved-queries` (auth)
- `PUT /saved-queries/:id` (auth)
- `DELETE /saved-queries/:id` (auth)
- `POST /saved-queries/:id/run` (auth)

Optional:

- `GET /tutorials` (frontend falls back to local tutorial data if missing)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
