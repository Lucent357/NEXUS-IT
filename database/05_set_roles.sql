-- =========================================================
-- NEXUS IT - 05 Tetapkan peran akun
--
-- SEBELUM menjalankan skrip ini, buat dua akun di dashboard Supabase:
--   Authentication -> Users -> Add user -> Create new user
--   (centang "Auto Confirm User")
--     admin@nexus.example : password kuat, hanya diketahui pemilik
--     demo@nexus.example  : password unik untuk akun demo publik
--
-- Password TIDAK pernah ditulis di repository ini.
-- Akun baru otomatis berperan 'demo' (lihat 03_security.sql),
-- jadi hanya akun admin yang perlu diubah di sini.
--
-- Jalankan KELIMA, setelah akun dibuat.
-- =========================================================

update public.profiles
set role = 'admin', full_name = 'Rafi'
where id = (select id from auth.users where email = 'admin@nexus.example');

update public.profiles
set full_name = 'Demo User'
where id = (select id from auth.users where email = 'demo@nexus.example');

-- Hasil yang benar: dua baris (satu admin, satu demo)
select u.email, p.full_name, p.role
from auth.users u
join public.profiles p on p.id = u.id
order by u.email;
