# Database NEXUS IT

Skrip SQL untuk membangun ulang seluruh database NEXUS IT dari nol di Supabase (PostgreSQL).
Dipakai sebagai cadangan jika project Supabase hilang atau gagal di-restore setelah di-pause.

## Isi

| File | Fungsi |
|------|--------|
| `01_schema.sql` | Tabel, relasi, constraint, index, trigger `updated_at` |
| `02_functions.sql` | Fungsi bisnis: `assign_asset`, `return_asset`, `report_maintenance`, `complete_maintenance` |
| `03_security.sql` | Tabel `profiles`, peran admin/demo, Row Level Security, hak akses |
| `04_seed.sql` | Data contoh fiktif |
| `05_set_roles.sql` | Menetapkan peran akun setelah akun dibuat |
| `06_reset_demo_data.sql` | Mengosongkan 7 tabel aplikasi (dev/demo saja) |
| `07_verify.sql` | Pemeriksaan konsistensi data dan uji keamanan peran |

## Membangun ulang dari nol

1. Buat project Supabase baru.
2. Buka **SQL Editor**, jalankan berurutan: `01` -> `02` -> `03` -> `04` (satu file per eksekusi).
3. Buka **Authentication -> Users -> Add user -> Create new user** (centang *Auto Confirm User*):
   - `admin@nexus.example` (password kuat, hanya pemilik yang tahu)
   - `demo@nexus.example` (password untuk akun demo publik)
4. Jalankan `05_set_roles.sql`. Hasilnya harus dua baris: satu `admin`, satu `demo`.
5. **Authentication -> Sign In / Providers**: nonaktifkan *Allow new users to sign up*.
6. Jalankan `07_verify.sql` bagian per bagian untuk memastikan semuanya benar.
7. Jika project baru, perbarui environment variable di Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` atau nama yang dipakai di `src/lib/supabase.ts`), lalu Redeploy.

## Catatan

- Password dan key tidak pernah disimpan di repository ini.
- Skrip tidak idempotent: menjalankan `01` dua kali akan gagal karena tabel sudah ada.
- `06_reset_demo_data.sql` menghapus data. Jangan dijalankan pada data sungguhan.
- Jika skema diubah lewat dashboard Supabase, perbarui file di folder ini agar tetap sinkron.
