<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\Skill;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class SkillPolicy
{
    protected function role(User $user): ?AcademyRole
    {
        $current = app(CurrentAcademy::class);

        return $current->check() ? $user->roleIn($current->get()) : null;
    }

    public function viewAny(User $user): bool
    {
        return $user->is_super_admin
            || in_array($this->role($user), [AcademyRole::Admin, AcademyRole::Coach], true);
    }

    public function create(User $user): bool
    {
        return $this->viewAny($user);
    }

    public function delete(User $user, Skill $skill): bool
    {
        return $user->is_super_admin
            || ($skill->academy_id === app(CurrentAcademy::class)->id()
                && in_array($this->role($user), [AcademyRole::Admin, AcademyRole::Coach], true));
    }
}
