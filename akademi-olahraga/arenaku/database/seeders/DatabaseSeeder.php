<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            SportSeeder::class,
            SkillTemplateSeeder::class,
            SuperAdminSeeder::class,
            DemoDataSeeder::class,
        ]);
    }
}
