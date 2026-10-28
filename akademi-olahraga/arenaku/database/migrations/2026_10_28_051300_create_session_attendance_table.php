<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('session_attendance', function (Blueprint $table) {
            $table->id();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->enum('status', ['present', 'late', 'permitted', 'sick', 'absent'])->default('present');
            $table->dateTime('check_in_at')->nullable();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['attendance_session_id', 'member_id'], 'session_member_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('session_attendance');
    }
};
