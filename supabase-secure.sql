-- =====================================================================
--  Alder Creek Millworks: locked-down save storage (run once in Supabase > SQL editor)
--
--  What this does
--  * Students and teachers can no longer read or write the tables directly with the public key.
--    Every read/write goes through the functions below, which check the PIN ON THE SERVER.
--  * PIN hashes are never sent back to a browser.
--  * Wrong PINs are throttled: 10 misses locks that workshop (or class) for 10 minutes.
--  * A new class code can only be claimed with your school setup code (set at the bottom).
--
--  Safe to run more than once. Existing saves, PINs and teacher PINs keep working.
-- =====================================================================

-- STEP 1: put your school setup code between the quotes on the next line (something only staff know).
--         Teachers type it once, the first time they open a new class code on the dashboard.
--         Use '' (empty) to let anyone claim an unused class code, which was the old behaviour.
do $$ declare setup_code text := 'CHANGE-ME';
begin
  if setup_code = 'CHANGE-ME' then
    raise exception 'Edit the school setup code at the top of this script (STEP 1) before running it.';
  end if;
  perform set_config('acm.setup_code', setup_code, false);
end $$;

-- STEP 2: run the whole script. Nothing below needs editing.

create table if not exists acm_saves (
  class_code text not null, shop_name text not null,
  pin text, stars numeric, cash int, act int, legacy_title text,
  save_json text, updated_at timestamptz default now(),
  primary key (class_code, shop_name));
create table if not exists acm_classes (
  class_code text primary key, teacher_hash text not null);
create table if not exists acm_attempts (
  k text primary key, fails int not null default 0, locked_until timestamptz);
create table if not exists acm_settings (
  key text primary key, value text);

-- Lock every table: RLS on, no policies, no grants. Only the SECURITY DEFINER functions can touch them.
alter table acm_saves    enable row level security;
alter table acm_classes  enable row level security;
alter table acm_attempts enable row level security;
alter table acm_settings enable row level security;
drop policy if exists "acm saves open" on acm_saves;
drop policy if exists "acm classes read/create" on acm_classes;
drop policy if exists "acm classes insert" on acm_classes;
revoke all on acm_saves, acm_classes, acm_attempts, acm_settings from anon, authenticated, public;

-- ---------- helpers (not callable from the browser) ----------
create or replace function acm__locked(p_k text) returns int
language sql security definer set search_path = public as $$
  select coalesce(ceil(extract(epoch from (locked_until - now())))::int, 0)
  from acm_attempts where k = p_k and locked_until > now()
$$;

create or replace function acm__fail(p_k text) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into acm_attempts as a (k, fails) values (p_k, 1)
  on conflict (k) do update set
    fails = case when a.locked_until is not null and a.locked_until <= now() then 1 else a.fails + 1 end,
    locked_until = case when a.locked_until is not null and a.locked_until <= now() then null else a.locked_until end;
  update acm_attempts set locked_until = now() + interval '10 minutes', fails = 0
  where k = p_k and fails >= 10;
end $$;

create or replace function acm__ok(p_k text) returns void
language sql security definer set search_path = public as $$
  delete from acm_attempts where k = p_k
$$;

-- stored PIN (hashed "h1:...", an old plaintext PIN, or none) vs. what the student typed
create or replace function acm__pin_ok(p_stored text, p_pin text, p_pin_hash text) returns boolean
language sql immutable as $$
  select p_stored is null or p_stored = ''
      or p_stored = p_pin_hash
      or (p_stored not like 'h1:%' and p_stored = btrim(coalesce(p_pin, '')))
$$;

revoke all on function acm__locked(text), acm__fail(text), acm__ok(text), acm__pin_ok(text, text, text) from public, anon, authenticated;

-- ---------- student: load ----------
create or replace function acm_load(p_class text, p_shop text, p_pin text, p_pin_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_class, ''))); s text := btrim(coalesce(p_shop, ''));
        k text := 'save:' || c || '|' || lower(s); r acm_saves; wait int;
begin
  wait := acm__locked(k);
  if wait > 0 then return jsonb_build_object('status', 'locked', 'retry_after', wait); end if;
  select * into r from acm_saves where class_code = c and shop_name = s;
  if not found then return jsonb_build_object('status', 'none'); end if;
  if not acm__pin_ok(r.pin, p_pin, p_pin_hash) then
    perform acm__fail(k);
    return jsonb_build_object('status', 'wrong_pin');
  end if;
  perform acm__ok(k);
  return jsonb_build_object('status', 'ok', 'save_json', r.save_json);
end $$;

-- ---------- student: save ----------
-- p_create_only: the browser hasn't loaded this workshop from the cloud, so it must not overwrite an existing save.
create or replace function acm_save(p_class text, p_shop text, p_pin text, p_pin_hash text,
  p_stars numeric, p_cash int, p_act int, p_title text, p_save text, p_create_only boolean default false) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_class, ''))); s text := btrim(coalesce(p_shop, ''));
        k text := 'save:' || c || '|' || lower(s); r acm_saves; wait int;
begin
  if length(c) not between 1 and 20 or length(s) not between 1 and 24
     or p_pin_hash is null or p_pin_hash !~ '^h1:[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'bad_request');
  end if;
  if length(coalesce(p_save, '')) > 2000000 then return jsonb_build_object('status', 'too_large'); end if;
  wait := acm__locked(k);
  if wait > 0 then return jsonb_build_object('status', 'locked', 'retry_after', wait); end if;

  select * into r from acm_saves where class_code = c and shop_name = s for update;
  if found then
    if not acm__pin_ok(r.pin, p_pin, p_pin_hash) then
      perform acm__fail(k);
      return jsonb_build_object('status', 'wrong_pin');
    end if;
    if p_create_only then return jsonb_build_object('status', 'exists'); end if;
    update acm_saves set pin = p_pin_hash, stars = least(greatest(coalesce(p_stars, 1), 0), 5),
      cash = p_cash, act = p_act, legacy_title = left(p_title, 60), save_json = p_save, updated_at = now()
    where class_code = c and shop_name = s;
  else
    insert into acm_saves (class_code, shop_name, pin, stars, cash, act, legacy_title, save_json, updated_at)
    values (c, s, p_pin_hash, least(greatest(coalesce(p_stars, 1), 0), 5), p_cash, p_act, left(p_title, 60), p_save, now());
  end if;
  perform acm__ok(k);
  return jsonb_build_object('status', 'ok');
end $$;

-- ---------- class leaderboard (no PINs, no save data) ----------
create or replace function acm_leaderboard(p_class text) returns jsonb
language sql security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('shop_name', shop_name, 'stars', stars, 'cash', cash, 'act', act, 'legacy_title', legacy_title)
                            order by stars desc nulls last, cash desc nulls last), '[]'::jsonb)
  from acm_saves where class_code = upper(btrim(coalesce(p_class, ''))) and btrim(coalesce(p_class, '')) <> ''
$$;

-- ---------- teacher ----------
create or replace function acm_teacher_login(p_class text, p_teacher_hash text, p_setup_code text default null) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_class, ''))); k text := 'teacher:' || c; h text; code text; wait int;
begin
  if c = '' or p_teacher_hash is null or p_teacher_hash !~ '^h1:[0-9a-f]{64}$' then
    return jsonb_build_object('status', 'bad_request');
  end if;
  wait := acm__locked(k);
  if wait > 0 then return jsonb_build_object('status', 'locked', 'retry_after', wait); end if;
  select teacher_hash into h from acm_classes where class_code = c;
  if found then
    if h = p_teacher_hash then perform acm__ok(k); return jsonb_build_object('status', 'ok'); end if;
    perform acm__fail(k);
    return jsonb_build_object('status', 'wrong');
  end if;
  -- new class: needs the school setup code, if one is set
  select value into code from acm_settings where key = 'class_setup_code';
  if coalesce(code, '') <> '' and code is distinct from btrim(coalesce(p_setup_code, '')) then
    perform acm__fail(k);
    return jsonb_build_object('status', 'setup_required');
  end if;
  insert into acm_classes (class_code, teacher_hash) values (c, p_teacher_hash) on conflict do nothing;
  perform acm__ok(k);
  return jsonb_build_object('status', 'created');
end $$;

create or replace function acm_class_saves(p_class text, p_teacher_hash text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare c text := upper(btrim(coalesce(p_class, ''))); k text := 'teacher:' || c; h text; wait int;
begin
  wait := acm__locked(k);
  if wait > 0 then return jsonb_build_object('status', 'locked', 'retry_after', wait); end if;
  select teacher_hash into h from acm_classes where class_code = c;
  if not found or h is distinct from p_teacher_hash then
    perform acm__fail(k);
    return jsonb_build_object('status', 'wrong');
  end if;
  return jsonb_build_object('status', 'ok', 'saves', coalesce((
    select jsonb_agg(jsonb_build_object('shop_name', shop_name, 'updated_at', updated_at, 'save_json', save_json) order by shop_name)
    from acm_saves where class_code = c), '[]'::jsonb));
end $$;

revoke all on function acm_load(text, text, text, text), acm_save(text, text, text, text, numeric, int, int, text, text, boolean),
  acm_leaderboard(text), acm_teacher_login(text, text, text), acm_class_saves(text, text) from public;
grant execute on function acm_load(text, text, text, text), acm_save(text, text, text, text, numeric, int, int, text, text, boolean),
  acm_leaderboard(text), acm_teacher_login(text, text, text), acm_class_saves(text, text) to anon, authenticated;

-- school setup code from STEP 1
insert into acm_settings (key, value) values ('class_setup_code', current_setting('acm.setup_code'))
on conflict (key) do update set value = excluded.value;
