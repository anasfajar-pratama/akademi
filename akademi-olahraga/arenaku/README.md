# Arenaku — Aplikasi

Implementasi aplikasi (Laravel + Inertia + React + TypeScript + Tailwind) untuk platform manajemen akademi olahraga multi-akademi. Dokumen desain ada di `../DESIGN.md` dan `../IMPLEMENTATION.md`.

## Stack

- Laravel 13 (PHP 8.3), MySQL 8
- Inertia.js v3 + React 19 + TypeScript
- Tailwind CSS 4, Lucide icons
- spatie/laravel-permission (teams = `academy_id`)

## Menjalankan

```bash
# 1. Siapkan database (mis. arenaku)
mysql -u root -e "CREATE DATABASE arenaku CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Konfigurasi
cp .env.example .env
php artisan key:generate

# 3. Migrasi + data awal
php artisan migrate --seed

# 4. Aset frontend + jalankan
npm install
npm run dev        # terminal 1 (Vite)
php artisan serve  # terminal 2 → http://127.0.0.1:8000
```

> Catatan lingkungan: bila `NODE_ENV=production` diset di shell, `npm install` akan melewati `devDependencies`. Jalankan `npm install --include=dev`.

## Akun demo

Halaman login menampilkan daftar akun demo dengan tombol **Masuk** sekali klik (aktif saat `APP_ENV=local` atau `DEMO_MODE=true`; matikan di produksi).

| Peran | Login | Sandi |
|---|---|---|
| Super Admin | super@arenaku.test | password |
| Admin Akademi | admin@arenaku.test | password |
| Pelatih | coach@arenaku.test | password |
| Orang Tua | ortu@arenaku.test | password |

`DemoDataSeeder` menyiapkan 1 akademi contoh (Arena Badminton Club) berisi akun di atas, 2 lokasi, 3 paket, 6 member + wali, 3 jadwal, dan 1 sesi absensi terbuka. Akun yang dibuat lewat wizard Buat Akademi tetap wajib ganti password; akun demo tidak.

## Yang sudah berjalan (fondasi)

- Auth: login dengan email **atau** nomor HP, rate limit 5/menit, logout.
- Paksa ganti password untuk akun yang dibuat admin (`must_change_password`).
- Multi-akademi: global scope `academy_id` (trait `BelongsToAcademy`), singleton `CurrentAcademy`, middleware `SetCurrentAcademy`.
- RBAC per akademi: peran `admin/coach/parent/member` disimpan di `academy_user` + mirror ke spatie teams. Super Admin lewat flag `is_super_admin`.
- Wizard **Buat Akademi** (khusus Super Admin): akademi + akun admin/pelatih + member awal (beserta wali) dalam satu transaksi; template skill cabang disalin otomatis.
- Pemilih akademi/peran saat user punya lebih dari satu keanggotaan.
- **Kelola akun** di halaman akademi: tambah akun (admin/pelatih/orang tua/member), kirim ulang kredensial, aktif/nonaktifkan.
- **Pengaturan akademi**: kelola lokasi/GOR dan paket & harga.
- **Member**: CRUD + wali (bisa lebih dari satu), pencarian & filter **status/level/lokasi**, kode member otomatis; halaman detail menampilkan **progres skill** dan **ringkasan keuangan** (tunggakan + daftar tagihan).
- **Jadwal**: CRUD latihan/sparring/turnamen/event + tombol **Mulai sesi** yang membuat snapshot absensi.
- **Skill & penilaian** (pelatih & admin): pelatih bisa **menambah kategori/skill** sendiri; penilaian **per sesi** dengan skala 1–5, diringkas **per periode bulan** (`assessments.period`). Ada **gerbang**: absensi harus disimpan dulu sebelum menu penilaian bisa dibuka. Catatan pelatih punya penanda **Orang tua / Internal** — catatan internal tidak tampil di portal orang tua.
- **Keuangan**: tagihan bulanan otomatis (**generate per periode**, **prorata** untuk member yang masuk di tengah bulan, **anti-duplikat**), pencatatan pembayaran (tunai/transfer/QRIS), status otomatis (belum bayar → sebagian → lunas, plus penanda **terlambat**), rekap **kolektibilitas**, dan **kwitansi cetak** (HTML print).
- **Dashboard**: KPI per peran — admin (member, kehadiran + tren, pendapatan, tunggakan, kolektibilitas), pelatih (absensi & penilaian tertunda), Super Admin (**konsolidasi lintas akademi**: member, pendapatan, tunggakan) — plus daftar **"perlu tindakan"**.
- **Akademi**: Super Admin bisa **edit** (nama, cabang, kontak, warna brand, status) dan **aktif/nonaktifkan**; halaman detail menampilkan statistik akademi.
- Portal Orang Tua (mobile-first): daftar anak, ringkasan kehadiran, jadwal terdekat, riwayat absensi, **progres skill dari pelatih** (skor terbaru per skill + catatan, rata-rata kategori berbobot, delta vs periode lalu), dan **daftar tagihan** anak.
- Halaman Pelatih (mobile-first): jadwal saya + form absensi cepat (5 status), lalu lanjut ke penilaian skill.

Data demo: `DemoDataSeeder` membuat jadwal **Sabtu & Minggu 16.00–20.00** (2 pekan lampau + 2 pekan ke depan), sesi lampau berisi absensi + nilai skill, satu sesi **terbuka tanpa absensi** untuk mencoba alur absensi → penilaian, serta **tagihan + pembayaran contoh** (bulan lalu lunas, bulan ini sebagian) agar dashboard dan keuangan langsung terisi.

## Testing

```bash
php artisan test
```

Cakupan saat ini (31 tes): tenancy, provisioning wizard, kelola member, jadwal + sesi absensi, akses Super Admin, skill & penilaian (termasuk gerbang absensi + visibilitas catatan), serta keuangan (generate idempoten, prorata, status pembayaran).

## Belum dikerjakan (lanjutan)

WhatsApp (`wa.me`/Cloud API), import member Excel/CSV, upload/crop foto member, radar chart, rapor & kwitansi **PDF** (kini masih cetak via browser), peta Leaflet, laporan/export Excel, audit log, pengumuman, sub-level & riwayat kenaikan level.
