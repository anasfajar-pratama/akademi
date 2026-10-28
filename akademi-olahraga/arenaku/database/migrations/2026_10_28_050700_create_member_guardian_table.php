<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_guardian', function (Blueprint $table) {
            $table->id();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('guardian_id')->constrained('guardians')->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->unique(['member_id', 'guardian_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_guardian');
    }
};
