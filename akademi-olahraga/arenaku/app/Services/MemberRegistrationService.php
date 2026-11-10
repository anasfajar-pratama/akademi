<?php

namespace App\Services;

use App\Enums\AcademyRole;
use App\Models\Guardian;
use App\Models\Member;
use App\Models\MemberRegistration;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class MemberRegistrationService
{
    public function __construct(
        protected AccountService $accounts,
        protected AcademyProvisioningService $provisioning,
    ) {}

    /**
     * Approve a registration: create the member, guardian and parent account.
     *
     * @param  array<string, mixed>  $options
     * @return array{member: Member, guardian: Guardian, credential: array<string, mixed>}
     */
    public function approve(MemberRegistration $registration, array $options, User $actor): array
    {
        return DB::transaction(function () use ($registration, $options, $actor) {
            $academy = $registration->academy;

            $member = Member::create([
                'academy_id' => $registration->academy_id,
                'branch_id' => $options['branch_id'] ?? $registration->branch_id,
                'package_id' => $options['package_id'] ?? $registration->package_id,
                'member_code' => $this->provisioning->nextMemberCode($academy, $registration->full_name),
                'full_name' => $registration->full_name,
                'nickname' => $registration->nickname,
                'photo_path' => $registration->photo_path,
                'gender' => $registration->gender,
                'birth_date' => $registration->birth_date?->toDateString(),
                'education_level' => $registration->education_level,
                'grade_class' => $registration->grade_class,
                'school_name' => $registration->school_name,
                'address' => $registration->address,
                'city' => $registration->city,
                'postal_code' => $registration->postal_code,
                'joined_at' => now()->toDateString(),
                'level' => $options['level'] ?? 'beginner',
                'status' => 'trial',
                'primary_coach_id' => $options['primary_coach_id'] ?? null,
                'health_notes' => $registration->health_notes,
                'allergy_notes' => $registration->allergy_notes,
                'emergency_name' => $registration->emergency_name,
                'emergency_phone' => $registration->emergency_phone,
                'source' => 'Registrasi online',
                'notes' => $registration->notes,
            ]);

            $guardian = Guardian::withoutGlobalScope('academy')
                ->where('academy_id', $registration->academy_id)
                ->where(function ($query) use ($registration) {
                    $query->where('phone', $registration->guardian_phone);

                    if ($registration->guardian_email) {
                        $query->orWhere('email', $registration->guardian_email);
                    }
                })
                ->first();

            $account = $this->accounts->provision($academy, [
                'name' => $registration->guardian_name,
                'email' => $registration->guardian_email,
                'phone' => $registration->guardian_phone,
            ], AcademyRole::Parent, $actor);

            $guardianAttributes = [
                'user_id' => $account['user']->id,
                'full_name' => $registration->guardian_name,
                'relation' => $registration->guardian_relation,
                'phone' => $registration->guardian_phone,
                'email' => $registration->guardian_email,
                'occupation' => $registration->guardian_occupation,
                'address' => $registration->guardian_address,
                'is_primary' => true,
            ];

            if ($guardian) {
                $guardian->update($guardianAttributes);
            } else {
                $guardian = Guardian::create([
                    'academy_id' => $registration->academy_id,
                    ...$guardianAttributes,
                ]);
            }

            $member->guardians()->syncWithoutDetaching([
                $guardian->id => ['is_primary' => true],
            ]);

            $registration->update([
                'status' => MemberRegistration::STATUS_APPROVED,
                'member_id' => $member->id,
                'guardian_id' => $guardian->id,
                'reviewed_by' => $actor->id,
                'reviewed_at' => now(),
            ]);

            return [
                'member' => $member,
                'guardian' => $guardian,
                'credential' => [
                    'name' => $account['user']->name,
                    'role' => AcademyRole::Parent->value,
                    'role_label' => AcademyRole::Parent->label(),
                    'email' => $account['user']->email,
                    'phone' => $account['user']->phone,
                    'password' => $account['password'],
                    'created' => $account['created'],
                ],
            ];
        });
    }
}
