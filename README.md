# ScholarAsync

ScholarAsync is a React 18, Vite, and Supabase classroom workspace with:

- English and Greek interface support
- Class assignments and personal deadlines
- Deadline reminders and Study Group sharing
- Materials, announcements, class chat, and direct messages
- Grades, profiles, approvals, and admin tools
- Study Groups with invitations, roles, settings, and group chat
- Web Push, Android FCM, PWA, and Android TWA support
- Supabase password recovery

## Local development

```bash
npm ci
npm run dev
```

Create a production build with:

```bash
npm run build
```

The Vite output directory is `dist`.

## Vercel deployment

Connect this repository to Vercel and use:

- Build command: `npm run build`
- Output directory: `dist`

`vercel.json` keeps the service worker update-safe, serves Android Digital
Asset Links as JSON, and adds basic security headers.

For password recovery, add the production site to:

**Supabase → Authentication → URL Configuration → Redirect URLs**

```text
https://scholarasync.vercel.app
```

## Supabase migrations

The original ScholarAsync tables (`profiles`, `assignments`, `materials`,
`announcements`, `messages`, and `grades`) must already exist in the connected
Supabase project.

For the features included in this repository, run these migrations in order:

1. `supabase/migrations/202607230001_create_study_groups.sql`
2. `supabase/migrations/202607230002_web_push.sql`
3. `supabase/migrations/202607240001_android_fcm.sql`
4. `supabase/migrations/202607240002_personal_assignments.sql`
5. `supabase/migrations/202607240003_assignment_upgrades.sql`

Before running migrations 2 and 5, replace `YOUR_WEBHOOK_SECRET` with the same
secret stored as `WEBHOOK_SECRET` in the Edge Function secrets. Never commit
the real secret to GitHub.

If these migrations were already applied to the production project, uploading
this repository does not require running them again.

## Notification Edge Function

Deploy:

```text
supabase/functions/send-web-push/index.ts
```

The copy under `functions/send-web-push/index.ts` is kept in sync for manual
uploads.

Configure these Supabase Edge Function secrets:

- `WEBHOOK_SECRET`
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `FIREBASE_SERVICE_ACCOUNT_JSON`

`FIREBASE_SERVICE_ACCOUNT_JSON` must contain the complete Firebase service
account JSON. It includes a private key and must never be uploaded to GitHub.

## Android TWA

The verified Digital Asset Links file is:

```text
public/.well-known/assetlinks.json
```

It currently authorizes package `app.vercel.scholarasync.twa` with the release
certificate fingerprint already used by the app. If the Android package name
or Play signing certificate changes, update this file before deploying.
