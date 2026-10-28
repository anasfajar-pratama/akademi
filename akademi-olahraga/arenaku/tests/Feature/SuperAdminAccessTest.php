<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SuperAdminAccessTest extends TestCase
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

    public function test_super_admin_without_active_academy_is_redirected_instead_of_403(): void
    {
        $super = User::factory()->create(['is_super_admin' => true]);

        $this->actingAs($super)->get('/members')->assertRedirect('/academies');
        $this->actingAs($super)->get('/settings')->assertRedirect('/academies');
        $this->actingAs($super)->get('/schedules')->assertRedirect('/academies');
    }

    public function test_super_admin_can_open_academy_pages_after_selecting_an_academy(): void
    {
        $academy = $this->academy();
        $super = User::factory()->create(['is_super_admin' => true]);

        $session = ['current_academy_id' => $academy->id];

        $this->actingAs($super)->withSession($session)->get('/members')->assertOk();
        $this->actingAs($super)->withSession($session)->get('/settings')->assertOk();
        $this->actingAs($super)->withSession($session)->get('/schedules')->assertOk();
        $this->actingAs($super)->withSession($session)->get('/dashboard')->assertOk();
    }

    public function test_opening_an_academy_sets_it_as_the_active_academy(): void
    {
        $academy = $this->academy();
        $super = User::factory()->create(['is_super_admin' => true]);

        $this->actingAs($super)
            ->get("/academies/{$academy->id}")
            ->assertOk()
            ->assertSessionHas('current_academy_id', $academy->id);
    }

    public function test_academy_list_is_shared_only_for_super_admin(): void
    {
        $this->academy();

        $super = User::factory()->create(['is_super_admin' => true]);
        $normal = User::factory()->create(['is_super_admin' => false]);

        $this->actingAs($super)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->has('academies', 1));

        $this->actingAs($normal)
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->has('academies', 0));
    }
}
