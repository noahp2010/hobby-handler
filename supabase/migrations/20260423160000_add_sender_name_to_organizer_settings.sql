alter table if exists public.organizer_settings
add column if not exists sender_name text;
\