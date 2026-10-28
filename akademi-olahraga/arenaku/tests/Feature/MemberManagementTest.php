<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Member;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function academy(string $name = 'Akademi Badminton'): Academy
    {
        $sport = Sport::firstOrCreate(['slug' => 'badminton'], ['name' => 'Badminton']);

        return Academy::create([
            'sport_id' => $sport->id,
            'name' => $name,
            'slug' => str($name)->slug().'-'.uniqid(),
            'status' => 'active',
        ]);
    }

    protected function member(Academy $academy, User $user, string $role): User
    {
        AcademyMembership::create([
            'academy_id' => $academy->id,
            'user_id' => $user->id,
            'role' => $role,
            'is_active' => true,
        ]);

        return $user;
    }

    public function test_admin_can_create_a_member_with_a_guardian(): void
    {
        $academy = $this->academy();
        $admin = $this->member($academy, User::factory()->create(), 'admin');

        $this->actingAs($admin)
            ->withSession(['current_academy_id' => $academy->id])
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

        $this->assertDatabaseHas('members', [
            'academy_id' => $academy->id,
            'full_name' => 'Aisyah Putri',
        ]);
        $this->assertDatabaseHas('guardians', [
            'academy_id' => $academy->id,
            'full_name' => 'Ibu Sari',
            'phone' => '6281200000009',
        ]);
    }

    public function test_coach_cannot_create_a_member(): void
    {
        $academy = $this->academy();
        $coach = $this->member($academy, User::factory()->create(), 'coach');

        $this->actingAs($coach)
            ->withSession(['current_academy_id' => $academy->id])
            ->post('/members', [
                'full_name' => 'Bukan Wewenang',
                'level' => 'beginner',
                'status' => 'trial',
            ])
            ->assertForbidden();
    }

    public function test_member_list_is_scoped_to_the_current_academy(): void
    {
        $academyA = $this->academy('Akademi A');
        $academyB = $this->academy('Akademi B');

        $admin = $this->member($academyA, User::factory()->create(), 'admin');

        Member::create(['academy_id' => $academyA->id, 'full_name' => 'Anak A', 'level' => 'beginner', 'status' => 'active']);
        Member::create(['academy_id' => $academyB->id, 'full_name' => 'Anak B', 'level' => 'beginner', 'status' => 'active']);

        $this->actingAs($admin)
            ->withSession(['current_academy_id' => $academyA->id])
            ->get('/members')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Members/Index')
                ->has('members.data', 1)
                ->where('members.data.0.full_name', 'Anak A'));
    }
}
