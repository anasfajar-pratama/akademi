<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_registrations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained('academies')->cascadeOnDelete();
            $table->string('status', 20)->default('pending');

            $table->string('full_name');
            $table->string('nickname')->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->date('birth_date');
            $table->string('education_level')->nullable();
            $table->string('grade_class')->nullable();
            $table->string('school_name')->nullable();
            $table->string('address')->nullable();
            $table->string('city')->nullable();
            $table->string('postal_code', 12)->nullable();
            $table->string('photo_path')->nullable();
            $table->foreignId('branch_id')->nullable()->constrained('branches')->nullOnDelete();
            $table->foreignId('package_id')->nullable()->constrained('packages')->nullOnDelete();

            $table->string('guardian_name');
            $table->enum('guardian_relation', ['father', 'mother', 'guardian'])->default('mother');
            $table->string('guardian_phone');
            $table->string('guardian_email')->nullable();
            $table->string('guardian_occupation')->nullable();
            $table->string('guardian_address')->nullable();

            $table->text('health_notes')->nullable();
            $table->text('allergy_notes')->nullable();
            $table->string('emergency_name')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->text('notes')->nullable();
            $table->text('admin_notes')->nullable();

            $table->boolean('consent')->default(false);
            $table->foreignId('member_id')->nullable()->constrained('members')->nullOnDelete();
            $table->foreignId('guardian_id')->nullable()->constrained('guardians')->nullOnDelete();
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();

            $table->index(['academy_id', 'status']);
            $table->index(['academy_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('member_registrations');
    }
};
