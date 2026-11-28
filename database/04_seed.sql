-- =========================================================
-- NEXUS IT - 04 Data contoh (seed)
--
-- Data fiktif untuk demo. Semua status aset sudah konsisten dengan
-- tabel assignments dan maintenance_records:
--   - aset in_use       punya assignment aktif
--   - aset maintenance  punya maintenance yang belum selesai
--
-- Jalankan KEEMPAT, setelah 03_security.sql.
-- Untuk mengembalikan data ke kondisi awal: jalankan
-- 06_reset_demo_data.sql, lalu skrip ini lagi.
-- =========================================================

insert into public.categories (name) values
  ('Laptop'), ('Desktop'), ('Monitor'), ('Printer'),
  ('Mobile Device'), ('Peripheral');

insert into public.locations (name) values
  ('Jakarta HQ'), ('Bandung Branch'), ('Surabaya Branch');

insert into public.departments (name) values
  ('IT'), ('Finance'), ('HR'), ('Marketing'), ('Operations');

-- ---------- Employees ----------
insert into public.employees
  (employee_code, full_name, email, job_title, department_id, location_id, status)
select v.code, v.name, v.email, v.title, d.id, l.id, v.status
from (values
  ('EMP-001','Andi Prasetyo','andi.prasetyo@nexus.example','IT Support Engineer','IT','Jakarta HQ','active'),
  ('EMP-002','Siti Rahmawati','siti.rahmawati@nexus.example','Finance Analyst','Finance','Jakarta HQ','active'),
  ('EMP-003','Budi Santoso','budi.santoso@nexus.example','HR Manager','HR','Jakarta HQ','active'),
  ('EMP-004','Dewi Lestari','dewi.lestari@nexus.example','Marketing Specialist','Marketing','Bandung Branch','active'),
  ('EMP-005','Rizky Ramadhan','rizky.ramadhan@nexus.example','Network Engineer','IT','Jakarta HQ','active'),
  ('EMP-006','Maya Putri','maya.putri@nexus.example','Operations Coordinator','Operations','Surabaya Branch','active'),
  ('EMP-007','Hendra Wijaya','hendra.wijaya@nexus.example','Accountant','Finance','Surabaya Branch','active'),
  ('EMP-008','Nadia Kusuma','nadia.kusuma@nexus.example','Graphic Designer','Marketing','Bandung Branch','inactive')
) as v(code, name, email, title, dept, loc, status)
join public.departments d on d.name = v.dept
join public.locations   l on l.name = v.loc;

-- ---------- Assets ----------
insert into public.assets
  (asset_tag, name, category_id, brand, model, serial_number,
   purchase_date, purchase_price, warranty_expiry, location_id,
   condition, status, notes)
select v.tag, v.name, c.id, v.brand, v.model, v.serial,
       v.pdate::date, v.price::numeric, v.warranty::date, l.id,
       v.cond, v.status, v.notes
from (values
  ('AST-0001','Dell Latitude 5440','Laptop','Dell','Latitude 5440','DL5440-A001','2024-02-15','18500000','2027-02-15','Jakarta HQ','good','in_use',null),
  ('AST-0002','Lenovo ThinkPad T14','Laptop','Lenovo','ThinkPad T14 Gen 4','LN-T14-B002','2024-03-10','17200000','2027-03-10','Jakarta HQ','good','in_use',null),
  ('AST-0003','MacBook Air M2','Laptop','Apple','MacBook Air M2','AP-MBA-C003','2023-09-05','19800000','2025-09-05','Bandung Branch','good','in_use','Garansi sudah habis'),
  ('AST-0004','HP ProBook 440 G10','Laptop','HP','ProBook 440 G10','HP-PB440-D004','2024-06-20','13900000','2027-06-20','Jakarta HQ','new','available','Stok cadangan'),
  ('AST-0005','Dell OptiPlex 7010','Desktop','Dell','OptiPlex 7010','DL-OP7010-E005','2022-11-01','12500000','2025-11-01','Surabaya Branch','fair','available',null),
  ('AST-0006','Dell P2422H 24"','Monitor','Dell','P2422H','DL-P2422-F006','2023-04-12','3200000','2026-04-12','Jakarta HQ','good','in_use',null),
  ('AST-0007','LG 27UL500 27"','Monitor','LG','27UL500','LG-27UL-G007','2023-04-12','4100000','2026-04-12','Bandung Branch','good','available',null),
  ('AST-0008','HP LaserJet Pro M404dn','Printer','HP','LaserJet Pro M404dn','HP-M404-H008','2022-08-18','5600000','2024-08-18','Jakarta HQ','fair','maintenance','Printer lantai 2'),
  ('AST-0009','Epson L3250','Printer','Epson','L3250','EP-L3250-I009','2023-01-20','2900000','2025-01-20','Surabaya Branch','good','available',null),
  ('AST-0010','Samsung Galaxy Tab S9','Mobile Device','Samsung','Galaxy Tab S9','SM-TABS9-J010','2024-01-15','12800000','2026-01-15','Surabaya Branch','good','in_use',null),
  ('AST-0011','Logitech MX Master 3S','Peripheral','Logitech','MX Master 3S','LG-MX3S-K011','2024-05-02','1450000','2026-05-02','Jakarta HQ','new','available',null),
  ('AST-0012','Asus VivoBook 14','Laptop','Asus','VivoBook 14','AS-VB14-L012','2020-10-10','8900000','2022-10-10','Jakarta HQ','poor','retired','Motherboard rusak, tidak ekonomis diperbaiki'),
  ('AST-0013','HP EliteDesk 800 G6','Desktop','HP','EliteDesk 800 G6','HP-ED800-M013','2021-03-03','14200000','2024-03-03','Bandung Branch','fair','maintenance',null),
  ('AST-0014','Acer Swift 3','Laptop','Acer','Swift 3','AC-SW3-N014','2022-05-25','10500000','2025-05-25','Surabaya Branch','good','in_use',null)
) as v(tag, name, cat, brand, model, serial, pdate, price, warranty, loc, cond, status, notes)
join public.categories c on c.name = v.cat
join public.locations  l on l.name = v.loc;

-- ---------- Assignments ----------
insert into public.assignments (asset_id, employee_id, assigned_at, returned_at, notes)
select a.id, e.id, v.assigned_at::date, v.returned_at::date, v.notes
from (values
  -- aktif (returned_at kosong)
  ('AST-0001','EMP-001','2024-02-20',null,'Perangkat kerja utama'),
  ('AST-0006','EMP-001','2024-02-20',null,'Monitor tambahan'),
  ('AST-0002','EMP-002','2024-03-15',null,null),
  ('AST-0003','EMP-004','2023-09-10',null,null),
  ('AST-0010','EMP-006','2024-02-01',null,'Untuk survei lapangan'),
  ('AST-0014','EMP-007','2022-06-01',null,null),
  -- riwayat (sudah dikembalikan)
  ('AST-0005','EMP-005','2022-11-10','2024-09-30','Dikembalikan saat pindah ke laptop'),
  ('AST-0012','EMP-008','2020-10-15','2024-12-20','Dikembalikan saat resign'),
  ('AST-0013','EMP-003','2021-03-10','2025-01-15','Dikembalikan karena sering error')
) as v(asset_tag, employee_code, assigned_at, returned_at, notes)
join public.assets    a on a.asset_tag     = v.asset_tag
join public.employees e on e.employee_code = v.employee_code;

-- ---------- Maintenance ----------
insert into public.maintenance_records
  (asset_id, issue, priority, status, technician, reported_at, completed_at, cost, resolution_notes)
select a.id, v.issue, v.priority, v.status, v.tech,
       v.reported::date, v.completed::date, v.cost::numeric, v.notes
from (values
  ('AST-0008','Kertas sering macet dan hasil cetak bergaris','high','in_progress','Rizky Ramadhan','2026-11-18',null,null,null),
  ('AST-0013','Komputer tidak bisa menyala sama sekali','critical','open',null,'2026-11-22',null,null,null),
  ('AST-0005','Power supply rusak, komputer mati mendadak','high','completed','Rizky Ramadhan','2024-09-12','2024-09-18','650000','Power supply diganti baru'),
  ('AST-0012','Laptop tidak menyala setelah terjatuh','medium','completed','Andi Prasetyo','2024-12-01','2024-12-10','350000','Motherboard rusak. Biaya perbaikan lebih mahal dari nilai aset, aset di-retire')
) as v(asset_tag, issue, priority, status, tech, reported, completed, cost, notes)
join public.assets a on a.asset_tag = v.asset_tag;
