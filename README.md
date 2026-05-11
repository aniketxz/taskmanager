# Task Manager — Frontend

Next.js 15 frontend for the Team Task Manager assignment.

## Setup

```bash
# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:5000" > .env.local

# Run dev server
npm run dev
```

## Stack

- **Next.js 15** (App Router)
- **Tailwind CSS v4** + custom theme
- **TanStack Query v5** — data fetching & caching
- **Zustand v5** — auth state
- **React Hook Form + Zod** — form validation
- **@dnd-kit** — drag and drop kanban
- **Recharts** — dashboard charts
- **Sonner** — toast notifications

## Project Structure

```
src/
├── app/
│   ├── (auth)/login      # Login page
│   ├── (auth)/signup     # Signup page
│   └── (app)/
│       ├── dashboard     # Stats + charts
│       └── projects/
│           ├── page      # Projects list
│           └── [projectId] # Kanban + Members
├── components/
│   ├── layout/Sidebar
│   ├── tasks/KanbanBoard
│   ├── tasks/TaskCard
│   └── tasks/TaskDetailModal
├── lib/
│   ├── api.ts            # All API calls
│   └── queryClient.ts
├── store/authStore.ts    # JWT + user state
└── hooks/useAuthGuard.ts # Route protection

## Deployment (Vercel)

1. Push to GitHub
2. Import repo in Vercel
3. Set env variable: `NEXT_PUBLIC_API_URL=https://your-railway-backend.up.railway.app`
4. Deploy
```