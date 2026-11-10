<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Member;
use App\Models\Skill;
use App\Models\SkillCategory;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCoachRoleTest extends TestCase
{
    use RefreshDatabase;

    protected Academy $academy;

    protected User $adminCoach;

    protected function setUp(): void
    {
        parent::setUp();

        $sport = Sport::create(['name' => 'Badminton', 'slug' => 'badminton']);

        $this->academy = Academy::create([
            'sport_id' => $sport->id,
            'name' => 'Akademi Badminton',
            'slug' => 'akademi-badminton',
            'status' => 'active',
            'registration_token' => 'token-uji',
            'registration_open' => true,
        ]);

        $this->adminCoach = User::factory()->create();

        AcademyMembership::create([
            'academy_id' => $this->academy->id,
            'user_id' => $this->adminCoach->id,
            'role' => 'admin_coach',
            'is_active' => true,
        ]);
    }

    protected function actingAsAdminCoach()
    {
        return $this->actingAs($this->adminCoach)
            ->withSession(['current_academy_id' => $this->academy->id]);
    }

    public function test_admin_coach_can_open_admin_and_coach_pages(): void
    {
        foreach (['/members', '/invoices', '/settings', '/assessments', '/skills', '/coach', '/registrations'] as $uri) {
            $this->actingAsAdminCoach()->get($uri)->assertOk();
        }
    }

    public function test_admin_coach_can_create_and_edit_members(): void
    {
        $this->actingAsAdminCoach()
            ->post('/members', [
                'full_name' => 'Aisyah Putri',
                'level' => 'beginner',
                'status' => 'trial',
                'guardians' => [[
                    'full_name' => 'Ibu Sari',
                    'relation' => 'mother',
                    'phone' => '081200000009',
                ]],
            ])
            ->assertRedirect();

        $member = Member::where('full_name', 'Aisyah Putri')->firstOrFail();

        $this->actingAsAdminCoach()->get("/members/{$member->id}/edit")->assertOk();
    }

    public function test_admin_coach_can_manage_registration_link(): void
    {
        $this->actingAsAdminCoach()
            ->post('/settings/registration-link/toggle')
            ->assertRedirect();

        $this->assertFalse($this->academy->fresh()->registration_open);

        $this->actingAsAdminCoach()
            ->post('/settings/registration-link/regenerate')
            ->assertRedirect();

        $this->assertNotSame('token-uji', $this->academy->fresh()->registration_token);
    }

    public function test_admin_coach_can_save_a_direct_skill_assessment(): void
    {
        $member = Member::create([
            'academy_id' => $this->academy->id,
            'full_name' => 'Bagas Pratama',
            'level' => 'beginner',
            'status' => 'trial',
        ]);

        $category = SkillCategory::create([
            'sport_id' => $this->academy->sport_id,
            'name' => 'Teknik Dasar',
        ]);

        $skill = Skill::create([
            'academy_id' => $this->academy->id,
            'sport_id' => $this->academy->sport_id,
            'skill_category_id' => $category->id,
            'name' => 'Servis',
            'is_active' => true,
        ]);

        $this->actingAsAdminCoach()
            ->post("/members/{$member->id}/assessments", [
                'skill_id' => $skill->id,
                'score' => 4,
                'note' => 'Servis konsisten',
                'note_visibility' => 'parent',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('assessments', [
            'academy_id' => $this->academy->id,
            'member_id' => $member->id,
            'skill_id' => $skill->id,
            'score' => 4,
            'attendance_session_id' => null,
        ]);
    }
}
