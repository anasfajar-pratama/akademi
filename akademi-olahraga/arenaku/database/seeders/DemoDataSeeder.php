<?php

namespace Database\Seeders;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\Assessment;
use App\Models\AttendanceSession;
use App\Models\Branch;
use App\Models\CoachProfile;
use App\Models\Guardian;
use App\Models\Invoice;
use App\Models\Member;
use App\Models\Package;
use App\Models\Schedule;
use App\Models\SessionAttendance;
use App\Models\Skill;
use App\Models\Sport;
use App\Models\User;
use App\Services\AccountService;
use App\Services\AcademyProvisioningService;
use App\Services\AcademyRoleProvisioner;
use App\Services\BillingService;
use Illuminate\Database\Seeder;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        if (Academy::where('slug', 'arena-badminton')->exists()) {
            return;
        }

        $sport = Sport::where('slug', 'badminton')->firstOrFail();
        $super = User::where('email', 'super@arenaku.test')->first();

        $academy = Academy::create([
            'sport_id' => $sport->id,
            'name' => 'Arena Badminton Club',
            'slug' => 'arena-badminton',
            'owner_user_id' => $super?->id,
            'brand_color' => '#0B1220',
            'city' => 'Bandung',
            'address' => 'Jl. Merdeka No. 10',
            'phone' => '6281200000100',
            'email' => 'hello@arenabadminton.test',
            'status' => 'active',
        ]);

        app(AcademyRoleProvisioner::class)->ensureForAcademy($academy);

        // Salin template skill cabang ke akademi ini.
        app(AcademyProvisioningService::class)->copySkillTemplates($academy);

        $accounts = app(AccountService::class);

        $admin = $accounts->provision($academy, [
            'name' => 'Rina Kartika',
            'email' => 'admin@arenaku.test',
            'password' => 'password',
        ], AcademyRole::Admin, $super, false)['user'];

        $coach = $accounts->provision($academy, [
            'name' => 'Coach Budi',
            'email' => 'coach@arenaku.test',
            'password' => 'password',
        ], AcademyRole::Coach, $super, false)['user'];

        $parent = $accounts->provision($academy, [
            'name' => 'Bunda Sari',
            'email' => 'ortu@arenaku.test',
            'password' => 'password',
        ], AcademyRole::Parent, $super, false)['user'];

        User::whereIn('id', [$admin->id, $coach->id, $parent->id])
            ->update(['must_change_password' => false, 'email_verified_at' => now()]);

        CoachProfile::create([
            'academy_id' => $academy->id,
            'user_id' => $coach->id,
            'specialization' => 'Footwork & fisik',
        ]);

        $gor = Branch::create([
            'academy_id' => $academy->id,
            'name' => 'GOR Melati',
            'address' => 'Jl. Melati No. 5',
            'city' => 'Bandung',
            'latitude' => -6.9147440,
            'longitude' => 107.6098100,
            'maps_url' => 'https://www.google.com/maps/search/?api=1&query=-6.914744,107.609810',
        ]);

        Branch::create([
            'academy_id' => $academy->id,
            'name' => 'GOR Cendrawasih',
            'address' => 'Jl. Cendrawasih No. 12',
            'city' => 'Bandung',
        ]);

        $beginner = Package::create([
            'academy_id' => $academy->id,
            'branch_id' => $gor->id,
            'name' => 'Reguler Beginner U-12',
            'level' => 'beginner',
            'monthly_price' => 450000,
            'sessions_per_month' => 8,
            'duration_minutes' => 240,
        ]);

        Package::create([
            'academy_id' => $academy->id,
            'branch_id' => $gor->id,
            'name' => 'Intermediate Prestasi',
            'level' => 'intermediate',
            'monthly_price' => 650000,
            'sessions_per_month' => 8,
            'duration_minutes' => 240,
        ]);

        Package::create([
            'academy_id' => $academy->id,
            'branch_id' => $gor->id,
            'name' => 'Advanced Kompetitif',
            'level' => 'advanced',
            'monthly_price' => 850000,
            'sessions_per_month' => 8,
            'duration_minutes' => 240,
        ]);

        $parentGuardian = Guardian::create([
            'academy_id' => $academy->id,
            'user_id' => $parent->id,
            'full_name' => 'Bunda Sari',
            'relation' => 'mother',
            'phone' => '6281200000200',
            'email' => 'ortu@arenaku.test',
            'occupation' => 'Ibu rumah tangga',
            'is_primary' => true,
        ]);

        $membersData = [
            ['Aisyah Putri', 'Aisyah', 'female', '2014-03-12', 'beginner', 'active', 'Bunda Sari', 'mother', '6281200000200', true],
            ['Bagas Pratama', 'Bagas', 'male', '2012-08-01', 'intermediate', 'active', 'Bunda Sari', 'mother', '6281200000200', true],
            ['Citra Lestari', 'Citra', 'female', '2013-05-20', 'beginner', 'active', 'Bapak Hendra', 'father', '6281200000300', false],
            ['Dimas Saputra', 'Dimas', 'male', '2011-11-30', 'advanced', 'active', 'Ibu Wati', 'mother', '6281200000400', false],
            ['Eka Nuraini', 'Eka', 'female', '2015-01-09', 'beginner', 'trial', 'Bapak Yusuf', 'father', '6281200000500', false],
            ['Farhan Maulana', 'Farhan', 'male', '2014-07-17', 'beginner', 'inactive', 'Ibu Nia', 'mother', '6281200000600', false],
        ];

        $members = [];

        foreach ($membersData as $index => [$name, $nickname, $gender, $birth, $level, $status, $guardianName, $relation, $phone, $linkedToParent]) {
            $member = Member::create([
                'academy_id' => $academy->id,
                'branch_id' => $gor->id,
                'package_id' => $beginner->id,
                'member_code' => sprintf('BAD-%d-%04d', now()->year, $index + 1),
                'full_name' => $name,
                'nickname' => $nickname,
                'gender' => $gender,
                'birth_date' => $birth,
                'level' => $level,
                'status' => $status,
                'primary_coach_id' => $coach->id,
                'joined_at' => now()->subMonths(6)->toDateString(),
            ]);

            if ($linkedToParent) {
                $member->guardians()->attach($parentGuardian->id, ['is_primary' => true]);
            } else {
                $guardian = Guardian::create([
                    'academy_id' => $academy->id,
                    'full_name' => $guardianName,
                    'relation' => $relation,
                    'phone' => $phone,
                    'is_primary' => true,
                ]);
                $member->guardians()->attach($guardian->id, ['is_primary' => true]);
            }

            $members[] = $member;
        }

        // Latihan rutin Sabtu & Minggu, 16.00–20.00.
        $saturday = now()->startOfWeek()->addDays(5);
        $activeMembers = array_slice($members, 0, 5);
        $skills = Skill::where('academy_id', $academy->id)->orderBy('id')->take(3)->get();
        $statuses = ['present', 'present', 'late', 'absent', 'permitted'];
        $openSessionCreated = false;

        for ($week = -2; $week <= 1; $week++) {
            foreach ([0, 1] as $dayOffset) {
                $start = $saturday->copy()->addWeeks($week)->addDays($dayOffset)->setTime(16, 0);

                $schedule = Schedule::create([
                    'academy_id' => $academy->id,
                    'branch_id' => $gor->id,
                    'package_id' => $beginner->id,
                    'type' => 'training',
                    'title' => 'Latihan Rutin '.($dayOffset === 0 ? 'Sabtu' : 'Minggu'),
                    'coach_id' => $coach->id,
                    'starts_at' => $start,
                    'ends_at' => $start->copy()->addHours(4),
                    'location_name' => $gor->name,
                    'address' => $gor->address,
                    'latitude' => $gor->latitude,
                    'longitude' => $gor->longitude,
                    'maps_url' => $gor->maps_url,
                    'status' => 'published',
                    'created_by' => $admin->id,
                ]);

                if ($start->isPast()) {
                    $session = AttendanceSession::create([
                        'academy_id' => $academy->id,
                        'schedule_id' => $schedule->id,
                        'branch_id' => $gor->id,
                        'coach_id' => $coach->id,
                        'title' => $schedule->title,
                        'session_date' => $start->toDateString(),
                        'started_at' => $start,
                        'ended_at' => $start->copy()->addHours(4),
                        'status' => 'closed',
                        'attendance_filled_at' => $start->copy()->addHours(4),
                    ]);

                    foreach ($activeMembers as $index => $member) {
                        $status = $statuses[$index] ?? 'present';

                        SessionAttendance::create([
                            'attendance_session_id' => $session->id,
                            'member_id' => $member->id,
                            'status' => $status,
                        ]);

                        if (! in_array($status, ['present', 'late'], true)) {
                            continue;
                        }

                        foreach ($skills as $skillIndex => $skill) {
                            Assessment::create([
                                'academy_id' => $academy->id,
                                'member_id' => $member->id,
                                'skill_id' => $skill->id,
                                'attendance_session_id' => $session->id,
                                'assessed_by' => $coach->id,
                                'score' => min(5, 2 + ($week + 2) + (($index + $skillIndex) % 2)),
                                'note' => null,
                                'period' => $start->format('Y-m'),
                                'assessed_at' => $start->toDateString(),
                            ]);
                        }
                    }

                    continue;
                }

                // Sesi terdekat dibuka tanpa absensi, untuk mencoba alur absensi → penilaian.
                if (! $openSessionCreated) {
                    $openSessionCreated = true;

                    $session = AttendanceSession::create([
                        'academy_id' => $academy->id,
                        'schedule_id' => $schedule->id,
                        'branch_id' => $gor->id,
                        'coach_id' => $coach->id,
                        'title' => $schedule->title,
                        'session_date' => $start->toDateString(),
                        'started_at' => now(),
                        'status' => 'open',
                    ]);

                    foreach ($activeMembers as $member) {
                        SessionAttendance::create([
                            'attendance_session_id' => $session->id,
                            'member_id' => $member->id,
                            'status' => 'present',
                        ]);
                    }
                }
            }
        }

        // Tagihan & pembayaran contoh: bulan lalu lunas, bulan ini sebagian.
        $billing = app(BillingService::class);
        $billing->generateForAcademy($academy, now()->subMonthNoOverflow());
        $billing->generateForAcademy($academy, now());

        $invoices = Invoice::withoutGlobalScope('academy')
            ->where('academy_id', $academy->id)
            ->orderBy('id')
            ->get();

        foreach ($invoices as $index => $invoice) {
            if ($invoice->period_start->isSameMonth(now()->subMonthNoOverflow())) {
                $billing->recordPayment($invoice, [
                    'amount' => $invoice->total,
                    'method' => $index % 2 === 0 ? 'transfer' : 'cash',
                    'paid_at' => $invoice->due_date,
                ], $admin);

                continue;
            }

            if ($index % 3 !== 0) {
                $billing->recordPayment($invoice, [
                    'amount' => (int) (round($invoice->total / 2 / 1000) * 1000),
                    'method' => 'transfer',
                    'paid_at' => now(),
                ], $admin);
            }
        }
    }
}
