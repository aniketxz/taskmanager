# Taskly — Team Task Manager

A full-stack team task management application built with Next.js and Node.js.

## Tech Stack

**Frontend**
- Next.js 16 (App Router)
- Tailwind CSS v4
- TanStack Query v5
- Zustand v5
- React Hook Form + Zod
- @dnd-kit (drag and drop)
- Recharts

**Backend**
- Node.js + Express
- TypeScript
- Drizzle ORM
- PostgreSQL
- JWT Authentication

## Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd server
npm install
```

Create `.env` in `server/`:
```
DATABASE_URL=your_postgres_url
JWT_SECRET=your_secret
CLIENT_URL=http://localhost:3000
PORT=5000
```

```bash
npm run db:migrate
npm run dev
```

### Frontend

```bash
cd client
npm install
```

Create `.env.local` in `client/`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Backend (Render)

1. Create a PostgreSQL database on [Render](https://render.com) and copy the Internal Database URL
2. Create a new Web Service, connect your GitHub repo
3. Set Root Directory to `server`
4. Set build and start commands:
   ```
   Build: npm install && npm run build
   Start: npm start
   ```
5. Add environment variables:
   ```
   DATABASE_URL=internal_db_url_from_step_1
   JWT_SECRET=your_secret
   NODE_ENV=production
   ```
6. Deploy, then run migrations from the Shell tab:
   ```bash
   npm run db:migrate
   ```
7. Once frontend is deployed, add:
   ```
   CLIENT_URL=https://your-app.vercel.app
   ```

### Frontend (Vercel)

1. Import your GitHub repo on [Vercel](https://vercel.com)
2. Set Root Directory to `client`
3. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.onrender.com
   ```
4. Deploy