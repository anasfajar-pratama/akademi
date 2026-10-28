# Arenaku — Sistem Manajemen Akademi Olahraga

Prototype + dokumen desain untuk platform multi-akademi (badminton, renang, taekwondo, sepak bola, dan cabang lain).

---

## Isi Folder

```
akademi-olahraga/
├── DESIGN.md              Desain produk: persona, modul, alur, aturan bisnis, roadmap
├── IMPLEMENTATION.md      Desain teknis: stack, ERD, route, alur otomatis, milestone
├── README.md              File ini
└── prototype/
    ├── index.html         Landing page + pintu masuk semua layar demo
    ├── login.html         Login multi-peran
    ├── dashboard.html     Dashboard admin (KPI, grafik, sesi, tindakan)
    ├── akademi.html       Multi-akademi + template skill per cabang
    ├── member.html        Daftar member + form pendaftaran
    ├── member-detail.html Profil, radar skill, absensi, tagihan, catatan
    ├── absensi.html       Absensi pelatih (interaktif)
    ├── jadwal.html        Jadwal latihan, sparring, GOR, peta
    ├── pembayaran.html    Tagihan, rekap, tandai lunas
    ├── reminder-wa.html   Antrian & template WhatsApp
    ├── portal-orangtua.html Portal orang tua
    └── assets/
        ├── ui.css         Design system prototype
        └── ui.js          Tab, modal, filter, absensi live, toast
```

---

## Cara Membuka Prototype

**Cara paling cepat:** klik dua kali `prototype/index.html`.

**Disarankan (agar semua aset dan link berjalan rapi):**

```bash
cd prototype
python -m http.server 8080
# buka http://localhost:8080
```

Atau dengan Node:

```bash
npx serve prototype
```

> Prototype memakai Tailwind CDN, Lucide (ikon), dan Google Fonts. Diperlukan koneksi internet saat pertama kali dibuka. Tidak ada backend — semua data adalah contoh.

---

## Alur Demo yang Disarankan

1. **`index.html`** — lihat positioning produk dan daftar layar.
2. **`login.html`** — pilih peran (Admin / Pelatih / Orang Tua), lalu masuk.
3. **`dashboard.html`** — perhatikan KPI, grafik pendapatan, daftar tindakan.
4. **`member.html` → klik Aisyah** — lihat profil lengkap, radar skill, absensi, tagihan.
5. **`absensi.html`** — klik status kehadiran; ringkasan di kanan berubah langsung.
6. **`jadwal.html`** — lihat sparring dengan lawan, GOR, dan peta.
7. **`pembayaran.html`** — klik **Tandai lunas** pada baris tunggakan.
8. **`reminder-wa.html`** — klik **Kirim** (membuka WhatsApp dengan pesan terisi).
9. **`portal-orangtua.html`** — tampilan yang dilihat orang tua.

**Akun demo** (tidak ada autentikasi sungguhan):

| Peran | Email | Sandi |
|---|---|---|
| Super Admin | super@arenaku.id | password |
| Admin Akademi | rina@arenaku.id | password |
| Orang Tua | bunda.sari@email.com | password |

---

## Yang Sudah Berfungsi di Prototype

- Navigasi antar layar dan sidebar per peran
- Tab (Ringkasan / Skill / Absensi / Pembayaran / Catatan)
- Modal (buat akademi, tambah member, penilaian, jadwal, generate tagihan, kirim WA)
- Absensi live: hitungan hadir/terlambat/izin/sakit/alpa + progress bar
- Filter tabel berdasarkan pencarian
- Tandai lunas (mengubah badge status)
- Tombol WhatsApp membuka `wa.me` dengan pesan yang sudah terisi
- Peta statis + tautan ke Google Maps
- Responsif untuk layar kecil

Yang **belum** (memang hanya prototype): backend, autentikasi nyata, penyimpanan data, upload file, PDF, dan pengiriman WA otomatis.

---

## Keputusan Desain Kunci

| Topik | Keputusan |
|---|---|
| Multi-akademi | Satu database, isolasi via `academy_id` + global scope |
| Cabang olahraga | Dinamis (master data), bukan hard-code badminton |
| Skill | Template per cabang, rubrik 1–5, bobot kategori, riwayat per periode |
| Level | Beginner → Intermediate → Advanced, dengan sub-level & riwayat |
| Absensi | Per sesi, 5 status, terkunci setelah sesi ditutup |
| Pembayaran | Tagihan bulanan, prorata, diskon, rekap, kwitansi |
| WhatsApp | `wa.me` di MVP, interface siap upgrade ke Cloud API |
| Portal orang tua | Mobile-first, hanya anak yang terhubung |
| Warna | Navy `#0B1220` + lime `#C9F24D` — sporty dan netral untuk semua cabang |

Detail lengkap ada di `DESIGN.md`.

---

## Rekomendasi Implementasi

**Laravel 11 + Inertia.js + React + TypeScript + Tailwind CSS.**

Alasannya: satu repo, satu deploy, autentikasi session bawaan Laravel, validasi dan routing di satu tempat, tanpa perlu membangun API terpisah. React tetap dipakai untuk tampilan interaktif (radar chart, absensi cepat, form bertahap).

Alternatif:
- **Laravel + Blade + Livewire** — paling sedikit JavaScript, cocok bila tim murni PHP.
- **Laravel API + React SPA** — hanya jika sudah ada tim frontend terpisah.

Skema database, route, alur generate tagihan/reminder, dan checklist milestone ada di `IMPLEMENTATION.md`.

---

## Langkah Berikutnya

1. Validasi prototype ini ke 2–3 pemilik akademi (badminton, renang, taekwondo).
2. Kunci field wajib dan istilah yang mereka pakai (mis. "GOR" vs "lapangan").
3. Mulai **M0–M1** di `IMPLEMENTATION.md`: setup Laravel, multi-akademi, RBAC, member & wali.
4. Lanjut M2–M4: jadwal, absensi, skill & progress.
5. M5–M7: keuangan, WhatsApp, portal orang tua.

---

## Catatan

- Seluruh nama, nomor HP, dan nominal adalah data fiktif.
- Nomor WhatsApp contoh tidak aktif.
- Peta memakai tautan pencarian Google Maps dengan koordinat contoh.
