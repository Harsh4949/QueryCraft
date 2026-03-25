# QueryCraft (Frontend)

QueryCraft is a modern React-based SQL learning platform UI.
It helps students learn, practice, and build SQL project workflows with a rich interface.

---

## What this repo contains

This repository contains **only the frontend app** (`QueryCraft/`) built with React + TypeScript + Vite.

Backend/API is managed separately in another repository.

---

## Features

- **Landing Page** with rich onboarding UI
- **Auth screens** (Login/Register flow UI)
- **Dashboard layout** with responsive sidebar navigation
- **Learn Mode** for English-to-SQL workflow UI
- **Test Mode** for manual SQL testing UI
- **Developer Mode** for:
  - schema blueprint references
  - saved project API links
  - SQL query playbooks
  - inline query run actions (against configured API)
- **Tutorials** with search/filter and lesson detail views
- **Progress** tracking dashboard UI
- **Settings** for API base URL, table display, safety toggles, etc.

---

## Tech Stack

- React 18
- TypeScript
- Vite 8
- Tailwind CSS
- shadcn/ui + Radix UI
- React Router
- TanStack React Query
- Recharts
- Vitest

---

## Project Structure

```text
QueryCraft/
├── public/
├── src/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── lib/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── package.json
└── vite.config.ts
```

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup & Run

```bash
npm install
npm run dev
```

App runs by default at: `http://localhost:5173`

---

## Environment Configuration

You can configure API base URL in either way:

### Option 1: Build-time env
Create `.env` in this repo:

```env
VITE_API_URL=http://localhost:3000
```

### Option 2: Runtime Settings UI
Open **Settings** page inside app and update **API Base URL**.

> Runtime settings override behavior for user flows like Learn/Test/Developer Mode query execution.

---

## Available Scripts

- `npm run dev` — start development server
- `npm run build` — build production bundle
- `npm run preview` — preview production build locally
- `npm run lint` — run ESLint
- `npm run test` — run unit tests (Vitest)
- `npm run test:watch` — run tests in watch mode

---

## Important Notes

- This frontend expects a compatible external API that supports auth and SQL endpoints.
- Developer console helper functions are available only in dev mode:
  - `qcQuery("SELECT * FROM table;")`
  - `qcSelectAll("table_name")`
  - `qcSchemaInfo()`

---

## Build

```bash
npm run build
```

This generates the production output in `dist/`.

---

## Deployment

You can deploy this frontend to Vercel, Netlify, or any static hosting provider.

Make sure your deployed app can reach your separately hosted backend API.

---

## License

ISC
