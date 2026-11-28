-- =========================================================
-- NEXUS IT - 03 Keamanan: peran, Row Level Security, hak akses
--
-- Dua peran:
--   admin : boleh membaca dan menulis semua data
--   demo  : hanya boleh membaca (select)
-- Pengunjung tanpa login tidak punya akses apa pun.
-- Akun baru otomatis berperan 'demo'. Peran admin hanya bisa
-- diberikan lewat SQL (lihat 05_set_roles.sql).
--
-- Jalankan KETIGA, setelah 01_schema.sql dan 02_functions.sql.
-- =========================================================

-- ---------- Tabel profiles (satu baris per akun login) ----------
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       text not null default 'demo' check (role in ('admin', 'demo')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Pengguna hanya boleh membaca profilnya sendiri.
-- Tidak ada policy tulis, jadi peran tidak bisa diubah lewat API.
create policy "read_own_profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- ---------- Profil otomatis untuk akun baru (peran awal: demo) ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    'demo'
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Helper: apakah pengguna saat ini admin? ----------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ---------- Hak akses tabel aplikasi ----------
grant usage on schema public to anon, authenticated;

revoke all on
  public.categories, public.locations, public.departments, public.employees,
  public.assets, public.assignments, public.maintenance_records
from anon;

grant select, insert, update, delete on
  public.categories, public.locations, public.departments, public.employees,
  public.assets, public.assignments, public.maintenance_records
to authenticated;

-- ---------- Row Level Security: baca untuk semua yang login, tulis hanya admin ----------
do $$
declare t text;
begin
  foreach t in array array[
    'categories', 'locations', 'departments', 'employees',
    'assets', 'assignments', 'maintenance_records'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);

    execute format(
      'create policy "read_authenticated" on public.%I
         for select to authenticated using (true)', t);

    execute format(
      'create policy "admin_insert" on public.%I
         for insert to authenticated with check (public.is_admin())', t);

    execute format(
      'create policy "admin_update" on public.%I
         for update to authenticated
         using (public.is_admin()) with check (public.is_admin())', t);

    execute format(
      'create policy "admin_delete" on public.%I
         for delete to authenticated using (public.is_admin())', t);
  end loop;
end $$;

-- ---------- Hak eksekusi fungsi bisnis: hanya pengguna yang login ----------
revoke execute on function public.assign_asset(uuid, uuid, date, text) from public, anon;
revoke execute on function public.return_asset(uuid, date, text, text) from public, anon;
revoke execute on function public.report_maintenance(uuid, text, text, text, date) from public, anon;
revoke execute on function public.complete_maintenance(uuid, date, numeric, text, boolean, text) from public, anon;

grant execute on function public.assign_asset(uuid, uuid, date, text) to authenticated;
grant execute on function public.return_asset(uuid, date, text, text) to authenticated;
grant execute on function public.report_maintenance(uuid, text, text, text, date) to authenticated;
grant execute on function public.complete_maintenance(uuid, date, numeric, text, boolean, text) to authenticated;
