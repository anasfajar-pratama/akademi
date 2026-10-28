<?php

namespace App\Services;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\CoachProfile;
use App\Models\Guardian;
use App\Models\Member;
use App\Models\Skill;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AcademyProvisioningService
{
    public function __construct(
        protected AcademyRoleProvisioner $roles,
        protected AccountService $accounts,
    ) {}

    /**
     * Provision an academy together with its first admin, coach and member accounts.
     *
     * @param  array<string, mixed>  $payload
     * @return array{academy: Academy, credentials: array<int, array<string, mixed>>}
     */
    public function provision(array $payload, User $actor): array
    {
        return DB::transaction(function () use ($payload, $actor) {
            $data = $payload['academy'];

            $academy = Academy::create([
                'sport_id' => $data['sport_id'],
                'name' => $data['name'],
                'slug' => $this->uniqueSlug($data['name']),
                'owner_user_id' => $actor->id,
                'brand_color' => $data['brand_color'] ?? '#0B1220',
                'address' => $data['address'] ?? null,
                'city' => $data['city'] ?? null,
                'phone' => PhoneNumber::normalize($data['phone'] ?? null),
                'email' => $data['email'] ?? null,
                'timezone' => $data['timezone'] ?? 'Asia/Jakarta',
                'status' => 'active',
            ]);

            $this->roles->ensureForAcademy($academy);
            $this->copySkillTemplates($academy);

            $credentials = [];

            foreach ($payload['admins'] ?? [] as $person) {
                $result = $this->accounts->provision($academy, $person, AcademyRole::Admin, $actor);
                $credentials[] = $this->credentialRow($academy, $result, AcademyRole::Admin);
            }

            foreach ($payload['coaches'] ?? [] as $person) {
                $result = $this->accounts->provision($academy, $person, AcademyRole::Coach, $actor);

                CoachProfile::create([
                    'academy_id' => $academy->id,
                    'user_id' => $result['user']->id,
                    'specialization' => $person['specialization'] ?? null,
                ]);

                $credentials[] = $this->credentialRow($academy, $result, AcademyRole::Coach);
            }

            foreach ($payload['members'] ?? [] as $person) {
                $member = $this->createMember($academy, $person);
                $credentials[] = [
                    'name' => $member->full_name,
                    'role' => AcademyRole::Member->value,
                    'role_label' => AcademyRole::Member->label(),
                    'email' => null,
                    'phone' => null,
                    'password' => null,
                    'created' => true,
                    'note' => 'Member '.$member->member_code,
                ];

                if (! empty($person['guardian_name']) && ! empty($person['guardian_phone'])) {
                    $guardian = $this->createGuardian($academy, $member, $person);

                    if (! empty($person['guardian_email']) || ! empty($person['guardian_phone'])) {
                        $result = $this->accounts->provision($academy, [
                            'name' => $guardian->full_name,
                            'email' => $person['guardian_email'] ?? null,
                            'phone' => $guardian->phone,
                            'password' => null,
                        ], AcademyRole::Parent, $actor);

                        $guardian->update(['user_id' => $result['user']->id]);
                        $credentials[] = $this->credentialRow($academy, $result, AcademyRole::Parent);
                    }
                }
            }

            return ['academy' => $academy, 'credentials' => $credentials];
        });
    }

    protected function createMember(Academy $academy, array $data): Member
    {
        return Member::create([
            'academy_id' => $academy->id,
            'member_code' => $this->nextMemberCode($academy, $data['full_name']),
            'full_name' => $data['full_name'],
            'nickname' => $data['nickname'] ?? null,
            'gender' => $data['gender'] ?? null,
            'birth_date' => $data['birth_date'] ?? null,
            'joined_at' => now()->toDateString(),
            'level' => $data['level'] ?? 'beginner',
            'status' => $data['status'] ?? 'trial',
        ]);
    }

    protected function createGuardian(Academy $academy, Member $member, array $data): Guardian
    {
        $guardian = Guardian::create([
            'academy_id' => $academy->id,
            'full_name' => $data['guardian_name'],
            'relation' => $data['guardian_relation'] ?? 'guardian',
            'phone' => PhoneNumber::normalize($data['guardian_phone']),
            'email' => $data['guardian_email'] ?? null,
            'is_primary' => true,
        ]);

        $member->guardians()->attach($guardian->id, ['is_primary' => true]);

        return $guardian;
    }

    public function copySkillTemplates(Academy $academy): void
    {
        $templates = Skill::withoutGlobalScope('academy')
            ->whereNull('academy_id')
            ->where('sport_id', $academy->sport_id)
            ->get();

        foreach ($templates as $template) {
            Skill::create([
                'academy_id' => $academy->id,
                'sport_id' => $template->sport_id,
                'skill_category_id' => $template->skill_category_id,
                'name' => $template->name,
                'description' => $template->description,
                'rubric' => $template->rubric,
                'sort_order' => $template->sort_order,
                'is_active' => true,
            ]);
        }
    }

    /**
     * @param  array{user: User, password: ?string, created: bool}  $result
     * @return array<string, mixed>
     */
    protected function credentialRow(Academy $academy, array $result, AcademyRole $role): array
    {
        return [
            'name' => $result['user']->name,
            'role' => $role->value,
            'role_label' => $role->label(),
            'email' => $result['user']->email,
            'phone' => $result['user']->phone,
            'password' => $result['password'],
            'created' => $result['created'],
        ];
    }

    public function nextMemberCode(Academy $academy, string $fullName): string
    {
        $prefix = strtoupper(substr($academy->sport->slug ?? 'AKD', 0, 3));
        $year = now()->year;

        $count = Member::withoutGlobalScope('academy')
            ->where('academy_id', $academy->id)
            ->whereYear('created_at', $year)
            ->count() + 1;

        return sprintf('%s-%d-%04d', $prefix, $year, $count);
    }

    protected function uniqueSlug(string $name): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (Academy::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.$i++;
        }

        return $slug;
    }
}
