<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained('academies')->cascadeOnDelete();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('package_id')->nullable()->constrained('packages')->nullOnDelete();
            $table->string('member_code')->nullable();
            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->string('photo_path')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->date('birth_date')->nullable();
            $table->string('education_level')->nullable();
            $table->string('grade_class')->nullable();
            $table->string('school_name')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code', 12)->nullable();
            $table->date('joined_at')->nullable();
            $table->enum('level', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->enum('status', ['trial', 'active', 'inactive', 'alumni'])->default('trial');
            $table->foreignId('primary_coach_id')->nullable()->constrained('users')->nullOnDelete();
            $table->text('health_notes')->nullable();
            $table->text('allergy_notes')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->string('source')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['academy_id', 'status']);
            $table->index(['academy_id', 'level']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('members');
    }
};
