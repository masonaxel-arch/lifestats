# LifeStats • Your Lifetime Stat Sheet

A viral, dark-mode custom life stat counter and live friend-group leaderboard Progressive Web App (PWA) inspired by the *"when you die you see your top 5 stats"* TikTok trend.

## ✨ Core Features

1. **My Stats Tab (Personal Counters)**
   - Pre-populated with 4 relatable starter stats (`🌯 Chipotle Bowls`, `⏰ Times Snoozed Alarm`, `💭 Late Night Overthinking`, `☕ Iced Oat Lattes`) with a **Clear Samples** button.
   - **+ New Stat** modal with custom emoji selector, name, initial count, optional target/goal, and GPS location stamping toggle.
   - Dynamic cards showing bold count, relative time + city (`Last logged: 2h ago • Madison, WI`), and a prominent **+1** button with haptic pop animation and a 5-second **Undo Toast**.

2. **Squads Tab (Joint Trackers & Live Friend Leaderboards)**
   - Frictionless display name setup saved in `localStorage`.
   - **Create Joint Tracker**: Enter topic name and emoji to generate a unique 6-character room code (`#CHIP99`), create the room in Supabase (or offline local sync), and 1-tap **Copy Invite Link** (`?room=CODE`).
   - **Join Tracker**: Enter any 6-character code or open invite links (`?room=CODE`) with automatic squad switching.
   - **Live Leaderboard**: Realtime updates via Supabase Realtime channel (`postgres_changes` on `room_members`), 🥇 1st / 🥈 2nd / 🥉 3rd podium badges, and a **+1 Log Mine** button that updates live counts across all devices.

3. **Log & Map Tab**
   - **Timeline Feed**: Chronological feed of all personal and squad logs with exact timestamps, relative time, captured GPS city/coordinates, and editable notes.
   - **Life Map**: Interactive dark-mode map (via Leaflet & CartoDB tiles) displaying custom emoji pins for every GPS-stamped life action with interactive popups and a **Locate Me** button.

4. **Wrapped Tab (Viral Share Cards)**
   - **My Top 5 Lifetime Stats Receipt**: Aesthetic afterlife transit terminal receipt with barcode graphic, top 5 ranked stats, % share of life actions, and jagged tear edge.
   - **Squad Leaderboard Card**: Electric violet & neon emerald podium card.
   - **Save Image for Story / TikTok**: 9:16 aspect ratio export using `html-to-image` with native Web Share API support and PNG download.

5. **PWA & Mobile-First**
   - Centered 480px mobile-first layout.
   - Apple Web App meta tags (`apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`, `apple-touch-icon`).
   - Web App Manifest (`manifest.json`) and Service Worker (`sw.js`).
   - Built-in iOS "Add to Home Screen" install guide banner.

---

## 🚀 Running the App

```bash
cd /Users/masonaxel/.gemini/antigravity/scratch/lifestats
export PATH="/Users/masonaxel/.gemini/antigravity/scratch/nodejs/bin:$PATH"
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser or mobile Safari.

---

## 🗄️ Supabase Configuration

The `.env` file is generated at `.env`:
```env
VITE_SUPABASE_URL=https://htyckftwowoimgwiyjwu.supabase.co
VITE_SUPABASE_ANON_KEY=[PASTE_YOUR_FULL_SB_PUBLISHABLE_KEY_HERE]
```

### SQL Migration Schema
Paste this into your Supabase Dashboard **SQL Editor**:

```sql
-- 1. Create tables with all columns
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
```
