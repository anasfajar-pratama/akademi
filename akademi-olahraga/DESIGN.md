# Arenaku — Desain Produk
### Platform Manajemen Akademi Olahraga Multi-Cabang

> Versi dokumen: 1.0 · Status: draft untuk validasi · Bahasa UI: Indonesia

---

## 1. Ringkasan Produk

**Arenaku** adalah aplikasi web (responsif, bisa dipasang sebagai PWA) untuk mengelola banyak akademi olahraga dalam satu platform. Satu instalasi bisa menampung akademi badminton, renang, taekwondo, sepak bola, basket, dan cabang lain yang dibuat sendiri oleh Super Admin.

Setiap akademi punya data terisolasi: member, pelatih, jadwal, penilaian skill, dan keuangan. Orang tua login ke portal untuk melihat perkembangan anaknya.

**Satu kalimat posisi produk:**
> "Satu aplikasi untuk mengurus akademi olahraga — dari pendaftaran member, absensi latihan, penilaian skill, sampai tagihan bulanan dan pengingat WhatsApp."

**Nama & cabang olahraga bersifat dinamis**, bukan hard-code. Badminton adalah contoh pertama, bukan batasan produk.

---

## 2. Masalah yang Diselesaikan

| Masalah nyata di akademi | Solusi Arenaku |
|---|---|
| Data member & orang tua tercatat di buku/Excel terpisah | Database member terpusat + profil wali + upload foto |
| Perkembangan anak tidak terdokumentasi | Asesmen skill berjenjang dengan skor, catatan, dan grafik tren |
| Absensi manual, sering hilang | Absensi per sesi oleh pelatih, rekap otomatis per bulan |
| Jadwal latihan/sparring tersebar di grup WA | Jadwal terpusat + lokasi GOR + peta + lawan sparring |
| Tagihan bulanan bocor, sulit dilacak | Tagihan otomatis + status bayar + rekap pendapatan |
| Orang tua sering tanya "anak saya bagaimana?" | Portal orang tua: progress, absensi, tagihan, jadwal |
| Pengingat manual satu-satu | Template WhatsApp + antrian kirim sekali klik |

---

## 3. Sasaran & Metrik Keberhasilan

**Sasaran bisnis**
- Akademi bisa onboard tanpa bantuan teknis (buat akademi < 5 menit).
- Admin menghemat waktu administrasi bulanan (tagihan & reminder otomatis).
- Orang tua merasa terlibat → retensi member naik.

**Metrik yang dipantau di dashboard**
- Jumlah akademi & member aktif per cabang olahraga
- Tingkat kehadiran bulanan (%) per kelas/cabang
- Persentase tagihan tertagih sebelum jatuh tempo
- Member berisiko churn (tidak hadir 3 sesi berturut-turut atau tagihan > 30 hari)
- Rata-rata kenaikan skor skill per periode

---

## 4. Peran & Hak Akses

| Peran | Lingkup | Ringkasan hak |
|---|---|---|
| **Super Admin** | Semua akademi | Membuat/menonaktifkan akademi; **saat membuat akademi sekaligus membuat akun Admin Akademi, Pelatih, dan Member pertama** untuk akademi itu; master cabang olahraga & template skill; melihat konsolidasi seluruh akademi |
| **Admin Akademi** | Akademi yang ditugaskan | Semua operasional akademi: member, pelatih, paket, jadwal, absensi, penilaian, tagihan, pengumuman, laporan |
| **Pelatih** | Kelas/member yang ditugaskan | Absensi, input penilaian skill, catatan perkembangan, lihat jadwal, lihat data kontak wali (read-only) |
| **Orang Tua / Wali** | Anak yang terhubung | Lihat profil anak, progress skill, absensi, jadwal, tagihan, kirim konfirmasi pembayaran; tidak bisa mengubah data |
| **Member Dewasa** (opsional) | Dirinya sendiri | Sama seperti orang tua, untuk peserta usia dewasa |

Aturan penting:
- Satu user bisa punya beberapa peran di akademi berbeda (mis. pelatih di akademi A, orang tua di akademi B).
- Orang tua hanya bisa mengakses data anak yang terhubung lewat tabel relasi — tidak ada akses lintas anak.
- Pelatih tidak bisa melihat data keuangan.
- **Hanya Super Admin yang boleh membuat akademi baru.** Admin Akademi hanya mengelola akademi yang ditugaskan dan tidak dapat membuat akademi baru.
- Saat akademi dibuat, Super Admin **langsung membuat akun** Admin Akademi, Pelatih, dan (opsional) Member untuk akademi tersebut dalam satu alur. Kredensial dikirim via email/WhatsApp; akun wajib mengganti password saat login pertama.
- Setelah login, RBAC otomatis mengikuti peran user **pada akademi aktif**. Satu keanggotaan → langsung masuk; beberapa keanggotaan → user memilih akademi/peran lebih dulu.

---

## 5. Model Multi-Akademi

```
Platform Arenaku
├── Cabang Olahraga (master): Badminton, Renang, Taekwondo, Sepak Bola, ...
├── Akademi A (Badminton)  ──┬── Lokasi/GOR (bisa >1)
│                             ├── Paket & Kelas
│                             ├── Member + Wali
│                             ├── Pelatih
│                             └── Keuangan
├── Akademi B (Renang)
└── Akademi C (Sepak Bola)
```

Keputusan desain:
- **Satu database, kolom `academy_id`** pada semua tabel operasional, dilindungi global scope di level aplikasi. Lebih murah dan mudah dirawat dibanding satu database per akademi.
- **Akademi switcher** di header untuk Super Admin; admin akademi langsung masuk ke akademinya.
- **Template skill per cabang olahraga** disediakan saat akademi dibuat, lalu admin boleh menyesuaikan.
- **Branding ringan per akademi**: logo, warna utama, nama, kontak — berguna saat orang tua membuka portal.
- **Hanya Super Admin yang membuat akademi.** Admin Akademi tidak dapat membuat akademi baru; lingkupnya hanya akademi yang ditugaskan.
- **Pembuatan akademi terpadu (wizard).** Satu alur membuat akademi + akun Admin Akademi + Pelatih + Member awal sekaligus, dijalankan dalam satu transaksi agar tidak ada akademi "setengah jadi".
- **Login ter-scope per akademi.** Setelah autentikasi, sistem menetapkan "akademi aktif" dari keanggotaan user; seluruh query otomatis dibatasi ke akademi itu lewat global scope, dan `hasRole()` mengikuti team akademi tersebut.

---

## 6. Modul & Fitur

### 6.1 Modul inti (wajib MVP)

1. **Akademi & Cabang Olahraga** (khusus Super Admin)
   - **Wizard buat akademi**: data akademi (nama, slug, cabang olahraga, kota, logo, warna, kontak, zona waktu) → buat akun Admin Akademi → tambah Pelatih → tambah Member awal → review & simpan (satu transaksi).
   - Kirim kredensial akun baru via email/WhatsApp; akun wajib ganti password saat login pertama.
   - Multi-lokasi/GOR per akademi.
   - Penugasan admin & pelatih ke akademi.
   - Kelola akun akademi (tambah admin/pelatih, kirim ulang kredensial, nonaktifkan).
   - Master template skill per cabang olahraga (otomatis terisi sesuai cabang saat akademi dibuat).

2. **Member & Wali**
   - Profil anak: nama lengkap, panggilan, foto, jenis kelamin, tanggal lahir (usia otomatis), sekolah, jenjang pendidikan, kelas, alamat, level, status (trial/aktif/non-aktif/alumni), tanggal masuk.
   - Profil wali: nama ayah/ibu/wali, hubungan, pekerjaan, no. HP (format 62), email, alamat.
   - Bisa **lebih dari satu wali** per member; tentukan wali utama.
   - Catatan kesehatan: riwayat cedera, alergi, kondisi khusus, kontak darurat.
   - Kode member otomatis (mis. `BAD-2026-0042`).
   - Import massal dari Excel/CSV.
   - Upload foto dengan crop & kompresi.

3. **Level & Kelas**
   - Level baku: **Beginner → Intermediate → Advanced** (bisa ditambah sub-level, mis. Beginner 1/2/3).
   - Paket/kelas: nama, level, harga bulanan, jumlah sesi per bulan, durasi, kuota, lokasi.
   - Riwayat level (naik/turun level dengan tanggal & alasan).

4. **Skill & Penilaian**
   - Kategori skill per cabang olahraga (contoh badminton: Teknik Dasar, Footwork, Pukulan, Strategi, Fisik, Mental).
   - Setiap skill punya rubrik deskriptif untuk skor 1–5.
   - Penilaian oleh pelatih/admin: skor, catatan, tanggal, periode.
   - Riwayat penilaian per skill + grafik tren.
   - Rata-rata berbobot per kategori, radar chart, dan perbandingan dengan periode sebelumnya.
   - **Progress note** (catatan naratif pelatih) dengan opsi terlihat orang tua atau internal.

5. **Absensi**
   - Sesi latihan dibuat dari jadwal; pelatih membuka sesi lalu menandai member.
   - Status: Hadir, Terlambat, Izin, Sakit, Alpa.
   - Catatan per member, opsi check-in QR (fase lanjutan).
   - Rekap: persentase kehadiran per member, per kelas, per bulan.
   - Peringatan otomatis jika kehadiran < 70% dalam sebulan.

6. **Jadwal Latihan, Sparring & Event**
   - Tipe: Latihan Rutin, Sparring/Uji Tanding, Turnamen, Event Internal.
   - Field: judul, kelas/paket, pelatih, tanggal, jam mulai–selesai, lokasi GOR, alamat, koordinat + link peta, lawan (untuk sparring), catatan, status (draft/terbit/selesai/batal).
   - Pengulangan mingguan untuk latihan rutin.
   - Publikasi ke orang tua → memicu notifikasi.

7. **Pembayaran**
   - Paket menentukan harga bulanan.
   - Generate tagihan bulanan otomatis (dengan prorata untuk member baru di tengah bulan, diskon, dan biaya tambahan).
   - Status: Draft, Belum Bayar, Sebagian, Lunas, Terlambat, Dibatalkan.
   - Pencatatan pembayaran (tunai, transfer, QRIS) + upload bukti.
   - Rekap bulanan: total tagihan, terbayar, tunggakan, per kelas, per metode.
   - Kwitansi/invoice PDF.

8. **Notifikasi WhatsApp (via `wa.me`)**
   - Template pesan dengan variabel: `{{nama_anak}}`, `{{nama_wali}}`, `{{akademi}}`, `{{periode}}`, `{{jumlah}}`, `{{jatuh_tempo}}`, `{{tanggal_latihan}}`, `{{jam}}`, `{{lokasi}}`, `{{lawan}}`.
   - Antrian pesan: pilih penerima → sistem merender pesan → admin klik "Kirim via WhatsApp" (membuka WA dengan teks siap kirim).
   - Aturan pengingat: H-7, H-3, H-1 jatuh tempo; H+1 keterlambatan; H-1 jadwal latihan/sparring; perubahan jadwal.
   - Riwayat pengiriman & status (draft, terkirim, gagal).
   - Desain channel dibuat abstrak (`WhatsAppChannel`) supaya nanti bisa diganti ke WhatsApp Cloud API tanpa mengubah modul lain.

9. **Portal Orang Tua**
   - Pilih anak (jika lebih dari satu).
   - Ringkasan: level, kehadiran bulan ini, tagihan, jadwal terdekat.
   - Progress skill: grafik radar + tren per skill + catatan pelatih.
   - Riwayat absensi.
   - Tagihan + tombol konfirmasi pembayaran (upload bukti).
   - Unduh rapor PDF per periode.
   - Kalender jadwal + tombol buka lokasi di Google Maps.

10. **Dashboard & Laporan**
    - KPI akademi, pendapatan, kehadiran, tagihan.
    - Laporan per periode, export Excel/PDF.
    - Audit log aktivitas penting.

### 6.2 Fitur tambahan yang saya sarankan (belum disebut)

Ditandai prioritas: **P1** = sangat berguna & murah dibuat, **P2** = menambah nilai, **P3** = nanti.

| # | Fitur | Manfaat | Prioritas |
|---|---|---|---|
| 1 | **Multi-lokasi/GOR per akademi** | Satu akademi sering latihan di beberapa GOR; jadwal & absensi ikut lokasi | P1 |
| 2 | **Kuota kelas + waiting list** | Mengontrol rasio pelatih:member dan mengisi slot kosong | P1 |
| 3 | **Kelas percobaan (trial) & konversi** | Calon member daftar trial online, otomatis jadi prospek | P1 |
| 4 | **Riwayat cedera & catatan medis** | Keselamatan anak; pelatih tahu batasan latihan | P1 |
| 5 | **Rapor digital + sertifikat level** | Bukti perkembangan ke orang tua, bisa diunduh PDF | P1 |
| 6 | **Aturan kenaikan level otomatis** | Mis. minimal 80% skill ≥ 4 dan kehadiran ≥ 80% → direkomendasikan naik level | P1 |
| 7 | **Presensi QR / self check-in** | Antrean masuk lebih cepat, mengurangi salah catat | P2 |
| 8 | **Badge, streak & leaderboard** | Meningkatkan motivasi anak dan engagement orang tua | P2 |
| 9 | **Manajemen pelatih: sertifikasi & ketersediaan** | Menghindari bentrok jadwal, data legal pelatih | P2 |
| 10 | **Honor pelatih (payroll sederhana)** | Hitung honor per sesi/kehadiran pelatih | P2 |
| 11 | **Pengumuman & broadcast** | Info turnamen/libur tersampaikan seragam | P2 |
| 12 | **Galeri foto latihan & turnamen** | Bukti sosial, bahan konten marketing | P2 |
| 13 | **Landing page akademi + pendaftaran online** | Sumber leads baru langsung masuk ke sistem | P2 |
| 14 | **Laporan retensi & churn** | Deteksi member yang berhenti sebelum benar-benar hilang | P2 |
| 15 | **Inventaris alat** (shuttlecock, net, pelampung) | Kontrol pemakaian & pengadaan | P3 |
| 16 | **Integrasi pembayaran online** (Midtrans/Xendit) | Tagihan dibayar langsung dari portal orang tua | P3 |
| 17 | **WhatsApp Cloud API** | Pengiriman otomatis penuh & template resmi | P3 |
| 18 | **Mode multi-bahasa (ID/EN)** | Jika ada member asing | P3 |

### 6.3 Fitur yang sengaja tidak dibuat sekarang
- Akuntansi lengkap (jurnal, neraca) — cukup rekap kas sederhana.
- Manajemen turnamen dengan bracket — cukup event & sparring.
- Aplikasi mobile native — PWA sudah cukup.

---

## 7. Alur Pengguna Utama

### 7.1 Onboarding akademi (khusus Super Admin)
```
Login sebagai Super Admin → "Buat Akademi"
→ Langkah 1: data akademi + pilih cabang olahraga (sistem mengisi template skill)
→ Langkah 2: buat akun Admin Akademi (nama, email/HP, password) — bisa >1
→ Langkah 3: tambah Pelatih (opsional, bisa >1)
→ Langkah 4: tambah Member awal + wali (opsional; 1-per-1 atau import)
→ Langkah 5: review → simpan (satu transaksi) → kirim kredensial via email/WA
→ tambah lokasi/GOR & paket/harga → akademi siap dipakai
```
Admin/pelatih/member baru login dengan kredensial yang dikirim, wajib mengganti password
saat login pertama, lalu langsung masuk ke akademi masing-masing dengan menu sesuai peran.
Admin Akademi **tidak** melihat menu "Buat Akademi".

### 7.2 Pendaftaran member baru (Admin)
```
Tambah Member → data anak → data wali (bisa >1) → pilih paket & jadwal
→ upload foto → persetujuan orang tua → status "Trial" atau "Aktif"
→ tagihan bulan pertama dibuat (prorata jika perlu)
```

### 7.3 Sesi latihan (Pelatih)
```
Buka jadwal hari ini → mulai sesi → absensi (Hadir/Terlambat/Izin/Sakit/Alpa)
→ catatan sesi → input penilaian skill (opsional, biasanya per bulan)
→ simpan → orang tua melihat rekap di portal
```

### 7.4 Sparring (Admin/Pelatih)
```
Buat jadwal tipe Sparring → isi lawan, GOR, alamat, titik peta, jam
→ pilih kelas yang ikut → terbitkan → pengingat WA H-1 ke orang tua
```

### 7.5 Penagihan (Admin)
```
Generate tagihan bulanan → review → kirim
→ H-7/H-3/H-1 reminder WA → orang tua bayar & upload bukti
→ admin verifikasi → status Lunas → rekap & kwitansi
```

### 7.6 Orang tua
```
Login → pilih anak → lihat ringkasan → progress skill → absensi → tagihan
→ jadwal terdekat (buka maps) → unduh rapor
```

### 7.7 Login & penetapan peran per akademi
```
Login (email/HP + password)
→ sistem ambil keanggotaan (academy_user) milik user
→ jika 1 keanggotaan: set akademi aktif + arahkan ke layout peran
   (admin → AdminLayout, pelatih → CoachLayout, wali → ParentLayout)
→ jika >1 keanggotaan: tampilkan pemilih akademi/peran lebih dulu
→ bila akun dibuat admin & belum ganti password: paksa ganti password
→ selama sesi, middleware mengunci akademi aktif
   → RBAC & semua query berlaku pada akademi itu saja
```

---

## 8. Data Member (field lengkap)

**Data anak**
- Nama lengkap, nama panggilan
- Foto (wajib untuk kartu member)
- Jenis kelamin, tanggal lahir, usia (otomatis)
- Sekolah, jenjang pendidikan (TK/SD/SMP/SMA/Kuliah/Umum), kelas (mis. 4A)
- Alamat lengkap, kota, kode pos
- Status: Trial / Aktif / Non-aktif / Alumni
- Tanggal masuk, level saat ini, kode member
- Paket & lokasi latihan utama, pelatih utama
- Catatan kesehatan: alergi, riwayat cedera, kondisi khusus
- Kontak darurat (nama & nomor)
- Sumber pendaftaran (walk-in, Instagram, referral, dll.)

**Data wali**
- Nama, hubungan (Ayah/Ibu/Wali), pekerjaan
- No. WhatsApp aktif (wajib), email (opsional)
- Alamat (bisa sama dengan anak)
- Wali utama (penentu penerima notifikasi)

**Data pelatih**
- Nama, foto, no. HP, email
- Sertifikasi & nomor lisensi, spesialisasi (mis. footwork, fisik)
- Lokasi/kelas yang diampu, ketersediaan jadwal
- Tarif honor per sesi (opsional)

---

## 9. Level & Kurikulum Skill

### 9.1 Level
| Level | Fokus | Ciri |
|---|---|---|
| Beginner | Fondasi | Pengenalan gerak dasar, aturan main, koordinasi |
| Intermediate | Penguatan | Konsistensi teknik, variasi pukulan, pola permainan |
| Advanced | Kompetitif | Taktik, kecepatan, mental bertanding, kesiapan turnamen |

Level dapat memiliki sub-level. Kenaikan level dicatat sebagai riwayat, bukan sekadar menimpa field.

### 9.2 Template skill per cabang olahraga

**Badminton (contoh default)**
| Kategori | Skill |
|---|---|
| Teknik Dasar | Grip, stance, servis, footwork dasar |
| Pukulan | Clear, drop shot, smash, netting, drive, backhand |
| Footwork & Gerak | Kecepatan langkah, recovery, kelincahan |
| Strategi | Pola serangan, pertahanan, pembacaan permainan |
| Fisik | Stamina, kekuatan, fleksibilitas |
| Mental & Disiplin | Fokus, sportivitas, kedisiplinan latihan |

**Renang:** pernapasan, floating, streamline, gaya bebas, gaya punggung, gaya dada, gaya kupu-kupu, turn & start, ketahanan.
**Taekwondo:** kuda-kuda, tendangan dasar, poomsae, sparring, kekuatan, disiplin.
**Sepak bola:** controlling, passing, dribbling, shooting, positioning, fisik, kerja sama tim.

Rubrik skor **1–5**:
1. Belum menguasai — perlu bimbingan penuh
2. Dasar — bisa dengan bantuan
3. Cukup — konsisten dalam kondisi mudah
4. Baik — konsisten dalam kondisi permainan
5. Sangat baik — otomatis, tahan tekanan, bisa jadi contoh

Skor bukan nilai absolut; fokus pada **tren** dan **bukti catatan**.

---

## 10. Sistem Penilaian & Progression

- Setiap penilaian menyimpan: member, skill, skor, catatan, penilai, tanggal, periode (bulan).
- **Skor kategori** = rata-rata berbobot skill di kategori tersebut.
- **Skor keseluruhan** = rata-rata berbobot kategori.
- **Delta** = skor periode ini − periode sebelumnya (tampil sebagai +0.4 dsb).
- **Radar chart** membandingkan periode sekarang vs sebelumnya.
- **Rekomendasi naik level** otomatis jika:
  - minimal 80% skill ber nilai ≥ 4, dan
  - kehadiran ≥ 80% dalam 3 bulan terakhir, dan
  - tidak ada catatan disiplin berat.
  Rekomendasi bersifat saran; keputusan tetap di admin.
- **Catatan kualitatif** wajib menyertai skor agar tidak sekadar angka.

---

## 11. Absensi

- Sesi dibuat dari jadwal (tanggal, kelas, pelatih).
- Status: **Hadir / Terlambat / Izin / Sakit / Alpa**.
- Satu member hanya punya satu status per sesi.
- Sesi bisa disimpan sebagai draft lalu dikunci setelah selesai.
- Rekap: total sesi, hadir, %, tren bulanan.
- Aturan: kehadiran < 70% sebulan → tandai "perlu perhatian" di dashboard admin dan portal orang tua.

---

## 12. Jadwal & Sparring

- Jenis: Latihan Rutin, Sparring, Turnamen, Event.
- Latihan rutin bisa berulang mingguan.
- Sparring wajib punya **lawan** (nama klub/sekolah) dan opsional hasil pertandingan.
- Lokasi menyimpan nama GOR, alamat lengkap, latitude/longitude, dan link peta.
- Preview peta ditampilkan di detail jadwal + tombol "Buka di Google Maps".
- Publikasi jadwal memicu pengingat H-1 ke wali.
- Perubahan/ pembatalan jadwal mengirim notifikasi "jadwal berubah".

---

## 13. Pembayaran

**Siklus**
1. Admin generate tagihan per periode (default: awal bulan).
2. Sistem membuat invoice per member aktif sesuai paket.
3. Prorata otomatis bila tanggal masuk di tengah periode.
4. Diskon (per member / per paket) dan biaya tambahan (mis. ujian kenaikan level).
5. Reminder H-7, H-3, H-1, dan H+1.
6. Pembayaran dicatat; upload bukti opsional.
7. Status Lunas → kwitansi tersedia.

**Status tagihan:** Draft · Belum Bayar · Sebagian · Lunas · Terlambat · Dibatalkan.

**Rekap:** total tagihan, total terbayar, tunggakan, persentase kolektibilitas, breakdown per kelas/lokasi/metode.

---

## 14. Notifikasi WhatsApp

### 14.1 Template awal

**Pengingat tagihan (H-3)**
```
Halo {{nama_wali}}, kami mengingatkan tagihan latihan {{nama_anak}}
di {{akademi}} untuk periode {{periode}} sebesar {{jumlah}},
jatuh tempo {{jatuh_tempo}}.

Pembayaran dapat dilakukan melalui transfer ke rekening akademi.
Konfirmasi: {{link_portal}}

Terima kasih 🙏
```
*(emoji pada template bisa dimatikan di pengaturan)*

**Pengingat jadwal latihan (H-1)**
```
Halo {{nama_wali}}, jadwal latihan {{nama_anak}}:
🗓 {{tanggal_latihan}} · {{jam}}
📍 {{lokasi}}
👟 Pelatih: {{pelatih}}

Mohon hadir 10 menit lebih awal.
```

**Sparring**
```
Sparring {{akademi}} vs {{lawan}}
🗓 {{tanggal_latihan}} · {{jam}}
📍 {{lokasi}}
Lokasi: {{link_maps}}
```

**Konfirmasi pembayaran diterima**
```
Terima kasih {{nama_wali}}, pembayaran {{nama_anak}} periode {{periode}}
sebesar {{jumlah}} telah kami terima. Kwitansi: {{link_kwitansi}}
```

### 14.2 Mekanisme
- Pesan dirender di server lalu disimpan di `notifications_outbox`.
- Admin membuka antrian, klik **Kirim via WhatsApp** → membuka `wa.me/<nomor>?text=<pesan>`.
- Status berubah menjadi "Terkirim" setelah admin menandai (atau otomatis saat halaman kembali).
- Semua nomor dinormalisasi ke format `62…`.
- Channel dibuat abstrak agar bisa ditingkatkan ke WhatsApp Cloud API.

### 14.3 Aturan anti-spam
- Maksimal 1 pengingat tagihan per hari per member.
- Tidak mengirim pada 21.00–07.00 (dijadwalkan ke 08.00 berikutnya).
- Hormati opt-out wali.
- Log setiap pesan untuk audit.

---

## 15. Portal Orang Tua (prioritas pengalaman)

Prinsip: **mobile-first**, satu layar satu jawaban, bahasa sederhana.

Konten:
1. Header: nama wali + pemilih anak.
2. Kartu ringkasan: level, kehadiran bulan ini, status tagihan.
3. "Perkembangan" — radar chart + 3 skill dengan perubahan terbesar.
4. "Jadwal terdekat" — tanggal, jam, GOR, tombol peta.
5. "Tagihan" — nominal, jatuh tempo, tombol konfirmasi bayar.
6. "Catatan pelatih" — narasi singkat, bukan hanya angka.
7. "Rapor" — unduh PDF per periode.

---

## 16. Dashboard & Laporan

**Admin**
- Member aktif, member baru bulan ini, trial, non-aktif.
- Kehadiran bulan ini & perbandingan bulan lalu.
- Pendapatan bulan ini, tagihan tertunggak, kolektibilitas.
- Sesi hari ini + status absensi.
- Daftar tindakan: tagihan jatuh tempo, member jarang hadir, sesi belum diabsen.

**Super Admin**
- Konsolidasi semua akademi: jumlah member, pendapatan, pertumbuhan.
- Kesehatan akademi (aktif / perlu perhatian).

**Pelatih**
- Jadwal hari ini, kelas yang diampu, member perlu perhatian, penilaian tertunda.

**Laporan**
- Member per level/usia/lokasi.
- Kehadiran per kelas/periode.
- Progress skill per periode.
- Keuangan per periode/metode.
- Export Excel & PDF.

---

## 17. Information Architecture

```
Arenaku
├── Publik
│   ├── Landing page akademi
│   ├── Pendaftaran trial
│   └── Login
├── Admin
│   ├── Dashboard
│   ├── Akademi & Lokasi
│   ├── Master Skill (per cabang olahraga)
│   ├── Member (list, detail, import)
│   ├── Pelatih
│   ├── Paket & Kelas
│   ├── Jadwal (latihan, sparring, event)
│   ├── Absensi
│   ├── Penilaian Skill
│   ├── Pembayaran (tagihan, pembayaran, rekap)
│   ├── Notifikasi WhatsApp (antrian, template, riwayat)
│   ├── Pengumuman
│   └── Laporan & Pengaturan
├── Pelatih
│   ├── Dashboard
│   ├── Jadwal Saya
│   ├── Absensi Sesi
│   └── Penilaian Member
└── Orang Tua
    ├── Beranda Anak
    ├── Perkembangan
    ├── Absensi
    ├── Jadwal
    ├── Tagihan
    └── Rapor
```

---

## 18. Design System

### 18.1 Warna
| Token | Nilai | Pemakaian |
|---|---|---|
| `ink` | `#0B1220` | Sidebar, teks utama, tombol primer |
| `ink-soft` | `#152238` | Hover, kartu gelap |
| `lime` | `#C9F24D` | Aksen energi, highlight, CTA sekunder |
| `emerald` | `#10B981` | Status positif, lunas, hadir |
| `amber` | `#F59E0B` | Peringatan, terlambat, jatuh tempo |
| `rose` | `#F43F5E` | Alpa, tunggakan, bahaya |
| `sky` | `#0EA5E9` | Info, jadwal |
| `slate` | `#64748B` | Teks sekunder |
| `line` | `#E6EAF1` | Border |
| `surface` | `#F5F7FA` | Latar halaman |

Alasan: navy + lime memberi kesan sporty dan kompetitif, tetap netral untuk semua cabang olahraga (tidak terikat warna badminton).

### 18.2 Tipografi
- **Plus Jakarta Sans** (Google Fonts), fallback system-ui.
- Skala: 12 / 14 / 16 / 20 / 24 / 32 / 40 px.
- Heading weight 700–800, body 400–500. Angka KPI pakai tabular numerals.

### 18.3 Komponen
- Sidebar gelap 260px, grup menu, academy switcher di atas, kartu user di bawah.
- Topbar: judul halaman, breadcrumb, pencarian, notifikasi, avatar.
- Card: radius 16px, border 1px, shadow halus.
- Badge status: pill dengan titik warna.
- Tabel: header abu muda, baris hover, aksi di kanan.
- Form: label di atas, helper text, error state merah.
- Modal: max-width 560–720px, footer sticky.
- Empty state: ilustrasi sederhana + aksi utama.
- Toast: pojok kanan atas.

### 18.4 Aksesibilitas
- Kontras teks minimal WCAG AA.
- Fokus keyboard terlihat (ring 2px).
- Jangan mengandalkan warna saja untuk status (selalu ada label).
- Target sentuh minimal 40×40px.
- Bahasa Indonesia, format tanggal `10 Nov 2026`, mata uang `Rp 450.000`.

---

## 19. Layar pada Prototype HTML

| File | Peran | Isi utama |
|---|---|---|
| `index.html` | Publik | Landing + daftar layar demo |
| `login.html` | Semua | Login + pemilih peran |
| `dashboard.html` | Admin | KPI, grafik, sesi hari ini, tindakan |
| `akademi.html` | Super Admin | Multi-akademi, buat akademi, template skill |
| `member.html` | Admin | Daftar member, filter, tambah member |
| `member-detail.html` | Admin | Profil, wali, skill, absensi, pembayaran |
| `absensi.html` | Pelatih | Absensi sesi + ringkasan live |
| `jadwal.html` | Admin/Pelatih | Jadwal mingguan, sparring, GOR + peta |
| `pembayaran.html` | Admin | Tagihan, rekap, tandai lunas |
| `reminder-wa.html` | Admin | Antrian WA, template, riwayat |
| `portal-orangtua.html` | Orang Tua | Progress anak, tagihan, jadwal |

---

## 20. Aturan Bisnis Ringkas

1. Member tidak bisa aktif tanpa wali utama dengan nomor WhatsApp valid.
2. Satu member hanya punya satu paket aktif pada satu waktu (riwayat paket disimpan).
3. Tagihan unik per member per periode (tidak boleh dobel).
4. Penilaian skill hanya bisa dilakukan pelatih yang mengampu member tersebut (atau admin).
5. Orang tua tidak bisa mengubah skor, absensi, atau status pembayaran.
6. Absensi terkunci setelah sesi ditutup; perubahan harus oleh admin dengan alasan (tercatat di audit log).
7. Nomor WhatsApp wajib format internasional `62`.
8. Data anak di bawah 18 tahun: akun portal dipegang wali.
9. Penghapusan data menggunakan soft delete; data keuangan disimpan sesuai kebutuhan audit.

---

## 21. Roadmap

| Fase | Fokus | Hasil |
|---|---|---|
| **Fase 1 — Fondasi** | Auth, multi-akademi, RBAC, member & wali, upload foto | Bisa mengelola data dasar |
| **Fase 2 — Operasional** | Jadwal, absensi, skill & penilaian, portal orang tua | Akademi berjalan harian |
| **Fase 3 — Keuangan & WA** | Tagihan, pembayaran, rekap, template & antrian WA | Administrasi bulanan efisien |
| **Fase 4 — Insight & pertumbuhan** | Laporan, rekomendasi level, trial online, badge | Retensi & akuisisi |
| **Fase 5 — Lanjutan** | QR check-in, payment gateway, WA Cloud API, honor pelatih | Otomatisasi penuh |

---

## 22. Risiko & Asumsi

| Risiko | Mitigasi |
|---|---|
| Data antar akademi bocor | Global scope `academy_id` + policy + test khusus tenancy |
| Nomor WA tidak valid | Validasi & normalisasi saat input; fallback edit sebelum kirim |
| Admin menolak pindah dari Excel | Import CSV + tampilan tabel yang familiar |
| Pelatih malas input | Form absensi 1 klik per anak, penilaian per bulan, mobile friendly |
| Foto member besar | Kompresi otomatis + batas ukuran |
| Regulasi data pribadi anak | Persetujuan wali, minimasi data, hak hapus, akses terbatas |

**Asumsi**: satu akademi dapat memiliki beberapa lokasi; pembayaran manual (transfer/tunai) pada MVP; zona waktu `Asia/Jakarta`; mata uang IDR.
