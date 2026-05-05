
-- Public bucket for the about-section profile picture
insert into storage.buckets (id, name, public) values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do nothing;

-- Public read
create policy "Public read profile-pictures"
on storage.objects for select
using (bucket_id = 'profile-pictures');

-- Open write (admin gating is enforced client-side via admin wallet check)
create policy "Anyone can upload profile-pictures"
on storage.objects for insert
with check (bucket_id = 'profile-pictures');

create policy "Anyone can update profile-pictures"
on storage.objects for update
using (bucket_id = 'profile-pictures');

create policy "Anyone can delete profile-pictures"
on storage.objects for delete
using (bucket_id = 'profile-pictures');

-- Tiny key/value table for site-wide settings (e.g. profile picture size)
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

create policy "Public read app_settings"
on public.app_settings for select
using (true);

create policy "Anyone can insert app_settings"
on public.app_settings for insert
with check (true);

create policy "Anyone can update app_settings"
on public.app_settings for update
using (true);
