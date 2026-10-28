<?php

namespace Database\Seeders;

use App\Models\Sport;
use Illuminate\Database\Seeder;

class SportSeeder extends Seeder
{
    public function run(): void
    {
        $sports = [
            ['name' => 'Badminton', 'slug' => 'badminton', 'icon' => 'shuttlecock'],
            ['name' => 'Renang', 'slug' => 'renang', 'icon' => 'waves'],
            ['name' => 'Taekwondo', 'slug' => 'taekwondo', 'icon' => 'footprints'],
            ['name' => 'Sepak Bola', 'slug' => 'sepak-bola', 'icon' => 'goal'],
        ];

        foreach ($sports as $sport) {
            Sport::updateOrCreate(['slug' => $sport['slug']], $sport + ['is_active' => true]);
        }
    }
}
