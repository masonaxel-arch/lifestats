import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL || '';
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if user has stored a custom key in localStorage or if .env has a real key
export const getStoredSupabaseConfig = () => {
  const localUrl = localStorage.getItem('lifestats_sb_url');
  const localKey = localStorage.getItem('lifestats_sb_key');

  const url = localUrl || envUrl;
  const key = localKey || envKey;

  const isValid = Boolean(
    url &&
    key &&
    !key.includes('PASTE_YOUR_FULL_SB_PUBLISHABLE_KEY_HERE') &&
    key.length > 20
  );

  return { url, key, isValid, isCustom: Boolean(localUrl || localKey) };
};

export const saveSupabaseConfig = (url, key) => {
  if (url) localStorage.setItem('lifestats_sb_url', url.trim());
  if (key) localStorage.setItem('lifestats_sb_key', key.trim());
  window.location.reload();
};

export const clearSupabaseConfig = () => {
  localStorage.removeItem('lifestats_sb_url');
  localStorage.removeItem('lifestats_sb_key');
  window.location.reload();
};

const config = getStoredSupabaseConfig();

export const isSupabaseConfigured = config.isValid;

export const supabase = isSupabaseConfigured
  ? createClient(config.url, config.key, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

// SQL snippet to easily create tables in Supabase Dashboard SQL Editor
export const SUPABASE_SQL_SCHEMA = `-- 1. Create tables with all columns
create table if not exists public.rooms (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  name text not null,
  emoji text default '🔥',
  created_by text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.room_members (
  id uuid default gen_random_uuid() primary key,
  room_code text not null references public.rooms(code) on delete cascade,
  user_id text not null,
  display_name text not null,
  count integer default 0,
  last_logged_at timestamp with time zone default timezone('utc'::text, now()),
  last_location text default '',
  last_lat numeric,
  last_lng numeric,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(room_code, user_id)
);

-- 2. Grant table access to anon and authenticated roles
grant usage on schema public to anon, authenticated;
grant all on table public.rooms to anon, authenticated;
grant all on table public.room_members to anon, authenticated;

-- 3. Enable Realtime replication
alter publication supabase_realtime add table public.rooms;
alter publication supabase_realtime add table public.room_members;

-- 4. Enable RLS
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- 5. Drop existing policies to avoid duplicates
drop policy if exists "Public read & write rooms" on public.rooms;
drop policy if exists "Public read & write room_members" on public.room_members;

-- 6. Create public policies
create policy "Public read & write rooms" on public.rooms for all to anon, authenticated using (true) with check (true);
create policy "Public read & write room_members" on public.room_members for all to anon, authenticated using (true) with check (true);

-- 7. Reload PostgREST schema cache
notify pgrst, 'reload schema';
`;
