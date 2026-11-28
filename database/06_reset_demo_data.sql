-- =========================================================
-- NEXUS IT - 06 Reset data demo
--
-- MENGHAPUS SELURUH ISI tujuh tabel aplikasi (kategori, lokasi,
-- departemen, karyawan, aset, assignment, maintenance).
-- Akun login dan tabel profiles TIDAK tersentuh.
--
-- Pemakaian: jalankan skrip ini, lalu jalankan 04_seed.sql
-- untuk mengisi kembali data contoh.
--
-- Hanya untuk data demo. Jangan dijalankan pada data sungguhan.
-- =========================================================

truncate table
  public.maintenance_records,
  public.assignments,
  public.assets,
  public.employees,
  public.categories,
  public.locations,
  public.departments
cascade;
