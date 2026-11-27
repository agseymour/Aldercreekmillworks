# Cloud setup (do this at the end)

1. In Supabase > Project Settings > API, copy the **anon public** key (starts `eyJ...`) or the **publishable** key (`sb_publishable_...`) into `RAW_SUPABASE_ANON_KEY` in `cloud-sync.js`. The current value is the project ref, which cannot work, so saves stay on the device until it is replaced.
2. Tables (SQL editor):

```sql
create table if not exists acm_saves (
  class_code text not null, shop_name text not null,
  pin text, stars numeric, cash int, act int, legacy_title text,
  save_json text, updated_at timestamptz default now(),
  primary key (class_code, shop_name));
create table if not exists acm_classes (
  class_code text primary key, teacher_hash text not null);
alter table acm_saves enable row level security;
alter table acm_classes enable row level security;
create policy "acm saves open" on acm_saves for all using (true) with check (true);
create policy "acm classes read/create" on acm_classes for select using (true);
create policy "acm classes insert" on acm_classes for insert with check (true);
```

## What is and isn't protected
* Student PINs and the teacher PIN are stored as salted SHA-256 hashes (`h1:...`), never plain text. Old plaintext PINs still work and are replaced by a hash on the next save.
* The dashboard never selects the `pin` column.
* The anon key is public by design, so anyone who inspects the page could still read saves from the REST API. That is acceptable for a classroom game with no personal data, but it is **not** strong security. If you later want real protection, move reads behind a Supabase RPC/Edge Function that checks the teacher hash.

## Using the dashboard
Open `teacher.html`. Enter the class code and a teacher PIN. The first PIN used for a class code becomes that class's teacher PIN. Without cloud configured it reads saves from the same browser only (useful for testing on the lab machine).
