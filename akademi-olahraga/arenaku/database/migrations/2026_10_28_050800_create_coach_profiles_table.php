<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coach_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained('academies')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('license_number')->nullable();
            $table->string('specialization')->nullable();
            $table->text('bio')->nullable();
            $table->unsignedInteger('hourly_rate')->nullable();
            $table->string('photo_path')->nullable();
            $table->timestamps();

            $table->unique(['academy_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coach_profiles');
    }
};
