<?php

namespace App\Policies;

use App\Enums\AcademyRole;
use App\Models\Academy;
use App\Models\User;

class AcademyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->is_super_admin;
    }

    public function view(User $user, Academy $academy): bool
    {
        return $user->is_super_admin || $user->belongsToAcademy($academy);
    }

    public function create(User $user): bool
    {
        return $user->is_super_admin;
    }

    public function update(User $user, Academy $academy): bool
    {
        return $user->is_super_admin
            || $user->hasRoleIn($academy, AcademyRole::Admin);
    }

    public function delete(User $user, Academy $academy): bool
    {
        return $user->is_super_admin;
    }
}
