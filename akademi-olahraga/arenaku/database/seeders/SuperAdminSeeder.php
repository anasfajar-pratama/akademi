<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'super@arenaku.test'],
            [
                'name' => 'Super Admin',
                'phone' => '6281200000001',
                'password' => 'password',
                'is_active' => true,
                'is_super_admin' => true,
                'must_change_password' => false,
            ],
        );
    }
}
