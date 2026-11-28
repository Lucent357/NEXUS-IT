-- =========================================================
-- NEXUS IT - 02 Fungsi bisnis (RPC)
--
-- Setiap fungsi mengubah dua tabel sekaligus dalam SATU transaksi,
-- jadi status aset dan catatan transaksi tidak bisa tidak sinkron.
-- Hak eksekusi diatur di 03_security.sql.
--
-- Jalankan KEDUA, setelah 01_schema.sql.
-- =========================================================

-- ---------------------------------------------------------
-- Serahkan aset ke karyawan
-- ---------------------------------------------------------
create or replace function public.assign_asset(
  p_asset_id    uuid,
  p_employee_id uuid,
  p_assigned_at date default current_date,
  p_notes       text default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_asset_status    text;
  v_employee_status text;
  v_id              uuid;
begin
  -- Kunci baris aset supaya dua permintaan bersamaan tidak saling menimpa
  select status into v_asset_status
  from public.assets where id = p_asset_id for update;

  if not found then
    raise exception 'Aset tidak ditemukan.';
  end if;
  if v_asset_status <> 'available' then
    raise exception 'Aset tidak tersedia untuk diserahkan (status saat ini: %).', v_asset_status;
  end if;

  select status into v_employee_status
  from public.employees where id = p_employee_id;

  if not found then
    raise exception 'Karyawan tidak ditemukan.';
  end if;
  if v_employee_status <> 'active' then
    raise exception 'Karyawan berstatus inactive tidak dapat menerima aset.';
  end if;

  insert into public.assignments (asset_id, employee_id, assigned_at, notes)
  values (p_asset_id, p_employee_id, p_assigned_at, p_notes)
  returning id into v_id;

  update public.assets set status = 'in_use' where id = p_asset_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------
-- Kembalikan aset
-- ---------------------------------------------------------
create or replace function public.return_asset(
  p_assignment_id uuid,
  p_returned_at   date default current_date,
  p_condition     text default null,
  p_notes         text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_asset_id    uuid;
  v_assigned_at date;
  v_returned_at date;
begin
  select asset_id, assigned_at, returned_at
    into v_asset_id, v_assigned_at, v_returned_at
  from public.assignments where id = p_assignment_id for update;

  if not found then
    raise exception 'Assignment tidak ditemukan.';
  end if;
  if v_returned_at is not null then
    raise exception 'Aset ini sudah dikembalikan.';
  end if;
  if p_returned_at < v_assigned_at then
    raise exception 'Tanggal pengembalian tidak boleh sebelum tanggal penyerahan.';
  end if;

  update public.assignments
  set returned_at = p_returned_at,
      notes = case
                when p_notes is null or p_notes = '' then notes
                when notes is null then p_notes
                else notes || ' | ' || p_notes
              end
  where id = p_assignment_id;

  update public.assets
  set status    = 'available',
      condition = coalesce(p_condition, condition)
  where id = v_asset_id;
end;
$$;

-- ---------------------------------------------------------
-- Laporkan kerusakan (aset harus Available)
-- ---------------------------------------------------------
create or replace function public.report_maintenance(
  p_asset_id    uuid,
  p_issue       text,
  p_priority    text default 'medium',
  p_technician  text default null,
  p_reported_at date default current_date
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_status text;
  v_id     uuid;
begin
  if p_issue is null or btrim(p_issue) = '' then
    raise exception 'Deskripsi masalah wajib diisi.';
  end if;

  select status into v_status
  from public.assets where id = p_asset_id for update;

  if not found then
    raise exception 'Aset tidak ditemukan.';
  end if;

  if v_status = 'in_use' then
    raise exception 'Aset sedang dipegang karyawan. Kembalikan dulu lewat modul Assignments.';
  elsif v_status = 'maintenance' then
    raise exception 'Aset ini sudah dalam maintenance.';
  elsif v_status = 'retired' then
    raise exception 'Aset berstatus Retired tidak dapat dimaintenance.';
  end if;

  insert into public.maintenance_records
    (asset_id, issue, priority, status, technician, reported_at)
  values
    (p_asset_id, btrim(p_issue), p_priority, 'open',
     nullif(btrim(coalesce(p_technician, '')), ''), p_reported_at)
  returning id into v_id;

  update public.assets set status = 'maintenance' where id = p_asset_id;

  return v_id;
end;
$$;

-- ---------------------------------------------------------
-- Selesaikan maintenance (aset kembali Available atau menjadi Retired)
-- ---------------------------------------------------------
create or replace function public.complete_maintenance(
  p_id               uuid,
  p_completed_at     date default current_date,
  p_cost             numeric default null,
  p_resolution_notes text default null,
  p_retire           boolean default false,
  p_condition        text default null
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_asset_id    uuid;
  v_status      text;
  v_reported_at date;
begin
  select asset_id, status, reported_at
    into v_asset_id, v_status, v_reported_at
  from public.maintenance_records where id = p_id for update;

  if not found then
    raise exception 'Catatan maintenance tidak ditemukan.';
  end if;
  if v_status = 'completed' then
    raise exception 'Maintenance ini sudah selesai.';
  end if;
  if p_completed_at < v_reported_at then
    raise exception 'Tanggal selesai tidak boleh sebelum tanggal laporan.';
  end if;
  if p_resolution_notes is null or btrim(p_resolution_notes) = '' then
    raise exception 'Catatan penyelesaian wajib diisi.';
  end if;

  update public.maintenance_records
  set status           = 'completed',
      completed_at     = p_completed_at,
      cost             = p_cost,
      resolution_notes = btrim(p_resolution_notes)
  where id = p_id;

  update public.assets
  set status    = case when p_retire then 'retired' else 'available' end,
      condition = coalesce(p_condition, condition)
  where id = v_asset_id;
end;
$$;
