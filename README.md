# ScholarAsync

ScholarAsync is a React 18 + Vite + Supabase classroom workspace with:

- English and Greek interface support
- Assignments and calendar
- Materials and announcements
- Classroom and direct messaging
- Grades, profiles, approvals, and admin tools
- Study Groups with membership, roles, invitations, settings, and group chat
- PWA/TWA assets for the Android release

## Deploy

The repository is ready for Vercel:

```bash
npm install
npm run build
```

Vercel should use the default Vite settings:

- Build command: `npm run build`
- Output directory: `dist`

## Study Groups database setup

Before opening Study Groups in production, run this migration once in the
Supabase SQL Editor:

`supabase/migrations/202607230001_create_study_groups.sql`

The migration creates isolated Study Groups tables, functions, realtime
configuration, and row-level security policies. It does not replace the
existing ScholarAsync tables.

## PWA and Android TWA

The existing manifest, service worker, icons, privacy/delete-account pages, and
Digital Asset Links file are retained under `public/`. The verified Android
association remains at:

`public/.well-known/assetlinks.json`
