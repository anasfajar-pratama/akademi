# SmashBook — Rencana Implementasi Sistem GOR

## Tujuan

Mengubah prototype HTML statis (`prototype/`) menjadi aplikasi web operasional yang benar-benar
berjalan, dengan 6 modul saling terintegrasi: Member, Booking, POS, Kas Harian, Quick PO, dan Stock.
Target operasional: Hostinger shared hosting (PHP 8.3 + MySQL), tanpa Node build, tanpa WebSocket,
tanpa API pihak ketiga. UI berbahasa Indonesia dan mengikuti gaya visual prototype.

## Keputusan Arsitektur

**Stack: Laravel 11 + MySQL 8 + Blade + vanilla CSS/JS.**
- Aplikasi ditempatkan di folder `app/` agar repo tetap berisi `docs/`, `prototype/`, dan `screenshots/`.
- Aset meniru `prototype/assets/app.css` dan `app.js`, disalin ke `app/public/assets/` — **tanpa Vite,
  tanpa CDN, tanpa npm build**. Ini membuat deploy ke shared hosting cukup unggah file.
- Database lokal & produksi: MySQL (`smashbook`). Test: SQLite in-memory (default Laravel).
- Uang disimpan sebagai integer rupiah; tidak ada floating point.
- Semua logika bisnis di Service layer; controller tipis; model hanya relasi/scope.

**Alasan:** sesuai rekomendasi `docs/implementasi.md`, paling murah dirawat, tidak butuh daemon,
dan seluruh kebutuhan transaksi DB (`lockForUpdate`, unique constraint) tersedia.

## Ruang Lingkup Versi Ini

### Termasuk (alur inti lengkap, saling terhubung)
1. **Auth & RBAC** — login per user, 4 peran (owner/admin/kasir/operator), PIN owner untuk aksi sensitif,
   audit log aksi sensitif.
2. **Master Lapangan & Tarif** — CRUD lapangan, aturan tarif per jam (weekday/weekend/holiday, peak/off-peak),
   hari libur, jam operasional.
3. **Member** — CRUD member, tipe membership (diskon, durasi), perpanjangan, deposit/top-up, status,
   riwayat booking & transaksi.
4. **Booking** — papan jadwal jam × lapangan, booking walk-in/member, tarif per slot (campuran peak/off-peak),
   anti double-booking 3 lapis (unique constraint + row lock + validasi server), hold 15 menit,
   pembayaran DP/lunas/di tempat, check-in/out, pembatalan + refund, booking berulang.
5. **POS** — katalog produk, keranjang, diskon (batas + PIN owner), pembayaran tunai/QRIS/transfer/debit/deposit,
   kembalian, potong stok otomatis, HPP snapshot, struk print 58/80 mm, void + restore stok.
6. **Kas Harian** — buka sesi per shift, mutasi tunai otomatis dari booking/POS/PO, petty cash,
   tutup shift dengan hitung fisik + selisih, verifikasi owner bila selisih > Rp 10.000, rekap harian,
   riwayat sesi.
7. **Quick PO & Biaya** — supplier, PO produk/expense dalam satu layar, threshold approval,
   approve/reject, penerimaan parsial, foto nota wajib untuk pembelian tunai, biaya operasional.
8. **Stock** — kartu stok, stok masuk/keluar/adjust, stock opname, minimum stock & alert,
   weighted average cost.
9. **Dashboard & Laporan** — KPI nyata, grafik pendapatan 7 hari (CSS bar), okupansi, alert stok,
   PO menunggu approval, laporan pendapatan/okupansi/selisih kas/laba-rugi sederhana.
10. **Pengaturan & Audit Log** — threshold approval, kebijakan refund, jam operasional, footer struk;
    daftar audit log owner.

### Tidak termasuk (sesuai dokumen desain)
Halaman booking publik, payment gateway, WhatsApp API, WebSocket/realtime, mode offline POS,
FIFO, multi-venue, payroll/akuntansi penuh, recurring expense otomatis.

## Struktur Folder

```
app/
├─ app/
│  ├─ Http/Controllers/   Auth, Dashboard, Booking, Court, Member, Pos, Sale, Cash,
│  │                      Product, PurchaseOrder, Supplier, Report, Setting, AuditLog
│  ├─ Http/Middleware/    EnsureRole.php
│  ├─ Models/             26 model inti
│  ├─ Services/           PricingService, BookingService, CashService, PosService,
│  │                      InventoryService, PurchaseOrderService, DocumentNumberService,
│  │                      ReportService, AuditService
│  └─ Console/Commands/   ReleaseExpiredHolds, GenerateRecurringBookings,
│                         CheckMembershipExpiry, BackupDatabase
├─ database/migrations/   4 migration terkelompok
├─ database/seeders/      DatabaseSeeder + demo data
├─ resources/views/       layout, partials, halaman per modul
├─ public/assets/         app.css (dari prototype) + app.js
├─ routes/web.php         seluruh route + middleware role
└─ tests/Feature|Unit/    test jalur kritis
```

## Skema Data (26 tabel)

**Fondasi:** `users` (role, pin_hash, is_active), `settings`, `sequences`, `audit_logs`.

**Member:** `membership_types`, `members` (code MBR, phone unik, deposit_balance, status),
`member_subscriptions`, `deposits`.

**Lapangan & booking:** `courts`, `court_price_rules` (court_id nullable = semua lapangan,
day_type, start_hour, end_hour, price_per_hour), `holidays`, `court_slots`
(**UNIQUE(court_id, slot_date, slot_hour)**, booking_id, price snapshot, status, expires_at),
`bookings` (code, member_id, penyewa, court, tanggal, start/end hour, subtotal, discount, total,
paid, status, source, hold expiry, check-in/out, cancellation/refund), `booking_recurring`.

**POS & kas:** `products` (sku, harga beli/jual, stock_qty cache, avg_cost, min_stock, allow_negative),
`pos_sales`, `pos_sale_items` (snapshot nama/harga/HPP), `payments` (ref booking/pos, method, amount,
reference_no), `cash_sessions`, `cash_movements` (in/out, kategori, ref, balance_after, attachment),
`expenses`, `suppliers`, `purchase_orders`, `purchase_order_items`, `inventory_movements`,
`stock_opnames`, `stock_opname_items`.

**Aturan integritas:**
- Slot unik di level database → mustahil double booking.
- Semua uang tunai wajib `cash_movements`; tanpa sesi kas terbuka, pembayaran tunai ditolak.
- Semua perubahan stok wajib lewat `inventory_movements`; `products.stock_qty` hanya cache.
- Semua nomor dokumen dari `sequences` dengan `lockForUpdate` (bukan count+1).
- Snapshot harga tarif, harga jual, dan HPP pada baris transaksi.

## Logika Kritis

1. **Booking anti-bentrok**
   - `insertOrIgnore` baris slot untuk tanggal/lapangan/jam yang dituju, lalu `lockForUpdate`.
   - Tolak bila ada `booking_id` atau hold aktif; hold kedaluwarsa dianggap kosong.
   - Update slot dengan `booking_id`, `price`, status. Unique constraint menangkap race terakhir.
   - `ReleaseExpiredHolds` berjalan tiap menit lewat scheduler.

2. **PricingService**
   - Kategori per jam: holiday > weekend > weekday; cari rule yang cocok untuk court + jam.
   - Total = jumlah harga per slot; diskon member dari subscription aktif (fallback tipe member).
   - Booking 15:00–17:00 pada hari kerja = 1 jam off-peak + 1 jam prime.
   - Semua perhitungan diulang di server saat simpan; preview JS hanya untuk UX.

3. **CashService**
   - `open()`: satu sesi terbuka per kasir.
   - `recordIn/Out()`: insert movement + update saldo, `balance_after` dihitung dalam transaksi.
   - `close()`: expected = opening + in − out; difference = physical − expected.
     Selisih > threshold wajib catatan + PIN owner; simpan `verified_by`.
   - Pembayaran tunai booking/POS/PO memanggil service ini dalam DB transaction yang sama.

4. **PosService**
   - Checkout satu DB transaction: validasi stok → `pos_sales` + items (snapshot HPP) →
     `inventory_movements OUT` + update cache stok → `payments` → `cash_movements` (bila tunai) →
     potong deposit (bila metode deposit).
   - Diskon > batas butuh PIN owner.
   - Void: hanya hari & shift yang sama, PIN owner, restore stok, balikkan kas, audit log.

5. **InventoryService**
   - `move()`: insert movement + `balance_after`; update `stock_qty` dengan lock.
   - Stok masuk memperbarui weighted average: `(qty_lama × avg + qty_masuk × harga) / total`.
   - Opname finalisasi membuat movement adjust per selisih.

6. **PurchaseOrderService**
   - Total ≤ threshold → auto-approve admin; di atas threshold → submitted, owner approve.
   - Receive parsial: item produk → movement IN + update avg; item expense → `expenses` +
     `cash_movements OUT` bila tunai.
   - Foto nota wajib untuk pembelian tunai < Rp 500.000.

## Halaman & Route Utama

| Route | Halaman |
|---|---|
| `/login`, `/logout` | Login per peran |
| `/` | Dashboard KPI real-time |
| `/bookings` | Papan jadwal + daftar + recurring + kebijakan (tab) |
| `/bookings/create`, `/bookings/{id}` | Form booking, detail, bayar, check-in/out, batal |
| `/courts` | Master lapangan + aturan tarif + hari libur + jam operasional |
| `/members`, `/members/{id}` | Daftar/form member, detail + deposit + riwayat |
| `/pos`, `/sales`, `/sales/{id}/receipt` | POS, riwayat, struk print |
| `/cash`, `/cash/open`, `/cash/history`, `/cash/recap` | Sesi kas, tutup shift, riwayat, rekap |
| `/products`, `/products/{id}` | Barang, form, kartu stok + opname |
| `/purchase-orders`, `/purchase-orders/create`, `/purchase-orders/{id}` | Quick PO, approve, terima |
| `/suppliers` | Supplier |
| `/reports` | Pendapatan, okupansi, kas, laba-rugi, member |
| `/settings`, `/audit-logs` | Pengaturan & audit (owner) |

Layout Blade tunggal (sidebar + topbar) mengikuti prototype, dengan partial modal, flash message,
dan helper `rupiah()` di PHP serta JS.

## Tahapan Implementasi

### F0 — Fondasi
- `composer create-project laravel/laravel:^11.0 app`.
- Konfigurasi `.env` MySQL `smashbook`, timezone `Asia/Jakarta`, locale `id`.
- Migrasi 4 kelompok + 26 model + relasi.
- Layout + CSS/JS dari prototype, halaman login, auth controller, middleware role, seeder user.
- Dashboard kerangka + helper format rupiah/tanggal.
- **Cek:** login 4 peran, layout tampil, migrasi bersih.

### F1 — Master & Booking
- CRUD lapangan, aturan tarif, hari libur, pengaturan jam.
- CRUD member + tipe membership + top-up deposit.
- PricingService + BookingService + DocumentNumberService.
- Papan jadwal, form booking, pembayaran, hold, check-in/out, batal/refund, recurring.
- Command `bookings:release-holds` + `bookings:generate-recurring`.

### F2 — Kas & POS
- CashService + halaman buka sesi, mutasi, petty cash, tutup shift, rekap.
- POS UI + checkout + struk + riwayat + void.
- Integrasi pembayaran booking ke kas.
- Command membership expiry.

### F3 — Stok & Quick PO
- CRUD produk, kartu stok, stok masuk/keluar, opname.
- Supplier, Quick PO, approval threshold, penerimaan parsial, expense + kas keluar.
- Alert stok minimum di dashboard.

### F4 — Laporan, Pengaturan, Audit
- ReportService + halaman laporan (pendapatan, okupansi, selisih kas, laba-rugi, member).
- Pengaturan threshold/refund/jam/footer struk.
- Audit log untuk void, diskon besar, pembatalan, selisih kas, approval PO.
- Dashboard final dengan data nyata.

### F5 — Seed Demo, Test, Dokumentasi
- Seeder data demo (lapangan, tarif, member, produk, supplier, booking hari ini, POS, sesi kas,
  PO pending) memakai service agar integrasi ikut teruji.
- Test otomatis jalur kritis.
- `README.md`: cara install lokal + akun demo + alur singkat + catatan deploy Hostinger/cron.
- Verifikasi manual end-to-end.

## Akun Demo

| Peran | Email | Password | PIN |
|---|---|---|---|
| Owner | owner@smashbook.test | password | 1234 |
| Admin | admin@smashbook.test | password | — |
| Kasir | kasir@smashbook.test | password | — |
| Operator | operator@smashbook.test | password | — |

## Pengujian

**Feature/unit test wajib lulus:**
1. Booking slot sama dua kali → tepat satu berhasil; slot count benar.
2. Pricing campuran weekday 15:00–17:00, weekend, holiday, diskon member.
3. POS cash: stok turun, sale+item+HPP snapshot, kas masuk, kembalian benar.
4. POS tanpa sesi kas untuk pembayaran tunai → ditolak.
5. Deposit member berkurang saat pembayaran metode deposit.
6. Tutup shift: expected & difference benar; selisih > 10.000 wajib catatan + PIN owner.
7. Quick PO threshold: auto-approve vs owner; penerimaan produk menambah stok & avg cost;
   item expense membuat expense + kas keluar.
8. RBAC: kasir tidak bisa approve PO / lihat HPP; operator tidak bisa POS.
9. Nomor dokumen tidak duplikat saat berurutan.

**Verifikasi manual:**
- `php artisan migrate:fresh --seed`
- `php artisan test`
- `php artisan serve` → login kasir → buka shift → booking → POS → tutup shift;
  login owner → approve PO → terima barang → cek laporan & audit.
- Cek halaman utama di browser (desktop + lebar tablet), struk print preview.

## Out of Scope / Catatan

- Granularitas slot MVP = 60 menit (sesuai papan jadwal prototype); struktur siap ditingkatkan ke 30 menit.
- Satu venue; kolom `venue_id` belum ditambahkan agar tidak menambah kompleksitas tanpa kebutuhan.
- Split payment POS dan recurring expense otomatis ditunda; backend `payments` sudah mendukung banyak baris.
- Semua integrasi eksternal tetap manual (WhatsApp, QRIS/EDC, printer via browser).
