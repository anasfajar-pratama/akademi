<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\User;
use App\Tenancy\CurrentAcademy;

class AssessmentPolicy
{
    public function viewAny(User $user): bool
    {
        if ($user->is_super_admin) {
            return true;
        }

        $current = app(CurrentAcademy::class);

        return $current->check()
            && in_array($user->roleIn($current->get()), [AcademyRole::Admin, AcademyRole::Coach], true);
    }
}
