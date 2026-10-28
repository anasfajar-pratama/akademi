<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\Member;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class MemberPolicy
{
    protected function isAdmin(User $user): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        $current = app(CurrentAcademy::class);

        return $current->check() && $user->hasRoleIn($current->get(), AcademyRole::Admin);
    }

    public function viewAny(User $user): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        $current = app(CurrentAcademy::class);

        return $current->check()
            && $user->hasRoleIn($current->get(), AcademyRole::Admin, AcademyRole::Coach);
    }

    public function create(User $user): bool
    {
        return $this->isAdmin($user);
    }

    public function view(User $user, Member $member): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        if ($member->academy_id !== app(CurrentAcademy::class)->id()) {
            return false;
        }

        return match ($user->roleIn($member->academy)) {
            AcademyRole::Admin, AcademyRole::Coach => true,
            AcademyRole::Parent => $member->guardians()
                ->where('guardians.user_id', $user->id)
                ->exists(),
            default => false,
        };
    }

    public function update(User $user, Member $member): bool
    {
        return $this->isAdmin($user);
    }

    public function delete(User $user, Member $member): bool
    {
        return $this->isAdmin($user);
    }
}
