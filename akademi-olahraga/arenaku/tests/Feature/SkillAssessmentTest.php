<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Assessment;
use App\Models\AttendanceSession;
use App\Models\Guardian;
use App\Models\Member;
use App\Models\SessionAttendance;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class SkillAssessmentTest extends TestCase
{
    use RefreshDatabase;

    protected Academy $academy;

    protected User $coach;

    protected Member $member;

    protected AttendanceSession $session;

    protected Skill $skill;

    protected function setUp(): void
    {
        parent::setUp();

        $sport = Sport::create(['name' => 'Badminton', 'slug' => 'badminton']);

        $this->academy = Academy::create([
            'sport_id' => $sport->id,
            'name' => 'Akademi Badminton',
            'slug' => 'akademi-badminton',
            'status' => 'active',
        ]);

        $category = SkillCategory::create(['sport_id' => $sport->id, 'name' => 'Teknik Dasar']);

        $this->skill = Skill::create([
            'academy_id' => $this->academy->id,
            'sport_id' => $sport->id,
            'skill_category_id' => $category->id,
            'name' => 'Servis',
            'is_active' => true,
        ]);

        $this->coach = $this->attach(User::factory()->create(), 'coach');

        $this->member = Member::create([
            'academy_id' => $this->academy->id,
            'full_name' => 'Aisyah Putri',
            'level' => 'beginner',
            'status' => 'active',
        ]);

        $this->session = AttendanceSession::create([
            'academy_id' => $this->academy->id,
            'coach_id' => $this->coach->id,
            'title' => 'Latihan Sabtu',
            'session_date' => now()->toDateString(),
            'status' => 'open',
        ]);

        SessionAttendance::create([
            'attendance_session_id' => $this->session->id,
            'member_id' => $this->member->id,
            'status' => 'present',
        ]);
    }

    protected function attach(User $user, string $role): User
    {
        AcademyMembership::create([
            'academy_id' => $this->academy->id,
            'user_id' => $user->id,
            'role' => $role,
            'is_active' => true,
        ]);

        return $user;
    }

    protected function asCoach()
    {
        return $this->actingAs($this->coach)
            ->withSession(['current_academy_id' => $this->academy->id]);
    }

    public function test_assessment_is_blocked_until_attendance_is_filled(): void
    {
        $this->asCoach()
            ->get("/assessments/{$this->session->id}")
            ->assertRedirect("/coach/sessions/{$this->session->id}");
    }

    public function test_saving_attendance_unlocks_the_assessment_page(): void
    {
        $this->asCoach()
            ->put("/coach/sessions/{$this->session->id}", [
                'attendance' => [['member_id' => $this->member->id, 'status' => 'present']],
            ])
            ->assertRedirect();

        $this->assertNotNull($this->session->fresh()->attendance_filled_at);

        $this->asCoach()->get("/assessments/{$this->session->id}")->assertOk();
    }

    public function test_coach_can_save_skill_scores_for_a_session(): void
    {
        $this->session->forceFill(['attendance_filled_at' => now()])->save();

        $this->asCoach()
            ->put("/assessments/{$this->session->id}", [
                'scores' => [
                    $this->member->id => [$this->skill->id => 4],
                ],
                'notes' => [$this->member->id => 'Servis makin konsisten'],
            ])
            ->assertRedirect('/assessments');

        $this->assertDatabaseHas('assessments', [
            'attendance_session_id' => $this->session->id,
            'member_id' => $this->member->id,
            'skill_id' => $this->skill->id,
            'score' => 4,
            'period' => now()->format('Y-m'),
            'note' => 'Servis makin konsisten',
        ]);
    }

    public function test_coach_can_add_a_category_and_a_skill(): void
    {
        $this->asCoach()
            ->post('/skills/categories', ['name' => 'Kecepatan'])
            ->assertRedirect();

        $this->assertDatabaseHas('skill_categories', ['name' => 'Kecepatan']);

        $category = SkillCategory::where('name', 'Kecepatan')->firstOrFail();

        $this->asCoach()
            ->post('/skills', ['skill_category_id' => $category->id, 'name' => 'Langkah kaki 6 titik'])
            ->assertRedirect();

        $this->assertDatabaseHas('skills', [
            'academy_id' => $this->academy->id,
            'name' => 'Langkah kaki 6 titik',
        ]);
    }

    public function test_parent_cannot_access_skill_or_assessment_pages(): void
    {
        $parent = $this->attach(User::factory()->create(), 'parent');

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get('/skills')
            ->assertForbidden();

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get('/assessments')
            ->assertForbidden();
    }

    public function test_parent_sees_the_coach_skill_scores_for_their_child(): void
    {
        $parent = $this->attach(User::factory()->create(), 'parent');

        $guardian = Guardian::create([
            'academy_id' => $this->academy->id,
            'user_id' => $parent->id,
            'full_name' => 'Bunda Sari',
            'relation' => 'mother',
            'phone' => '6281200000999',
            'is_primary' => true,
        ]);

        $this->member->guardians()->attach($guardian->id, ['is_primary' => true]);

        Assessment::create([
            'academy_id' => $this->academy->id,
            'member_id' => $this->member->id,
            'skill_id' => $this->skill->id,
            'attendance_session_id' => $this->session->id,
            'assessed_by' => $this->coach->id,
            'score' => 4,
            'note' => 'Servis makin konsisten',
            'period' => now()->format('Y-m'),
            'assessed_at' => now()->toDateString(),
        ]);

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get("/portal/children/{$this->member->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Portal/Child')
                ->where('skills.has_data', true)
                ->where('skills.latest_period', now()->format('Y-m'))
                ->where('skills.skills.0.name', 'Servis')
                ->where('skills.skills.0.score', 4)
                ->where('skills.skills.0.note', 'Servis makin konsisten')
                ->where('skills.categories.0.name', 'Teknik Dasar'));
    }

    public function test_portal_shows_empty_skill_state_when_there_is_no_assessment(): void
    {
        $parent = $this->attach(User::factory()->create(), 'parent');

        $guardian = Guardian::create([
            'academy_id' => $this->academy->id,
            'user_id' => $parent->id,
            'full_name' => 'Bunda Sari',
            'relation' => 'mother',
            'phone' => '6281200000888',
            'is_primary' => true,
        ]);

        $this->member->guardians()->attach($guardian->id, ['is_primary' => true]);

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get("/portal/children/{$this->member->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('skills.has_data', false));
    }

    public function test_internal_coach_note_is_hidden_from_parent(): void
    {
        $parent = $this->attach(User::factory()->create(), 'parent');

        $guardian = Guardian::create([
            'academy_id' => $this->academy->id,
            'user_id' => $parent->id,
            'full_name' => 'Bunda Sari',
            'relation' => 'mother',
            'phone' => '6281200000777',
            'is_primary' => true,
        ]);

        $this->member->guardians()->attach($guardian->id, ['is_primary' => true]);

        Assessment::create([
            'academy_id' => $this->academy->id,
            'member_id' => $this->member->id,
            'skill_id' => $this->skill->id,
            'attendance_session_id' => $this->session->id,
            'assessed_by' => $this->coach->id,
            'score' => 3,
            'note' => 'Perlu latihan tambahan, jangan dibahas ke orang tua dulu.',
            'note_visibility' => 'internal',
            'period' => now()->format('Y-m'),
            'assessed_at' => now()->toDateString(),
        ]);

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get("/portal/children/{$this->member->id}")
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('skills.has_data', true)
                ->where('skills.skills.0.score', 3)
                ->where('skills.skills.0.note', null));
    }
}
