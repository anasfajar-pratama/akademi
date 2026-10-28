<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Guardian;
use App\Models\Member;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenancyTest extends TestCase
{
    use RefreshDatabase;

    protected function academy(string $name): Academy
    {
        $sport = Sport::firstOrCreate(
            ['slug' => 'badminton'],
            ['name' => 'Badminton'],
        );

        return Academy::create([
            'sport_id' => $sport->id,
            'name' => $name,
            'slug' => str($name)->slug().'-'.uniqid(),
            'status' => 'active',
        ]);
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }

    public function test_user_without_membership_cannot_open_academy_routes(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->get('/coach')->assertForbidden();
    }

    public function test_admin_cannot_switch_into_an_academy_they_do_not_belong_to(): void
    {
        $academyA = $this->academy('Akademi A');
        $academyB = $this->academy('Akademi B');

        $user = User::factory()->create();
        AcademyMembership::create([
            'academy_id' => $academyA->id,
            'user_id' => $user->id,
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($user)
            ->withSession(['current_academy_id' => $academyA->id])
            ->post('/academy/switch', ['academy_id' => $academyB->id])
            ->assertForbidden();
    }

    public function test_parent_can_only_view_their_own_child(): void
    {
        $academy = $this->academy('Akademi Badminton');

        $parent = User::factory()->create();
        AcademyMembership::create([
            'academy_id' => $academy->id,
            'user_id' => $parent->id,
            'role' => 'parent',
            'is_active' => true,
        ]);

        $guardian = Guardian::create([
            'academy_id' => $academy->id,
            'user_id' => $parent->id,
            'full_name' => 'Ibu Sari',
            'relation' => 'mother',
            'phone' => '6281200000002',
            'is_primary' => true,
        ]);

        $member = Member::create([
            'academy_id' => $academy->id,
            'full_name' => 'Aisyah',
            'status' => 'active',
            'level' => 'beginner',
        ]);

        $member->guardians()->attach($guardian->id, ['is_primary' => true]);

        $other = User::factory()->create();
        AcademyMembership::create([
            'academy_id' => $academy->id,
            'user_id' => $other->id,
            'role' => 'parent',
            'is_active' => true,
        ]);

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $academy->id])
            ->get("/portal/children/{$member->id}")
            ->assertOk();

        $this->actingAs($other)
            ->withSession(['current_academy_id' => $academy->id])
            ->get("/portal/children/{$member->id}")
            ->assertForbidden();
    }
}
