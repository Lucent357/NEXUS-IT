-- =========================================================
-- NEXUS IT - 07 Pemeriksaan konsistensi dan keamanan
--
-- Jalankan tiap bagian TERPISAH di SQL Editor (kosongkan editor
-- sebelum menempel bagian berikutnya). Editor hanya menampilkan
-- hasil terakhir.
-- =========================================================

-- ---------------------------------------------------------
-- BAGIAN A: konsistensi data. Keempat query harus 0 baris.
-- ---------------------------------------------------------

-- A1. Aset in_use tanpa assignment aktif
select a.asset_tag
from public.assets a
where a.status = 'in_use'
  and not exists (
    select 1 from public.assignments s
    where s.asset_id = a.id and s.returned_at is null
  );

-- A2. Assignment aktif pada aset yang bukan in_use
select s.id
from public.assignments s
join public.assets a on a.id = s.asset_id
where s.returned_at is null and a.status <> 'in_use';

-- A3. Aset maintenance tanpa catatan maintenance yang belum selesai
select a.asset_tag
from public.assets a
where a.status = 'maintenance'
  and not exists (
    select 1 from public.maintenance_records m
    where m.asset_id = a.id and m.status <> 'completed'
  );

-- A4. Maintenance belum selesai pada aset yang bukan maintenance
select m.id
from public.maintenance_records m
join public.assets a on a.id = m.asset_id
where m.status <> 'completed' and a.status <> 'maintenance';

-- ---------------------------------------------------------
-- BAGIAN B: jumlah policy. Setiap tabel aplikasi punya 4 policy,
-- profiles punya 1 (total 29 baris).
-- ---------------------------------------------------------
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- ---------------------------------------------------------
-- BAGIAN C: uji keamanan peran.
-- Mensimulasikan akun demo dan admin langsung di database.
-- Skrip SENGAJA diakhiri error: itu membatalkan semua perubahan uji
-- dan menampilkan ringkasan hasilnya. Bacalah pesan error-nya.
--
-- Hasil yang benar:
--   A (demo tambah data)        : ditolak, BENAR
--   B (demo ubah data)          : baris terubah = 0
--   C (demo panggil fungsi)     : ditolak, BENAR
--   Pembanding (admin tambah)   : berhasil, BENAR
-- ---------------------------------------------------------
do $$
declare
  demo_id  uuid := (select id from auth.users where email = 'demo@nexus.example');
  admin_id uuid := (select id from auth.users where email = 'admin@nexus.example');
  v_asset  uuid := (select id from public.assets where asset_tag = 'AST-0004');
  v_emp    uuid := (select id from public.employees where employee_code = 'EMP-001');
  hasil    text := '';
  n        int;
begin
  -- Sebagai DEMO
  perform set_config('request.jwt.claims',
    json_build_object('sub', demo_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    insert into public.categories (name) values ('Uji Demo');
    hasil := hasil || E'A (demo tambah data): BERHASIL, ini SALAH\n';
  exception when others then
    hasil := hasil || E'A (demo tambah data): ditolak, BENAR\n';
  end;

  update public.assets set notes = 'uji demo' where asset_tag = 'AST-0001';
  get diagnostics n = row_count;
  hasil := hasil || E'B (demo ubah data): baris terubah = ' || n || E' (benar jika 0)\n';

  begin
    perform public.assign_asset(v_asset, v_emp);
    hasil := hasil || E'C (demo panggil fungsi): BERHASIL, ini SALAH\n';
  exception when others then
    hasil := hasil || E'C (demo panggil fungsi): ditolak, BENAR (' || sqlerrm || E')\n';
  end;

  -- Sebagai ADMIN
  reset role;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin_id, 'role', 'authenticated')::text, true);
  set local role authenticated;

  begin
    insert into public.categories (name) values ('Uji Admin');
    hasil := hasil || E'Pembanding (admin tambah data): berhasil, BENAR\n';
  exception when others then
    hasil := hasil || E'Pembanding (admin tambah data): ditolak, SALAH (' || sqlerrm || E')\n';
  end;

  reset role;

  -- Error ini disengaja: membatalkan semua perubahan uji dan menampilkan ringkasan
  raise exception E'\n%', hasil;
end $$;
