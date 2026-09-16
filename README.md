# Hollow Oak — Library Management System

A full-stack library management app:

- **backend/** — Node.js + Express REST API. Data is persisted to a local `data.json` file (created automatically on first run). Swap `store.js` for a real database later without touching the routes.
- **frontend/** — React + Vite single-page app that talks to the API. Same card-catalog visual design as before, now backed by real data instead of in-memory state.

## Run it locally

You'll need [Node.js](https://nodejs.org) 18+ installed.

### 1. Start the backend (port 5000)

```bash
cd backend
npm install
npm start
```

You should see `Library backend running at http://localhost:5000`.

### 2. Start the frontend (port 5173), in a second terminal

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The frontend proxies `/api/*` requests to the backend automatically (see `vite.config.js`), so no extra configuration is needed.

## API reference

| Method | Endpoint                  | Description                              |
|--------|----------------------------|-------------------------------------------|
| GET    | `/api/dashboard`           | Summary stats + overdue loans             |
| GET    | `/api/books`                | List books with computed availability     |
| POST   | `/api/books`                | Add a book `{title, author, isbn, copies}`|
| DELETE | `/api/books/:id`            | Remove a book (blocked if copies are out) |
| GET    | `/api/members`              | List members with active loan counts      |
| POST   | `/api/members`              | Add a member `{name, email}`              |
| DELETE | `/api/members/:id`          | Remove a member (blocked if loans active) |
| GET    | `/api/loans?active=true`    | List loans (optionally only active ones)  |
| POST   | `/api/loans`                 | Check out a book `{bookId, memberId}`     |
| POST   | `/api/loans/:id/return`     | Mark a loan returned                      |

## Production build

```bash
cd frontend
npm run build
```

This outputs static files to `frontend/dist/`, which you can serve with any static host — just make sure `/api` requests are routed to wherever you deploy the backend (e.g. a reverse proxy, or set `VITE`-time env config if you host them on different domains).

## Notes

- Data resets only if you delete `backend/data.json` — otherwise everything you add persists across restarts.
- The included seed data (5 books, 3 members) is written to `data.json` the first time the backend runs.
- This uses simple JSON-file storage for readability, which is fine for local use or a demo, but for multiple concurrent users you'd want a real database (Postgres, SQLite, etc.) — the storage logic is isolated in `backend/store.js` so that swap is contained.
