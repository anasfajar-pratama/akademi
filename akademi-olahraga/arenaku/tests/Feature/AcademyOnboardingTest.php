<?php

namespace Tests\Feature;

use App\Models\Skill;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AcademyOnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function sport(): Sport
    {
        $sport = Sport::create(['name' => 'Badminton', 'slug' => 'badminton']);

        Skill::create([
            'academy_id' => null,
            'sport_id' => $sport->id,
            'skill_category_id' => \App\Models\SkillCategory::create([
                'sport_id' => $sport->id,
                'name' => 'Teknik Dasar',
            ])->id,
            'name' => 'Servis',
            'is_active' => true,
        ]);

        return $sport;
    }

    protected function payload(int $sportId): array
    {
        return [
            'academy' => [
                'name' => 'Arenaku Badminton Club',
                'sport_id' => $sportId,
                'city' => 'Bandung',
            ],
            'admins' => [
                ['name' => 'Rina Admin', 'email' => 'rina@arenaku.test'],
            ],
            'coaches' => [
                ['name' => 'Coach Budi', 'email' => 'budi@arenaku.test'],
            ],
            'members' => [
                [
                    'full_name' => 'Aisyah Putri',
                    'gender' => 'female',
                    'guardian_name' => 'Ibu Sari',
                    'guardian_phone' => '081200000003',
                    'guardian_email' => 'sari@arenaku.test',
                ],
            ],
        ];
    }

    public function test_super_admin_can_provision_an_academy_with_accounts(): void
    {
        Notification::fake();

        $sport = $this->sport();
        $super = User::factory()->create(['is_super_admin' => true]);

        $response = $this->actingAs($super)->post('/academies', $this->payload($sport->id));

        $response->assertRedirect();
        $response->assertSessionHas('credentials');

        $this->assertDatabaseHas('academies', ['name' => 'Arenaku Badminton Club']);
        $this->assertDatabaseHas('academy_user', ['role' => 'admin']);
        $this->assertDatabaseHas('academy_user', ['role' => 'coach']);
        $this->assertDatabaseHas('academy_user', ['role' => 'parent']);
        $this->assertDatabaseHas('members', ['full_name' => 'Aisyah Putri']);
        $this->assertDatabaseHas('guardians', ['full_name' => 'Ibu Sari']);

        $admin = User::where('email', 'rina@arenaku.test')->first();
        $this->assertNotNull($admin);
        $this->assertTrue($admin->must_change_password);
    }

    public function test_non_super_admin_cannot_create_an_academy(): void
    {
        $sport = $this->sport();
        $user = User::factory()->create(['is_super_admin' => false]);

        $this->actingAs($user)
            ->post('/academies', $this->payload($sport->id))
            ->assertForbidden();

        $this->assertDatabaseCount('academies', 0);
    }

    public function test_each_admin_must_have_email_or_phone(): void
    {
        $sport = $this->sport();
        $super = User::factory()->create(['is_super_admin' => true]);

        $payload = $this->payload($sport->id);
        $payload['admins'] = [['name' => 'Tanpa Kontak']];

        $this->actingAs($super)
            ->post('/academies', $payload)
            ->assertSessionHasErrors('admins.0.email');
    }

    public function test_new_account_is_forced_to_change_password(): void
    {
        $sport = $this->sport();
        $super = User::factory()->create(['is_super_admin' => true]);
        $this->actingAs($super)->post('/academies', $this->payload($sport->id));

        $admin = User::where('email', 'rina@arenaku.test')->firstOrFail();

        $this->actingAs($admin)
            ->get('/dashboard')
            ->assertRedirect('/password/force');
    }
}
