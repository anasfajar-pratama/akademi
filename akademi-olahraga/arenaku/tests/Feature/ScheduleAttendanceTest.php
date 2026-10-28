<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\AttendanceSession;
use App\Models\Member;
use App\Models\Schedule;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ScheduleAttendanceTest extends TestCase
{
    use RefreshDatabase;

    protected function academy(): Academy
    {
        $sport = Sport::firstOrCreate(['slug' => 'badminton'], ['name' => 'Badminton']);

        return Academy::create([
            'sport_id' => $sport->id,
            'name' => 'Akademi Badminton',
            'slug' => 'akademi-badminton',
            'status' => 'active',
        ]);
    }

    protected function attach(Academy $academy, User $user, string $role): User
    {
        AcademyMembership::create([
            'academy_id' => $academy->id,
            'user_id' => $user->id,
            'role' => $role,
            'is_active' => true,
        ]);

        return $user;
    }

    public function test_admin_creates_a_schedule_and_starts_an_attendance_session(): void
    {
        $academy = $this->academy();
        $admin = $this->attach($academy, User::factory()->create(), 'admin');

        Member::create([
            'academy_id' => $academy->id,
            'full_name' => 'Aisyah',
            'level' => 'beginner',
            'status' => 'active',
        ]);

        $this->actingAs($admin)
            ->withSession(['current_academy_id' => $academy->id])
            ->post('/schedules', [
                'title' => 'Latihan Rutin',
                'type' => 'training',
                'status' => 'published',
                'starts_at' => now()->addDay()->format('Y-m-d H:i:s'),
            ])
            ->assertRedirect('/schedules');

        $schedule = Schedule::firstOrFail();
        $this->assertSame($academy->id, $schedule->academy_id);

        $this->actingAs($admin)
            ->withSession(['current_academy_id' => $academy->id])
            ->post("/schedules/{$schedule->id}/start")
            ->assertRedirect();

        $session = AttendanceSession::firstOrFail();
        $this->assertSame('open', $session->status);
        $this->assertDatabaseHas('session_attendance', [
            'attendance_session_id' => $session->id,
        ]);
    }

    public function test_parent_cannot_open_the_coach_attendance_page(): void
    {
        $academy = $this->academy();
        $parent = $this->attach($academy, User::factory()->create(), 'parent');

        $schedule = Schedule::create([
            'academy_id' => $academy->id,
            'title' => 'Latihan',
            'type' => 'training',
            'status' => 'published',
            'starts_at' => now(),
        ]);

        $session = AttendanceSession::create([
            'academy_id' => $academy->id,
            'schedule_id' => $schedule->id,
            'title' => 'Latihan',
            'session_date' => now()->toDateString(),
            'status' => 'open',
        ]);

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $academy->id])
            ->get("/coach/sessions/{$session->id}")
            ->assertForbidden();
    }
}
