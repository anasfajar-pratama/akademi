<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->timestamp('attendance_filled_at')->nullable()->after('status');
        });

        Schema::create('assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('academy_id')->constrained('academies')->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('members')->cascadeOnDelete();
            $table->foreignId('skill_id')->constrained('skills')->cascadeOnDelete();
            $table->foreignId('attendance_session_id')->nullable()->constrained('attendance_sessions')->cascadeOnDelete();
            $table->foreignId('assessed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedTinyInteger('score');
            $table->text('note')->nullable();
            $table->string('period', 7);
            $table->date('assessed_at');
            $table->timestamps();

            $table->unique(
                ['attendance_session_id', 'member_id', 'skill_id'],
                'assessment_session_member_skill_unique'
            );
            $table->index(['academy_id', 'period']);
            $table->index(['member_id', 'skill_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessments');

        Schema::table('attendance_sessions', function (Blueprint $table) {
            $table->dropColumn('attendance_filled_at');
        });
    }
};
