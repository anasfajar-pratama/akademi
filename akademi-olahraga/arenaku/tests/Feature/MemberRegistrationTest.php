<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Member;
use App\Models\MemberRegistration;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MemberRegistrationTest extends TestCase
{
    use RefreshDatabase;

    protected Academy $academy;

    protected User $admin;

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

        $this->admin = User::factory()->create();

        AcademyMembership::create([
            'academy_id' => $this->academy->id,
            'user_id' => $this->admin->id,
            'role' => 'admin',
            'is_active' => true,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    protected function payload(): array
    {
        return [
            'full_name' => 'Nadia Putri',
            'nickname' => 'Nadia',
            'gender' => 'female',
            'birth_date' => '2015-04-18',
            'education_level' => 'SD',
            'grade_class' => '5B',
            'school_name' => 'SD Negeri 3',
            'address' => 'Jl. Cikutra No. 21',
            'city' => 'Bandung',
            'postal_code' => '40124',
            'guardian_name' => 'Ibu Ratna',
            'guardian_relation' => 'mother',
            'guardian_phone' => '081200000701',
            'guardian_email' => 'ratna@example.test',
            'guardian_occupation' => 'Karyawan',
            'notes' => 'Ingin latihan Sabtu',
            'consent' => true,
        ];
    }

    protected function actingAsAdmin()
    {
        return $this->actingAs($this->admin)
            ->withSession(['current_academy_id' => $this->academy->id]);
    }

    public function test_public_registration_page_opens_with_a_valid_token(): void
    {
        $this->get('/daftar/token-uji')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Public/Register')
                ->where('closed', false)
                ->where('academy.name', 'Akademi Badminton'));
    }

    public function test_closed_registration_link_cannot_be_submitted(): void
    {
        $this->academy->forceFill(['registration_open' => false])->save();

        $this->get('/daftar/token-uji')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('closed', true));

        $this->post('/daftar/token-uji', $this->payload())->assertForbidden();
    }

    public function test_parent_can_submit_a_registration_with_a_photo(): void
    {
        Storage::fake('public');

        $this->post('/daftar/token-uji', [
            ...$this->payload(),
            'photo' => UploadedFile::fake()->image('anak.jpg'),
        ])
            ->assertRedirect('/daftar/token-uji')
            ->assertSessionHas('success', fn (string $message) => str_contains($message, 'Akademi Badminton'));

        $registration = MemberRegistration::withoutGlobalScope('academy')->firstOrFail();

        $this->assertSame(MemberRegistration::STATUS_PENDING, $registration->status);
        $this->assertSame('Nadia Putri', $registration->full_name);
        $this->assertSame('6281200000701', $registration->guardian_phone);
        $this->assertNotNull($registration->photo_path);
        Storage::disk('public')->assertExists($registration->photo_path);
    }

    public function test_photo_is_required_for_public_registration(): void
    {
        $this->post('/daftar/token-uji', $this->payload())
            ->assertSessionHasErrors('photo');

        $this->assertDatabaseCount('member_registrations', 0);
    }

    public function test_admin_can_approve_a_registration_and_parent_account_is_created(): void
    {
        $registration = MemberRegistration::create([
            'academy_id' => $this->academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            ...$this->payload(),
            'guardian_phone' => '6281200000701',
            'photo_path' => null,
        ]);

        $this->actingAsAdmin()
            ->post("/registrations/{$registration->id}/approve", [
                ...$this->payload(),
                'level' => 'beginner',
                'primary_coach_id' => null,
            ])
            ->assertRedirect()
            ->assertSessionHas('credentials');

        $member = Member::where('full_name', 'Nadia Putri')->firstOrFail();

        $this->assertSame('trial', $member->status);
        $this->assertSame($this->academy->id, $member->academy_id);

        $this->assertDatabaseHas('guardians', [
            'academy_id' => $this->academy->id,
            'full_name' => 'Ibu Ratna',
            'phone' => '6281200000701',
        ]);

        $parent = User::where('email', 'ratna@example.test')->firstOrFail();

        $this->assertDatabaseHas('academy_user', [
            'academy_id' => $this->academy->id,
            'user_id' => $parent->id,
            'role' => 'parent',
        ]);

        $this->assertDatabaseHas('member_registrations', [
            'id' => $registration->id,
            'status' => MemberRegistration::STATUS_APPROVED,
            'member_id' => $member->id,
        ]);

        $this->assertTrue(
            $member->guardians()->where('guardians.user_id', $parent->id)->exists(),
        );
    }

    public function test_parent_can_login_with_the_generated_credentials(): void
    {
        $registration = MemberRegistration::create([
            'academy_id' => $this->academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            ...$this->payload(),
            'guardian_phone' => '6281200000701',
        ]);

        $this->actingAsAdmin()
            ->post("/registrations/{$registration->id}/approve", [
                ...$this->payload(),
                'level' => 'beginner',
                'primary_coach_id' => null,
            ])
            ->assertRedirect();

        $password = session('credentials')[0]['password'] ?? null;

        $this->assertNotNull($password);

        $this->post('/logout')->assertRedirect('/login');

        $this->post('/login', [
            'login' => 'ratna@example.test',
            'password' => $password,
        ])->assertRedirect('/dashboard');

        $this->get('/dashboard')->assertRedirect('/password/force');
    }

    public function test_admin_can_edit_and_delete_a_pending_registration(): void
    {
        $registration = MemberRegistration::create([
            'academy_id' => $this->academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            ...$this->payload(),
            'guardian_phone' => '6281200000701',
        ]);

        $this->actingAsAdmin()
            ->put("/registrations/{$registration->id}", [
                ...$this->payload(),
                'full_name' => 'Nadia Putri Ramadhani',
            ])
            ->assertRedirect();

        $this->assertSame('Nadia Putri Ramadhani', $registration->fresh()->full_name);

        $this->actingAsAdmin()
            ->delete("/registrations/{$registration->id}")
            ->assertRedirect('/registrations');

        $this->assertDatabaseMissing('member_registrations', ['id' => $registration->id]);
    }

    public function test_registration_list_is_limited_to_the_current_academy(): void
    {
        $other = Academy::create([
            'sport_id' => $this->academy->sport_id,
            'name' => 'Akademi Lain',
            'slug' => 'akademi-lain',
            'status' => 'active',
            'registration_token' => 'token-lain',
            'registration_open' => true,
        ]);

        MemberRegistration::create([
            'academy_id' => $this->academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            ...$this->payload(),
            'guardian_phone' => '6281200000701',
        ]);

        MemberRegistration::create([
            'academy_id' => $other->id,
            'status' => MemberRegistration::STATUS_PENDING,
            ...$this->payload(),
            'full_name' => 'Anak Akademi Lain',
            'guardian_phone' => '6281200000702',
        ]);

        $this->actingAsAdmin()
            ->get('/registrations')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Registrations/Index')
                ->has('registrations.data', 1)
                ->where('registrations.data.0.full_name', 'Nadia Putri'));
    }
}
