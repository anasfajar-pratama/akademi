<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academy_user', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'admin', 'admin_coach', 'coach', 'parent', 'member'])->change();
        });

        Schema::table('academies', function (Blueprint $table) {
            $table->string('registration_token', 64)->nullable()->unique()->after('status');
            $table->boolean('registration_open')->default(true)->after('registration_token');
        });

        DB::table('academies')
            ->whereNull('registration_token')
            ->orderBy('id')
            ->each(function ($academy) {
                DB::table('academies')
                    ->where('id', $academy->id)
                    ->update([
                        'registration_token' => Str::random(48),
                        'registration_open' => true,
                    ]);
            });
    }

    public function down(): void
    {
        DB::table('academy_user')->where('role', 'admin_coach')->update(['role' => 'admin']);

        Schema::table('academies', function (Blueprint $table) {
            $table->dropColumn(['registration_token', 'registration_open']);
        });

        Schema::table('academy_user', function (Blueprint $table) {
            $table->enum('role', ['super_admin', 'admin', 'coach', 'parent', 'member'])->change();
        });
    }
};
