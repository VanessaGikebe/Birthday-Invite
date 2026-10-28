-- Run this once in the Supabase SQL editor (Dashboard → SQL → New query).

create extension if not exists "pgcrypto";

create table if not exists public.rsvps (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  full_name   text not null check (char_length(full_name) between 2 and 80),
  name_key    text not null,
  attending   boolean not null,
  attendees   smallint not null check (attendees between 0 and 20),
  phone       text check (phone is null or char_length(phone) <= 24),
  dietary     text check (dietary is null or char_length(dietary) <= 200),
  message     text check (message is null or char_length(message) <= 600)
);

-- One RSVP per (normalised) name: blocks accidental double submissions.
create unique index if not exists rsvps_name_key_idx on public.rsvps (name_key);

-- Lock the table down. The site talks to it only from the server using the
-- service-role key, which bypasses RLS. With RLS on and no policies, the public
-- anon key can neither read nor write — the guest list is never exposed.
alter table public.rsvps enable row level security;
