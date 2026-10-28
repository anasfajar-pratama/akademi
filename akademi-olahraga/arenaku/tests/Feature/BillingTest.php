<?php

namespace Tests\Feature;

use App\Models\Academy;
use App\Models\AcademyMembership;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\Package;
use App\Models\Sport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    protected Academy $academy;

    protected User $admin;

    protected Package $package;

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

        $this->package = Package::create([
            'academy_id' => $this->academy->id,
            'name' => 'Reguler',
            'level' => 'beginner',
            'monthly_price' => 450000,
            'sessions_per_month' => 8,
        ]);

        $this->admin = $this->attach(User::factory()->create(), 'admin');
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

    protected function member(string $name, string $joinedAt): Member
    {
        return Member::create([
            'academy_id' => $this->academy->id,
            'package_id' => $this->package->id,
            'full_name' => $name,
            'level' => 'beginner',
            'status' => 'active',
            'joined_at' => $joinedAt,
        ]);
    }

    protected function asAdmin()
    {
        return $this->actingAs($this->admin)
            ->withSession(['current_academy_id' => $this->academy->id]);
    }

    public function test_generate_creates_invoices_and_is_idempotent(): void
    {
        $this->member('Aisyah', '2026-10-01');
        $this->member('Bagas', '2026-10-01');

        $this->asAdmin()->post('/invoices/generate', ['period' => '2026-10'])->assertRedirect();
        $this->assertDatabaseCount('invoices', 2);
        $this->assertDatabaseHas('invoices', ['total' => 450000, 'status' => 'unpaid']);

        // Menjalankan lagi tidak boleh menggandakan periode yang sama.
        $this->asAdmin()->post('/invoices/generate', ['period' => '2026-10'])->assertRedirect();
        $this->assertDatabaseCount('invoices', 2);
    }

    public function test_prorata_is_applied_for_mid_month_join(): void
    {
        $this->member('Citra', '2026-10-16');

        $this->asAdmin()->post('/invoices/generate', ['period' => '2026-10'])->assertRedirect();

        // 16 dari 31 hari → 450.000 × 16/31 ≈ 232.000 (dibulatkan ke ribuan)
        $this->assertDatabaseHas('invoices', ['total' => 232000]);
    }

    public function test_recording_payments_updates_invoice_status(): void
    {
        $member = $this->member('Dimas', '2026-10-01');
        $this->asAdmin()->post('/invoices/generate', ['period' => '2026-10'])->assertRedirect();

        $invoice = Invoice::firstOrFail();
        $this->assertSame($member->id, $invoice->member_id);

        $this->asAdmin()
            ->post("/invoices/{$invoice->id}/payments", ['amount' => 200000, 'method' => 'transfer'])
            ->assertRedirect();

        $invoice->refresh();
        $this->assertSame('partial', $invoice->status);
        $this->assertSame(200000, $invoice->paid_amount);

        $this->asAdmin()
            ->post("/invoices/{$invoice->id}/payments", ['amount' => 250000, 'method' => 'cash'])
            ->assertRedirect();

        $invoice->refresh();
        $this->assertSame('paid', $invoice->status);
        $this->assertSame(450000, $invoice->paid_amount);
        $this->assertNotNull($invoice->paid_at);
    }

    public function test_parent_cannot_open_the_finance_pages(): void
    {
        $parent = $this->attach(User::factory()->create(), 'parent');

        $this->actingAs($parent)
            ->withSession(['current_academy_id' => $this->academy->id])
            ->get('/invoices')
            ->assertForbidden();
    }
}
