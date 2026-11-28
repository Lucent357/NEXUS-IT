-- =========================================================
-- NEXUS IT - 01 Schema
-- Tabel, relasi, constraint, index, dan trigger updated_at.
--
-- Jalankan PERTAMA, di project Supabase yang masih kosong.
-- Skrip ini tidak idempotent: menjalankannya dua kali akan
-- gagal karena tabel sudah ada.
-- =========================================================

-- ---------- Tabel referensi ----------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

create table public.departments (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- ---------- Employees ----------
create table public.employees (
  id            uuid primary key default gen_random_uuid(),
  employee_code text not null unique,
  full_name     text not null,
  email         text not null unique,
  job_title     text,
  department_id uuid not null references public.departments(id) on delete restrict,
  location_id   uuid not null references public.locations(id)   on delete restrict,
  status        text not null default 'active'
                check (status in ('active', 'inactive')),
  created_at    timestamptz not null default now()
);

-- ---------- Assets ----------
create table public.assets (
  id              uuid primary key default gen_random_uuid(),
  asset_tag       text not null unique,
  name            text not null,
  category_id     uuid not null references public.categories(id) on delete restrict,
  brand           text,
  model           text,
  serial_number   text unique,
  purchase_date   date,
  purchase_price  numeric(14,2) check (purchase_price >= 0),
  warranty_expiry date,
  location_id     uuid not null references public.locations(id) on delete restrict,
  condition       text not null default 'good'
                  check (condition in ('new', 'good', 'fair', 'poor')),
  status          text not null default 'available'
                  check (status in ('available', 'in_use', 'maintenance', 'retired')),
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ---------- Assignments ----------
create table public.assignments (
  id          uuid primary key default gen_random_uuid(),
  asset_id    uuid not null references public.assets(id)    on delete restrict,
  employee_id uuid not null references public.employees(id) on delete restrict,
  assigned_at date not null default current_date,
  returned_at date,
  notes       text,
  created_at  timestamptz not null default now(),
  check (returned_at is null or returned_at >= assigned_at)
);

-- Satu aset hanya boleh punya SATU assignment aktif (returned_at kosong)
create unique index one_active_assignment_per_asset
  on public.assignments (asset_id)
  where returned_at is null;

-- ---------- Maintenance ----------
create table public.maintenance_records (
  id               uuid primary key default gen_random_uuid(),
  asset_id         uuid not null references public.assets(id) on delete restrict,
  issue            text not null,
  priority         text not null default 'medium'
                   check (priority in ('low', 'medium', 'high', 'critical')),
  status           text not null default 'open'
                   check (status in ('open', 'in_progress', 'completed')),
  technician       text,
  reported_at      date not null default current_date,
  completed_at     date,
  cost             numeric(14,2) check (cost >= 0),
  resolution_notes text,
  created_at       timestamptz not null default now(),
  check (completed_at is null or completed_at >= reported_at)
);

-- Satu aset hanya boleh punya SATU maintenance yang belum selesai
create unique index one_open_maintenance_per_asset
  on public.maintenance_records (asset_id)
  where status <> 'completed';

-- ---------- Index untuk foreign key (mempercepat query & join) ----------
create index idx_employees_department  on public.employees (department_id);
create index idx_employees_location    on public.employees (location_id);
create index idx_assets_category       on public.assets (category_id);
create index idx_assets_location       on public.assets (location_id);
create index idx_assets_status         on public.assets (status);
create index idx_assignments_asset     on public.assignments (asset_id);
create index idx_assignments_employee  on public.assignments (employee_id);
create index idx_maintenance_asset     on public.maintenance_records (asset_id);
create index idx_maintenance_status    on public.maintenance_records (status);

-- ---------- Otomatis perbarui assets.updated_at ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();
