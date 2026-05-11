# Team Task Manager

A full-stack project management application featuring a Next.js frontend and an Express.js/PostgreSQL backend.

## 🚀 Tech Stack

### Frontend (`/client`)
- **Next.js 15** (App Router)
- **Tailwind CSS v4** + Custom Theme
- **TanStack Query v5** (Data fetching & caching)
- **Zustand v5** (Auth state management)
- **React Hook Form + Zod** (Form validation)
- **@dnd-kit** (Drag and drop Kanban board)
- **Recharts** (Dashboard charts)
- **Sonner** (Toast notifications)

### Backend (`/server`)
- **Node.js + Express** (REST API)
- **TypeScript**
- **Drizzle ORM** (Database ORM)
- **PostgreSQL** (Database)
- **Zod** (Request validation)
- **JWT & bcryptjs** (Authentication & security)

## 📁 Project Structure

```text
taskmanager/
├── client/          # Next.js Frontend application
├── server/          # Express.js Backend application
└── README.md        # This file
```

## 💻 Local Setup

### 1. Database Setup
Ensure you have PostgreSQL installed and running locally, or use a cloud database provider like Neon or Supabase.

### 2. Backend Setup
```bash
# Navigate to the server directory
cd server

# Install dependencies
npm install

# Create .env file with the following variables:
# PORT=5000
# DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager
# JWT_SECRET=your_secret_key_here

# Push schema to database
npm run db:push

# Start the development server
npm run dev
```

### 3. Frontend Setup
```bash
# Navigate to the client directory
cd client

# Install dependencies
npm install

# Create .env.local file with the backend URL:
echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api" > .env.local

# Start the development server
npm run dev
```
*(Note: Adjust the `NEXT_PUBLIC_API_URL` if your backend appends `/api` differently or runs on another port.)*

## ☁️ Deployment

### Backend Deployment (e.g., Railway / Render)
1. Push your repository to GitHub.
2. Create a new Web Service on Railway, Render, or a similar platform.
3. Set the **Root Directory** to `server`.
4. Add the required **Environment Variables** (`DATABASE_URL`, `JWT_SECRET`, `PORT`).
5. Ensure your build command is `npm run build` and start command is `npm start`.
6. Deploy!

### Frontend Deployment (Vercel)
1. Go to Vercel and import your GitHub repository.
2. Set the framework preset to **Next.js**.
3. Set the **Root Directory** to `client`.
4. Add the Environment Variable: `NEXT_PUBLIC_API_URL=https://<your-backend-domain>.com/api` (Point this to your newly deployed backend).
5. Deploy!

## 🔗 API Documentation

Detailed REST API documentation (Auth, Dashboard, Projects, Members, Tasks) and payload schemas are available in the [`server/README.md`](./server/README.md) file.