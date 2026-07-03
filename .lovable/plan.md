# Upgrade Plan

Goal: Cooler simple landing page + a fully-working Admin and Technician workflow (frontend + backend + database), with client self-signup and admin-invited technicians.

## 1. Landing page — simple but cool
- Keep the current dark cyber vibe, no heavy 3D.
- Add: animated aurora gradient background, floating particles (pure CSS), rotating tagline (already there), stats counters, feature bento grid, "How it works" 3-step, testimonials strip, final CTA.
- Clear CTAs: "Sign up as Client" → `/auth`, "Sign in" → `/auth`.
- Fully responsive mobile-first.

## 2. Auth model
- Client: public self-signup on `/auth` (already works).
- Technician: NOT self-signup. Admin sends an email invite; technician sets password via invite link and lands on `/dashboard` with `technician` role pre-assigned.
- Admin: created manually / seeded (kelvinmaina4925@gmail.com super_admin).

## 3. Admin — Technician Management (new page `/admin/technicians`)
- List all technicians: name, email, status (active/inactive), jobs assigned, jobs completed, rating, last seen.
- Actions: Invite technician (email + name + specialty), Deactivate/Activate, View profile, Reassign their open jobs.
- Uses new edge function `invite-technician` (service role → `auth.admin.inviteUserByEmail` + insert profile + assign `technician` role + audit log).

## 4. Admin — Service Requests full control
- View all `service_requests`, filter by status/priority/category.
- Assign / reassign to any technician (dropdown).
- Force status change, add internal note, delete.
- Everything already audited via existing `audit_service_request` trigger.

## 5. Technician — Autonomous workflow
- "Available Jobs" board: unassigned requests, one-click **Claim** (sets `assigned_technician = me`, status → `in_progress`).
- "My Jobs": update status (in_progress → resolved), add resolution note, log time.
- Notifications on new matching jobs.
- No admin dependency required to work.

## 6. Automated email notifications
- Auth emails: signup verification, technician invite, password reset — via Lovable managed auth email templates.
- App emails via `send-transactional-email`:
  - Client: request received, technician assigned, status updated, request resolved.
  - Technician: new job available, job assigned to you.
  - Admin: daily digest (new requests, unassigned > 24h, SLA breaches).
- Daily digest scheduled via pg_cron calling an edge function.

## 7. Database additions
- `technician_profiles` (specialty, availability, rating, jobs_completed, invited_by, invited_at, activated_at).
- `service_request_updates` (request_id, actor, note, status_from, status_to) for timeline.
- Extend `service_requests` if needed with `resolved_at`, `resolution_note`, `time_spent_minutes`.
- RLS: clients see own; technicians see assigned + unassigned pool; admins see all.
- GRANTs on every new table.

## 8. Edge functions
- `invite-technician` (admin only, service role).
- `send-transactional-email` (scaffolded via email tool).
- `daily-admin-digest` (pg_cron every morning).

## Technical order of execution
1. Email domain check + setup dialog (prerequisite for invites & notifications).
2. DB migration (new tables, columns, policies, grants).
3. `invite-technician` edge function.
4. Scaffold app email templates + auth email templates.
5. Frontend: Landing polish, Admin Technicians page, Admin Requests upgrade, Technician job board.
6. Wire notifications on key state transitions.
7. Schedule daily digest cron.

## What I need from you
This is a large build. Confirm and I'll ship it in that order. Two quick calls:
- **Email domain**: do you already have a domain you want emails to come from (e.g. `notify.yourdomain.com`)? If not, I'll open the email setup dialog first.
- **Landing hero copy**: keep current "KELVY CYBERTECH HUB" branding and rotating words, or want a new tagline?
