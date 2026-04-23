# Admin Panel Strategy

## Web-only, always

The admin panel lives on the web, never inside the mobile app. Reasons:

- Admin tasks (reviewing KYC documents, reading long chat histories,
  resolving disputes, managing payouts) require a big screen.
- Admin accounts should never exist in a public app that anyone can
  download — an attack-surface problem.
- Faster iteration: push a change and it is live, no app-store review.

## Recommended structure for v1

Keep the admin panel inside the same Next.js project as the marketing site,
under the `/admin` path. Protect these routes with a middleware that checks
the user's role.

```text
artisanhire.com/              public landing
artisanhire.com/browse        public browse
artisanhire.com/admin/login   admin entry
artisanhire.com/admin/*       protected, role='admin' only
```

Move to a dedicated `admin.artisanhire.com` subdomain later when the team
grows, if IP restrictions or a separate design system become necessary.

## Component libraries to use

- **shadcn/ui** — modern, accessible, easily customizable components.
- **Tremor** — purpose-built dashboard widgets (KPI cards, charts, tables).
- Optionally, **Refine** or **React Admin** for very fast CRUD scaffolding.

## Admin access control

Admin roles are set manually in the `users` table, never through the public
signup flow. Create the first admin via a database seed script, then allow
existing admins to create additional ones.
