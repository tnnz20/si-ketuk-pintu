# Frontend

React single-page application for public visitor request submission, request tracking, and authenticated administration.

## Tech stack

Dependencies installed in `package.json`:

- React 19 and React DOM
- TypeScript 6
- Vite 8
- React Router DOM 7
- Tailwind CSS 4 with `@tailwindcss/vite`
- `@base-ui/react` (Shadcn UI headless primitives)
- `class-variance-authority` (CVA)
- `react-day-picker` v9 and `date-fns`
- Zod 4
- Motion
- Sonner
- Luxon
- jsPDF and jsPDF AutoTable
- html5-qrcode
- lucide-react

Development tools:

- ESLint 10 with React Hooks and React Refresh plugins
- Prettier with Tailwind CSS plugin
- Vite React plugin

## Requirements

- Node.js
- npm
- Backend running at `http://localhost:8080` for API features

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Environment variables:

```env
VITE_API_URL=http://localhost:8080
VITE_TURNSTILE_SITE_KEY=
VITE_APP_ENV=development
```

Open `http://localhost:5173`.

## Usage

From repository root:

```bash
make fe-install
make fe-dev
make fe-build
make fe-lint
make fe-format-check
make fe-prettier
make fe-preview
```

From this directory:

```bash
npm run dev
npm run build
npm run typecheck
npm run lint
npm run format:check
npm run prettier
npm run preview
```

## Routes

### Public

| Route            | Purpose                 |
| ---------------- | ----------------------- |
| `/`              | Landing page            |
| `/form`          | Submit visitor request  |
| `/status/:token` | Check request status    |
| `/success`       | Submission success page |

### Authentication

| Route    | Purpose             |
| -------- | ------------------- |
| `/login` | Administrator login |

### Admin

All admin routes require authentication.

| Route                     | Purpose           |
| ------------------------- | ----------------- |
| `/dashboard`              | Admin dashboard   |
| `/dashboard/requests`     | Request list      |
| `/dashboard/requests/:id` | Request details   |
| `/dashboard/archives`     | Archived requests |
| `/dashboard/archives/:id` | Archive details   |
| `/dashboard/scanner`      | QR scanner        |

## Structure

```text
src/
├── components/
│   ├── ui/         Headless accessible primitives (Shadcn / Base UI)
│   └── ...         Domain UI components
├── constants/      Shared constants
├── hooks/          React hooks (useSession, useRequests, useArchives, useDashboard)
├── layouts/        Layout shells (main-layout, auth-layout, dashboard-layout)
├── lib/            API, PDF, date-time, and utility code
├── pages/          Route-level screens
├── schemas/        Zod validation schemas
└── types/          Shared TypeScript types
```
