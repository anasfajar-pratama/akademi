<?php

namespace Database\Seeders;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\CoachProfile;
use App\Models\MemberRegistration;
use App\Services\AccountService;
use Illuminate\Database\Seeder;

class AdminCoachSeeder extends Seeder
{
    public function run(): void
    {
        $academy = Academy::where('slug', 'arena-badminton')->first();

        if (! $academy) {
            return;
        }

        $academy->ensureRegistrationToken();
        $academy->forceFill(['registration_open' => true])->save();

        $result = app(AccountService::class)->provision($academy, [
            'name' => 'Coach Iwan',
            'email' => 'pbhamas@kebunkode.com',
            'password' => 'pbhamas1234',
        ], AcademyRole::AdminCoach, null, false);

        $result['user']->forceFill([
            'must_change_password' => false,
            'email_verified_at' => now(),
        ])->save();

        CoachProfile::firstOrCreate(
            ['academy_id' => $academy->id, 'user_id' => $result['user']->id],
            ['specialization' => 'Kepelatihan & operasional'],
        );

        if (MemberRegistration::withoutGlobalScope('academy')->where('academy_id', $academy->id)->exists()) {
            return;
        }

        MemberRegistration::withoutGlobalScope('academy')->create([
            'academy_id' => $academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            'full_name' => 'Nadia Putri Ramadhani',
            'nickname' => 'Nadia',
            'gender' => 'female',
            'birth_date' => '2015-04-18',
            'education_level' => 'SD',
            'grade_class' => '5B',
            'school_name' => 'SD Negeri 3 Bandung',
            'address' => 'Jl. Cikutra No. 21',
            'city' => 'Bandung',
            'postal_code' => '40124',
            'guardian_name' => 'Ibu Ratna Dewi',
            'guardian_relation' => 'mother',
            'guardian_phone' => '6281200000701',
            'guardian_email' => 'ratna.dewi@example.test',
            'guardian_occupation' => 'Karyawan swasta',
            'consent' => true,
        ]);

        MemberRegistration::withoutGlobalScope('academy')->create([
            'academy_id' => $academy->id,
            'status' => MemberRegistration::STATUS_PENDING,
            'full_name' => 'Raka Aditya Pratama',
            'nickname' => 'Raka',
            'gender' => 'male',
            'birth_date' => '2013-09-02',
            'education_level' => 'SMP',
            'grade_class' => '7A',
            'school_name' => 'SMP Pasundan 1',
            'address' => 'Jl. Sukajadi No. 88',
            'city' => 'Bandung',
            'postal_code' => '40162',
            'guardian_name' => 'Bapak Andi Pratama',
            'guardian_relation' => 'father',
            'guardian_phone' => '6281200000702',
            'guardian_email' => 'andi.pratama@example.test',
            'guardian_occupation' => 'Wiraswasta',
            'allergy_notes' => 'Alergi debu',
            'consent' => true,
        ]);
    }
}
