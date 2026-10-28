<?php

return [

    /*
     * Menampilkan daftar akun demo di halaman login. Aktif otomatis saat
     * APP_ENV=local, atau paksa lewat DEMO_MODE=true di .env.
     * Jangan aktifkan di produksi.
     */
    'enabled' => filter_var(
        env('DEMO_MODE', env('APP_ENV', 'production') === 'local'),
        FILTER_VALIDATE_BOOL
    ),

    'accounts' => [
        [
            'role' => 'Super Admin',
            'login' => 'super@arenaku.test',
            'password' => 'password',
            'description' => 'Buat & kelola semua akademi',
        ],
        [
            'role' => 'Admin Akademi',
            'login' => 'admin@arenaku.test',
            'password' => 'password',
            'description' => 'Operasional akademi (member, jadwal, tagihan)',
        ],
        [
            'role' => 'Pelatih',
            'login' => 'coach@arenaku.test',
            'password' => 'password',
            'description' => 'Jadwal & absensi sesi',
        ],
        [
            'role' => 'Orang Tua',
            'login' => 'ortu@arenaku.test',
            'password' => 'password',
            'description' => 'Portal perkembangan anak',
        ],
    ],

];
